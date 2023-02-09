import { expect } from "chai";
import { ethers } from "hardhat";

async function main() {

    const name = "Gaia Protocol Gods";
    const symbol = "GOD";
    const baseURI = "https://backend.gaiaprotocol.com/metadata/god/";

    expect(name).to.not.be.equal("", "Name is not set yet");
    expect(symbol).to.not.be.equal("", "Symbol is not set yet");
    expect(baseURI).to.not.be.equal("", "BaseURI is not set yet");

    const gods = await (await ethers.getContractFactory("GaiaProtocolGods")).deploy(name, symbol, baseURI);

    await gods.deployed();
    console.log(`GaiaProtocolGods address: ${gods.address}`);
}

main();
