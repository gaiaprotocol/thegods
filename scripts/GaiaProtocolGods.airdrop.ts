import { expect } from "chai";
import { ethers } from "hardhat";
import { holders, amounts, treasury } from "./holderList";

async function main() {

    const gods = (await ethers.getContractFactory("GaiaProtocolGods")).attach("0x134590ACB661Da2B318BcdE6b39eF5cF8208E372");
    await gods.deployed();

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
