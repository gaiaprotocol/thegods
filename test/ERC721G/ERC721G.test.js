const { shouldBehaveLikeERC721, shouldBehaveLikeERC721Metadata } = require("./ERC721.behavior");

const GaiaProtocolGods = artifacts.require("GaiaProtocolGods");

contract("ERC721", function (accounts) {
    const name = "Non Fungible Token";
    const symbol = "NFT";

    beforeEach(async function () {
        this.token = await GaiaProtocolGods.new(name, symbol, "");
    });

    shouldBehaveLikeERC721("ERC721", ...accounts);
    shouldBehaveLikeERC721Metadata("ERC721", name, symbol, ...accounts);
});
