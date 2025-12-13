import { base } from "wagmi/chains";

// Contract address on Base Mainnet
export const DIAMOND_HANDS_ADDRESS = "0x9Bb287c1cC354490331385e0213B5B4Ec1a75068" as const;

// Contract ABI (simplified for frontend use)
export const DIAMOND_HANDS_ABI = [
  {
    inputs: [
      { name: "player", type: "address" },
      { name: "duration", type: "uint256" },
      { name: "messages", type: "string[]" },
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
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const CONTRACT_CONFIG = {
  address: DIAMOND_HANDS_ADDRESS,
  abi: DIAMOND_HANDS_ABI,
  chainId: base.id,
} as const;
