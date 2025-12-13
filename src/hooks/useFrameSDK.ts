"use client";

import { useEffect, useState, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function useFrameSDK() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    sdk.actions.ready();
    setIsSDKLoaded(true);
  }, []);

  return {
    isSDKLoaded,
    sdk,
  };
}
