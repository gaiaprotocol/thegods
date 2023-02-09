import { expect } from "chai";
import { ethers } from "hardhat";
import { holders, amounts, treasury } from "./holderList";

async function main() {
    // TODO: Replace
    const name = "";
    const symbol = "";
    const baseURI = "";
    // TODO: end

    expect(name).to.not.be.equal("", "Name is not set yet");
    expect(symbol).to.not.be.equal("", "Symbol is not set yet");
    expect(baseURI).to.not.be.equal("", "BaseURI is not set yet");

    const gods = await (await ethers.getContractFactory("GaiaProtocolGods")).deploy(name, symbol, baseURI);

    await gods.deployed();
    console.log(`GaiaProtocolGods address: ${gods.address}`);

    expect(treasury).to.not.be.equal("0x1230000000000000000000000000000000000321", "Treasury is not set yet");

    let tx = await gods.airdrop(holders.slice(0, 400), amounts.slice(0, 400));
    await tx.wait();

    tx = await gods.airdrop(holders.slice(400), amounts.slice(400));
    await tx.wait();

    expect(await gods.totalSupply()).to.be.equal(3333);

    const amountList = (await Promise.all(holders.map(addr => gods.balanceOf(addr)))).map(n => n.toNumber());
    expect(amountList.join()).to.be.equal(amounts.join());

    await expect(await gods.airdropCompleted()).to.be.false;
    tx = await gods.completeAirdrop();
    await tx.wait();

    expect(await gods.airdropCompleted()).to.be.true;
}

main();
