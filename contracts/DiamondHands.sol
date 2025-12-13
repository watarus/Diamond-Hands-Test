// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title DiamondHands
 * @notice 握力測定ゲームの結果をNFT/SBTとして発行
 * @dev Diamond Hands (60秒以上) = 譲渡可能なNFT
 *      Paper Hands (60秒未満) = 譲渡不可のSBT
 */
contract DiamondHands is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;
    uint256 public constant DIAMOND_THRESHOLD = 60; // 60秒

    struct HodlResult {
        uint256 duration; // 秒数
        bool isDiamondHands; // true = Diamond, false = Paper
        uint256 timestamp;
    }

    mapping(uint256 => HodlResult) public hodlResults;

    event DiamondHandsMinted(address indexed player, uint256 tokenId, uint256 duration);
    event PaperHandsMinted(address indexed player, uint256 tokenId, uint256 duration);

    constructor() ERC721("Diamond Hands Test", "HODL") Ownable(msg.sender) {}

    /**
     * @notice ゲーム結果をミント
     * @param player プレイヤーのアドレス
     * @param duration ホールド時間（秒）
     */
    function mint(address player, uint256 duration) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        bool isDiamond = duration >= DIAMOND_THRESHOLD;

        hodlResults[tokenId] = HodlResult({
            duration: duration,
            isDiamondHands: isDiamond,
            timestamp: block.timestamp
        });

        _safeMint(player, tokenId);
        _setTokenURI(tokenId, _generateTokenURI(tokenId, duration, isDiamond));

        if (isDiamond) {
            emit DiamondHandsMinted(player, tokenId, duration);
        } else {
            emit PaperHandsMinted(player, tokenId, duration);
        }

        return tokenId;
    }

    /**
     * @notice Paper Hands SBTは譲渡不可
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Paper Handsの場合、ミント以外の転送を禁止
        if (from != address(0) && !hodlResults[tokenId].isDiamondHands) {
            revert("Paper Hands SBT: Non-transferable");
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @notice 時間文字列を生成
     */
    function _formatTime(uint256 duration) internal pure returns (string memory) {
        uint256 mins = duration / 60;
        uint256 secs = duration % 60;
        return string(abi.encodePacked(
            mins.toString(),
            ":",
            secs < 10 ? "0" : "",
            secs.toString()
        ));
    }

    /**
     * @notice SVGを生成
     */
    function _generateSVG(bool isDiamond, string memory timeStr) internal pure returns (string memory) {
        string memory name = isDiamond ? "Diamond Hands" : "Paper Hands";
        string memory emoji = isDiamond ? unicode"💎" : unicode"📄";
        string memory bgColor = isDiamond ? "#00D4FF" : "#FFD700";

        bytes memory svg1 = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="#0a0a0a"/>',
            '<rect x="20" y="20" width="360" height="360" rx="20" fill="', bgColor, '"/>',
            '<text x="200" y="120" font-size="80" text-anchor="middle">', emoji, '</text>'
        );

        bytes memory svg2 = abi.encodePacked(
            '<text x="200" y="200" font-size="32" font-weight="bold" fill="#000" text-anchor="middle">', name, '</text>',
            '<text x="200" y="260" font-size="48" font-family="monospace" fill="#000" text-anchor="middle">', timeStr, '</text>',
            '<text x="200" y="320" font-size="16" fill="#000" text-anchor="middle">HODL Time</text>',
            '</svg>'
        );

        return string(abi.encodePacked(svg1, svg2));
    }

    /**
     * @notice トークンURIを動的に生成
     */
    function _generateTokenURI(
        uint256 tokenId,
        uint256 duration,
        bool isDiamond
    ) internal pure returns (string memory) {
        string memory timeStr = _formatTime(duration);
        string memory svg = _generateSVG(isDiamond, timeStr);
        string memory name = isDiamond ? "Diamond Hands" : "Paper Hands";
        string memory desc = isDiamond
            ? "You survived the FUD! True diamond hands."
            : "You paper handed... The shame is eternal.";

        bytes memory json1 = abi.encodePacked(
            '{"name":"', name, ' #', tokenId.toString(),
            '","description":"', desc,
            '","image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"'
        );

        bytes memory json2 = abi.encodePacked(
            ',"attributes":[{"trait_type":"Type","value":"', name,
            '"},{"trait_type":"HODL Time","value":"', timeStr,
            '"},{"trait_type":"Duration (seconds)","value":', duration.toString(),
            '},{"trait_type":"Transferable","value":"', isDiamond ? "Yes" : "No", '"}]}'
        );

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(abi.encodePacked(json1, json2))
        ));
    }

    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
