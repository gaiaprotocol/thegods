import { ethers } from "hardhat";
import { expect } from "chai";

import { impersonateAccount, setBalance } from "@nomicfoundation/hardhat-network-helpers";

import { holders, amounts } from "../scripts/holderList";
import { Wallet } from "ethers";

describe("GaiaGods", function () {
    it("overall test", async function () {
        const gods = await (await ethers.getContractFactory("GaiaGods")).deploy("a", "b", "c/");
        await gods.airdrop(holders.slice(0, 400), amounts.slice(0, 400));
        await gods.airdrop(holders.slice(400), amounts.slice(400));

        expect(await gods.totalSupply()).to.be.equal(3333);
        expect(await gods.tokenURI(135)).to.be.equal("c/135");

        const amountList = (await Promise.all(holders.map(addr => gods.balanceOf(addr)))).map(n => n.toNumber());
        expect(amountList.join()).to.be.equal(amounts.join());

        await expect(await gods.airdropCompleted()).to.be.false;
        await gods.completeAirdrop();

        expect(await gods.airdropCompleted()).to.be.true;
        await expect(gods.airdrop([gods.address], [1])).to.be.reverted;

        await impersonateAccount(holders[0]);
        await setBalance(holders[0], ethers.utils.parseEther("10"));

        const holder0 = await ethers.getSigner(holders[0]);
        expect(holder0.address).to.be.equal(holders[0]);

        expect(await gods.balanceOf(holder0.address)).to.be.equal(amounts[0]);
        expect(await gods.ownerOf(0)).to.be.equal(holder0.address);
        expect(await gods.ownerOf(10)).to.be.equal(holder0.address);
        expect(await gods.ownerOf(20)).to.be.equal(holder0.address);

        const to = Wallet.createRandom();
        await expect(gods.batchTransferFrom(holder0.address, to.address, [0, 1, 2, 3, 4, 10, 11, 12, 13])).to.be.reverted;
        await gods.connect(holder0).batchTransferFrom(holder0.address, to.address, [0, 1, 2, 3, 4, 10, 11, 12, 13]);
        expect(await gods.ownerOf(0)).to.be.equal(to.address);
        expect(await gods.ownerOf(1)).to.be.equal(to.address);
        expect(await gods.ownerOf(2)).to.be.equal(to.address);
        expect(await gods.ownerOf(3)).to.be.equal(to.address);
        expect(await gods.ownerOf(4)).to.be.equal(to.address);
        expect(await gods.ownerOf(10)).to.be.equal(to.address);
        expect(await gods.ownerOf(11)).to.be.equal(to.address);
        expect(await gods.ownerOf(12)).to.be.equal(to.address);
        expect(await gods.ownerOf(13)).to.be.equal(to.address);

        expect(await gods.ownerOf(5)).to.be.equal(holder0.address);
        expect(await gods.ownerOf(9)).to.be.equal(holder0.address);
        expect(await gods.ownerOf(15)).to.be.equal(holder0.address);

        await gods.setPause(true);
        await expect(gods.connect(holder0).batchTransferFrom(holder0.address, to.address, [15])).to.be.revertedWithCustomError(gods, "PausedNow");
        await expect(gods.connect(holder0).transferFrom(holder0.address, to.address, 15)).to.be.revertedWithCustomError(gods, "PausedNow");

        await gods.setBaseURI("foo.bar/");
        expect(await gods.tokenURI(777)).to.be.equal("foo.bar/777");
    });
});
