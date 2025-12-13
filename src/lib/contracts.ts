import { base } from "wagmi/chains";

// Contract address on Base Mainnet
export const DIAMOND_HANDS_ADDRESS = "0xF067F58AD97F87abC8822F3FFDbB4b4CAE1Ed130" as const;

// Contract ABI (simplified for frontend use)
export const DIAMOND_HANDS_ABI = [
  {
    inputs: [
      { name: "player", type: "address" },
      { name: "duration", type: "uint256" },
      { name: "fudMessages", type: "string[]" },
    ],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "hodlResults",
    outputs: [
      { name: "duration", type: "uint256" },
      { name: "isDiamondHands", type: "bool" },
      { name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DIAMOND_THRESHOLD",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "player", type: "address" },
      { indexed: false, name: "tokenId", type: "uint256" },
      { indexed: false, name: "duration", type: "uint256" },
    ],
    name: "DiamondHandsMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "player", type: "address" },
      { indexed: false, name: "tokenId", type: "uint256" },
      { indexed: false, name: "duration", type: "uint256" },
    ],
    name: "PaperHandsMinted",
    type: "event",
  },
] as const;

export const CONTRACT_CONFIG = {
  address: DIAMOND_HANDS_ADDRESS,
  abi: DIAMOND_HANDS_ABI,
  chainId: base.id,
} as const;
