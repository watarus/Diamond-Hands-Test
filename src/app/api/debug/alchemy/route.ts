import { NextResponse } from "next/server";
import { Alchemy, Network, AssetTransfersCategory } from "alchemy-sdk";

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
  url: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "No address" }, { status: 400 });
  }

  try {
    // 各APIを個別に呼び出してエラーを特定
    const results: Record<string, unknown> = {};

    try {
      const ethBalance = await alchemy.core.getBalance(address);
      results.ethBalance = ethBalance.toString();
      results.ethBalanceFormatted = (Number(ethBalance) / 1e18).toFixed(4);
    } catch (e) {
      results.ethBalanceError = String(e);
    }

    try {
      const nfts = await alchemy.nft.getNftsForOwner(address, { pageSize: 10 });
      results.nftCount = nfts.totalCount;
      results.nfts = nfts.ownedNfts.slice(0, 5).map(nft => ({
        name: nft.contract.name,
        symbol: nft.contract.symbol,
        tokenId: nft.tokenId,
      }));
    } catch (e) {
      results.nftError = String(e);
    }

    try {
      const transfers = await alchemy.core.getAssetTransfers({
        fromAddress: address,
        category: [AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721],
        maxCount: 10,
      });
      results.transferCount = transfers.transfers.length;
      results.transfers = transfers.transfers.slice(0, 5).map(t => ({
        asset: t.asset,
        value: t.value,
        category: t.category,
      }));
    } catch (e) {
      results.transferError = String(e);
    }

    try {
      const tokens = await alchemy.core.getTokenBalances(address);
      results.tokenCount = tokens.tokenBalances.length;
      results.tokens = tokens.tokenBalances
        .filter(t => t.tokenBalance && BigInt(t.tokenBalance) > 0n)
        .slice(0, 5)
        .map(t => ({
          contract: t.contractAddress,
          balance: t.tokenBalance,
        }));
    } catch (e) {
      results.tokenError = String(e);
    }

    return NextResponse.json({
      address,
      network: "BASE_MAINNET",
      apiKeySet: !!process.env.ALCHEMY_API_KEY,
      apiKeyPrefix: process.env.ALCHEMY_API_KEY?.slice(0, 8),
      results,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
