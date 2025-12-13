"use client";

import { useEffect, useState, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface SDKContext {
  client?: {
    clientFid?: number;
    added?: boolean;
    clientProtocol?: string;
  };
}

type Platform = "base" | "farcaster" | "browser";

// Check if Coinbase Wallet provider is present
function isCoinbaseWallet(): boolean {
  if (typeof window === "undefined") return false;

  const ethereum = window.ethereum as {
    isCoinbaseWallet?: boolean;
    isCoinbaseBrowser?: boolean;
    providers?: Array<{ isCoinbaseWallet?: boolean }>;
  } | undefined;

  if (!ethereum) return false;

  // Direct check
  if (ethereum.isCoinbaseWallet || ethereum.isCoinbaseBrowser) return true;

  // Check providers array (when multiple wallets)
  if (ethereum.providers) {
    return ethereum.providers.some(p => p.isCoinbaseWallet);
  }

  return false;
}

export function useFrameSDK() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<SDKContext | null>(null);
  const [platform, setPlatform] = useState<Platform>("browser");
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const init = async () => {
      // Log debug info
      const ua = navigator.userAgent;
      console.log("[Platform] UserAgent:", ua);
      console.log("[Platform] isCoinbaseWallet:", isCoinbaseWallet());
      console.log("[Platform] window.parent !== window:", window.parent !== window);

      // Fetch server-side view of headers for debugging
      try {
        const debugRes = await fetch("/api/debug/headers");
        const debugData = await debugRes.json();
        console.log("[Platform] Server-side headers:", debugData);
      } catch (e) {
        console.log("[Platform] Failed to fetch debug headers:", e);
      }

      // Try to get SDK context first
      let ctx: SDKContext | null = null;
      let hasSDKContext = false;
      try {
        ctx = await sdk.context as SDKContext;
        setContext(ctx);
        hasSDKContext = !!ctx;
        console.log("[SDK] Context:", ctx);
      } catch {
        console.log("[SDK] Not in mini app context");
      }

      // Detect platform based on multiple signals
      let detectedPlatform: Platform = "browser";
      const uaLower = ua.toLowerCase();

      // Key insight from debugging:
      // - Farcaster UA contains "warpcast"
      // - Base app UA is generic iOS Safari (no special identifier)
      // - So: if "warpcast" in UA → Farcaster, if SDK context but no "warpcast" → Base

      const isWarpcastUA = uaLower.includes("warpcast");
      const isInIframe = window.parent !== window || window.self !== window.top;

      console.log("[Platform] isWarpcastUA:", isWarpcastUA);
      console.log("[Platform] isInIframe:", isInIframe);
      console.log("[Platform] hasSDKContext:", hasSDKContext);

      // 1. Check user agent for Warpcast (definitive for Farcaster)
      if (isWarpcastUA) {
        detectedPlatform = "farcaster";
      }
      // 2. SDK context exists but NOT Warpcast UA → Base app
      else if (hasSDKContext && !isWarpcastUA) {
        detectedPlatform = "base";
      }
      // 3. In iframe but NOT Warpcast UA → likely Base app
      else if (isInIframe && !isWarpcastUA) {
        detectedPlatform = "base";
      }
      // 4. Coinbase Wallet provider detected
      else if (isCoinbaseWallet()) {
        detectedPlatform = "base";
      }
      // 5. Otherwise browser
      else {
        detectedPlatform = "browser";
      }

      console.log("[Platform] Detected:", detectedPlatform);
      setPlatform(detectedPlatform);

      sdk.actions.ready();
      setIsSDKLoaded(true);
    };

    init();
  }, []);

  return {
    isSDKLoaded,
    platform,
    context,
    sdk,
  };
}
