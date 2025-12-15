// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title DiamondHandsV2
 * @notice 握力測定ゲームの結果をNFT/SBTとして発行 (Upgradeable版)
 * @dev UUPS Proxy パターンで将来のアップグレードに対応
 */
contract DiamondHandsV2 is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using Strings for uint256;

    uint256 private _nextTokenId;
    uint256 public constant DIAMOND_THRESHOLD = 60;

    struct HodlResult {
        uint256 duration;
        bool isDiamondHands;
        uint256 timestamp;
        string investorType; // LLM生成の投資家タイプ
    }

    mapping(uint256 => HodlResult) public hodlResults;

    event DiamondHandsMinted(address indexed player, uint256 tokenId, uint256 duration);
    event PaperHandsMinted(address indexed player, uint256 tokenId, uint256 duration);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice 初期化関数 (constructor の代わり)
     */
    function initialize() public initializer {
        __ERC721_init("Diamond Hands Test", "HODL");
        __ERC721URIStorage_init();
        __Ownable_init(msg.sender);
        // Note: UUPSUpgradeable is stateless in OZ v5, no init needed
    }

    /**
     * @notice アップグレード権限チェック (owner のみ)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice 現在のバージョンを返す
     */
    function version() public pure virtual returns (string memory) {
        return "2.0.0";
    }

    /**
     * @notice ゲーム結果をミント
     * @param player プレイヤーのアドレス
     * @param duration ホールド時間（秒）
     * @param messages FUD/Good Newsメッセージ配列
     * @param investorType LLM生成の投資家タイプ（例: "Diamond Whale", "Paper Tiger"）
     */
    function mint(
        address player,
        uint256 duration,
        string[] calldata messages,
        string calldata investorType
    ) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        bool isDiamond = duration >= DIAMOND_THRESHOLD;

        hodlResults[tokenId] = HodlResult({
            duration: duration,
            isDiamondHands: isDiamond,
            timestamp: block.timestamp,
            investorType: investorType
        });

        _safeMint(player, tokenId);
        _setTokenURI(tokenId, _generateTokenURI(tokenId, duration, isDiamond, messages, investorType));

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
    ) internal override(ERC721Upgradeable) returns (address) {
        address from = _ownerOf(tokenId);

        if (from != address(0) && !hodlResults[tokenId].isDiamondHands) {
            revert("Paper Hands SBT: Non-transferable");
        }

        return super._update(to, tokenId, auth);
    }

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

    function _generateSVG(bool isDiamond, string memory timeStr, string[] calldata messages, string memory investorType) internal pure returns (string memory) {
        if (isDiamond) {
            return _generateDiamondSVG(timeStr, messages, investorType);
        } else {
            return _generatePaperSVG(timeStr, messages, investorType);
        }
    }

    function _generateDiamondSVG(string memory timeStr, string[] calldata messages, string memory investorType) internal pure returns (string memory) {
        bytes memory svg1 = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="#0a0a0a"/>',
            '<rect x="20" y="20" width="360" height="360" rx="20" fill="#00D4FF"/>'
        );

        bytes memory msgElements = _generateMessageElements(messages, true);

        bytes memory svg2 = abi.encodePacked(
            '<text x="200" y="100" font-size="80" text-anchor="middle">', unicode"💎", '</text>',
            '<text x="200" y="170" font-size="32" font-weight="bold" fill="#000" text-anchor="middle">Diamond Hands</text>',
            '<text x="200" y="230" font-size="48" font-family="monospace" fill="#000" text-anchor="middle">', timeStr, '</text>',
            '<text x="200" y="280" font-size="14" fill="#000" text-anchor="middle">HODL Time</text>'
        );

        bytes memory svg3 = abi.encodePacked(
            '<text x="200" y="340" font-size="20" font-weight="bold" fill="#003366" text-anchor="middle">', investorType, '</text>',
            '</svg>'
        );

        return string(abi.encodePacked(svg1, msgElements, svg2, svg3));
    }

    function _generatePaperSVG(string memory timeStr, string[] calldata messages, string memory investorType) internal pure returns (string memory) {
        bytes memory svg1 = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="#0a0a0a"/>',
            '<rect x="20" y="20" width="360" height="360" rx="20" fill="#2a2a2a"/>'
        );

        bytes memory msgElements = _generateMessageElements(messages, false);

        bytes memory svg2 = abi.encodePacked(
            '<text x="200" y="100" font-size="80" text-anchor="middle">', unicode"📄", '</text>',
            '<text x="200" y="170" font-size="32" font-weight="bold" fill="#888" text-anchor="middle">Paper Hands</text>',
            '<text x="200" y="230" font-size="48" font-family="monospace" fill="#666" text-anchor="middle">', timeStr, '</text>',
            '<text x="200" y="280" font-size="14" fill="#555" text-anchor="middle">HODL Time</text>'
        );

        bytes memory svg3 = abi.encodePacked(
            '<text x="200" y="340" font-size="20" font-weight="bold" fill="#ff6666" text-anchor="middle">', investorType, '</text>',
            '</svg>'
        );

        return string(abi.encodePacked(svg1, msgElements, svg2, svg3));
    }

    function _generateMessageElements(string[] calldata msgs, bool isDiamond) internal pure returns (bytes memory) {
        if (msgs.length == 0) return "";

        string memory color = isDiamond ? "#003366" : "#ff0000";
        bytes memory result;

        if (msgs.length > 0) result = abi.encodePacked(result, _msgText(msgs[0], "30", "45", "8", "5", color));
        if (msgs.length > 1) result = abi.encodePacked(result, _msgText(msgs[1], "30", "75", "8", "5", color));
        if (msgs.length > 2) result = abi.encodePacked(result, _msgText(msgs[2], "30", "105", "8", "5", color));
        if (msgs.length > 3) result = abi.encodePacked(result, _msgText(msgs[3], "30", "135", "8", "5", color));
        if (msgs.length > 4) result = abi.encodePacked(result, _msgText(msgs[4], "30", "275", "8", "5", color));
        if (msgs.length > 5) result = abi.encodePacked(result, _msgText(msgs[5], "30", "305", "8", "5", color));
        if (msgs.length > 6) result = abi.encodePacked(result, _msgText(msgs[6], "210", "45", "8", "5", color));
        if (msgs.length > 7) result = abi.encodePacked(result, _msgText(msgs[7], "210", "75", "8", "5", color));
        if (msgs.length > 8) result = abi.encodePacked(result, _msgText(msgs[8], "210", "105", "8", "5", color));
        if (msgs.length > 9) result = abi.encodePacked(result, _msgText(msgs[9], "210", "135", "8", "5", color));
        if (msgs.length > 10) result = abi.encodePacked(result, _msgText(msgs[10], "210", "275", "8", "5", color));
        if (msgs.length > 11) result = abi.encodePacked(result, _msgText(msgs[11], "210", "305", "8", "5", color));

        return result;
    }

    function _msgText(
        string calldata text,
        string memory x,
        string memory y,
        string memory fontSize,
        string memory opacity,
        string memory color
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(
            '<text x="', x,
            '" y="', y,
            '" font-size="', fontSize,
            '" font-family="sans-serif, Noto Sans JP, Hiragino Sans" fill="', color, '" opacity="0.', opacity,
            '">', text, '</text>'
        );
    }

    function _generateTokenURI(
        uint256 tokenId,
        uint256 duration,
        bool isDiamond,
        string[] calldata messages,
        string memory investorType
    ) internal pure returns (string memory) {
        string memory timeStr = _formatTime(duration);
        string memory svg = _generateSVG(isDiamond, timeStr, messages, investorType);
        string memory name = isDiamond ? "Diamond Hands" : "Paper Hands";
        string memory desc = isDiamond
            ? "You survived the FUD! True diamond hands."
            : "You paper handed... The shame is eternal.";

        bytes memory json1 = abi.encodePacked(
            '{"name":"', name, ' #', tokenId.toString(),
            '","description":"', desc,
            '","image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"'
        );

        bytes memory msgAttrs;
        if (messages.length > 0) {
            string memory traitPrefix = isDiamond ? "Good News " : "FUD ";
            for (uint i = 0; i < messages.length && i < 12; i++) {
                msgAttrs = abi.encodePacked(
                    msgAttrs,
                    ',{"trait_type":"', traitPrefix, (i + 1).toString(), '","value":"', messages[i], '"}'
                );
            }
        }

        bytes memory json2 = abi.encodePacked(
            ',"attributes":[{"trait_type":"Type","value":"', name,
            '"},{"trait_type":"HODL Time","value":"', timeStr,
            '"},{"trait_type":"Duration (seconds)","value":', duration.toString(),
            '},{"trait_type":"Transferable","value":"', isDiamond ? "Yes" : "No", '"}'
        );

        bytes memory investorAttr = abi.encodePacked(
            ',{"trait_type":"Investor Type","value":"', investorType, '"}'
        );

        bytes memory json3 = abi.encodePacked(investorAttr, msgAttrs, ']}');

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(abi.encodePacked(json1, json2, json3))
        ));
    }

    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev ストレージギャップ - 将来の変数追加用
     */
    uint256[50] private __gap;
}
