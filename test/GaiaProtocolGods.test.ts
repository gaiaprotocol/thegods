import { GaiaInterchange, GaiaToken } from "../typechain-types";

import { ethers } from "hardhat";
import { expect } from "chai";

import { impersonateAccount, setBalance, SnapshotRestorer, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";

import { holders, amounts } from "../scripts/holderList";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Wallet, utils, constants } from "ethers";
const { parseEther } = utils;
const { AddressZero, MaxUint256 } = constants;

describe("GaiaProtocolGods", function () {
    let gods: any;
    let alice: SignerWithAddress, holder0: SignerWithAddress;

    let treasury: Wallet;
    let snapshot: SnapshotRestorer;

    before(async () => {
        [holder0, alice] = await ethers.getSigners();
        gods = await (await ethers.getContractFactory("GaiaProtocolGods")).deploy("a", "b", "c/");
        await gods.airdrop(holders.slice(0, 400), amounts.slice(0, 400));
        await gods.airdrop(holders.slice(400), amounts.slice(400));

        expect(await gods.totalSupply()).to.be.equal(3333);
        await impersonateAccount(holders[0]);
        await setBalance(holders[0], parseEther("10"));

        const holdersLength = holders.length;
        await impersonateAccount(holders[holdersLength - 1]);
        await setBalance(holders[holdersLength - 1], parseEther("10"));

        holder0 = await ethers.getSigner(holders[0]);
        treasury = (await ethers.getSigner(holders[holdersLength - 1])) as any as Wallet;
        snapshot = await takeSnapshot();
    });

    beforeEach(async () => {
        await snapshot.restore();
    });

    it("overall test", async function () {
        expect(await gods.tokenURI(135)).to.be.equal("c/135");

        const amountList = (await Promise.all(holders.map(addr => gods.balanceOf(addr)))).map(n => n.toNumber());
        expect(amountList.join()).to.be.equal(amounts.join());

        await expect(await gods.airdropCompleted()).to.be.false;
        await gods.completeAirdrop();

        expect(await gods.airdropCompleted()).to.be.true;
        await expect(gods.airdrop([gods.address], [1])).to.be.reverted;

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
    describe("Interact with GaiaInterchange", function () {
        const MINTABLE = 0;
        const UNMINTABLE = 1;

        let GAIA: GaiaToken;
        let gi: GaiaInterchange;

        beforeEach(async () => {
            GAIA = await (await ethers.getContractFactory("GaiaToken")).deploy();
            gi = await (await ethers.getContractFactory("GaiaInterchange")).deploy(GAIA.address, treasury.address, 1000);
            await GAIA.mint(gi.address, parseEther("10000").mul(100));
            await gi.setNFTInfo([gods.address], [{ price: parseEther("10000"), nftType: UNMINTABLE }]);
            await gods.connect(holder0).setApprovalForAll(gi.address, true);
        });

        describe("SellNFT", () => {
            context("when nft address is zero", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).sellNFT(AddressZero, 0, AddressZero)).to.be.revertedWithCustomError(gi, "AddressZero");
                });
            });
            context("when 'priceTo' is address(0)", () => {
                it("transfers price to msg.sender", async () => {
                    await expect(gi.connect(holder0).sellNFT(gods.address, 0, AddressZero)).to.changeTokenBalances(
                        GAIA,
                        [gi.address, holder0.address, treasury.address],
                        [parseEther("-10000"), parseEther("9000"), parseEther("1000")]
                    );
                });
            });
            context("when 'priceTo' is not address(0)", () => {
                it("transfers price to 'priceTo'", async () => {
                    await expect(gi.connect(holder0).sellNFT(gods.address, 0, alice.address)).to.changeTokenBalances(
                        GAIA,
                        [gi.address, alice.address, treasury.address],
                        [parseEther("-10000"), parseEther("9000"), parseEther("1000")]
                    );
                });
            });
            context("when price in NFTInfo is not settled", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).sellNFT(holder0.address, 0, alice.address)).to.be.revertedWithCustomError(gi, "InvalidNFT");
                });
            });
            context("when trying to sell someone else's NFT", () => {
                it("reverts", async () => {
                    await gods.connect(holder0).setApprovalForAll(gi.address, false);
                    await expect(gi.connect(holder0).sellNFT(gods.address, 777, AddressZero)).to.be.revertedWithCustomError(gods, "TransferFromIncorrectOwner");
                    await expect(gi.connect(holder0).sellNFT(gods.address, 5, AddressZero)).to.be.revertedWithCustomError(
                        gods,
                        "TransferCallerNotOwnerNorApproved"
                    );
                    await gods.connect(holder0).setApprovalForAll(gi.address, true);
                    await expect(gi.connect(holder0).sellNFT(gods.address, 777, AddressZero)).to.be.revertedWithCustomError(gods, "TransferFromIncorrectOwner");
                    await gi.connect(holder0).sellNFT(gods.address, 5, AddressZero);
                });
            });
            context("when the NFTType of gods is settled incorrectly", () => {
                it("reverts", async () => {
                    const gi2 = await (await ethers.getContractFactory("GaiaInterchange")).deploy(GAIA.address, treasury.address, 1000);
                    await GAIA.mint(gi2.address, parseEther("10000").mul(100));
                    await gi2.setNFTInfo([gods.address], [{ price: parseEther("10000"), nftType: MINTABLE }]);
                    await gods.connect(holder0).setApprovalForAll(gi2.address, true);

                    await expect(gi2.connect(holder0).sellNFT(gods.address, 0, AddressZero)).to.be.reverted;
                });
            });
            context("when sellNFT works properly", () => {
                it("transfers fee to the treasury and the remainder to 'priceTo'", async () => {
                    await gi.setFeeRate(6000);
                    await expect(gi.connect(holder0).sellNFT(gods.address, 0, alice.address)).to.changeTokenBalances(
                        GAIA,
                        [gi.address, alice.address, treasury.address],
                        [parseEther("-10000"), parseEther("4000"), parseEther("6000")]
                    );
                });
                it("emits a SellNFT event", async () => {
                    await expect(gi.connect(holder0).sellNFT(gods.address, 0, alice.address))
                        .to.emit(gi, "SellNFT")
                        .withArgs(gods.address, 0, alice.address, UNMINTABLE, parseEther("10000"));
                });
                it("transfers NFT from msg.sender to GaiaInterchange", async () => {
                    expect(await gods.ownerOf(0)).to.be.equal(holder0.address);
                    await gi.connect(holder0).sellNFT(gods.address, 0, alice.address);
                    expect(await gods.ownerOf(0)).to.be.equal(gi.address);
                });
            });
        });
        describe("SellNFTBatch", () => {
            context("when nft address is zero", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).sellNFTBatch(AddressZero, [0, 1], AddressZero)).to.be.revertedWithCustomError(gi, "AddressZero");
                });
            });
            context("when 'priceTo' is address(0)", () => {
                it("transfers price to msg.sender", async () => {
                    await expect(gi.connect(holder0).sellNFTBatch(gods.address, [0, 1], AddressZero)).to.changeTokenBalances(
                        GAIA,
                        [gi.address, holder0.address, treasury.address],
                        [parseEther("-20000"), parseEther("18000"), parseEther("2000")]
                    );
                });
            });
            context("when 'priceTo' is not address(0)", () => {
                it("transfers price to 'priceTo'", async () => {
                    await expect(gi.connect(holder0).sellNFTBatch(gods.address, [0, 1], alice.address)).to.changeTokenBalances(
                        GAIA,
                        [gi.address, alice.address, treasury.address],
                        [parseEther("-20000"), parseEther("18000"), parseEther("2000")]
                    );
                });
            });
            context("when price in NFTInfo is not settled", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).sellNFTBatch(holder0.address, [0, 1], alice.address)).to.be.revertedWithCustomError(gi, "InvalidNFT");
                });
            });
            context("when 'ids' is a blank array", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).sellNFTBatch(gods.address, [], alice.address)).to.be.revertedWithCustomError(gi, "AmountZero");
                });
            });
            context("when trying to sell someone else's NFT", () => {
                it("reverts", async () => {
                    await gods.connect(holder0).setApprovalForAll(gi.address, false);
                    await expect(gi.connect(holder0).sellNFTBatch(gods.address, [300, 400, 500], AddressZero)).to.be.revertedWithCustomError(
                        gods,
                        "TransferFromIncorrectOwner"
                    );
                    await expect(gi.connect(holder0).sellNFTBatch(gods.address, [5, 6], AddressZero)).to.be.revertedWithCustomError(
                        gods,
                        "TransferCallerNotOwnerNorApproved"
                    );
                    await gods.connect(holder0).setApprovalForAll(gi.address, true);
                    await expect(gi.connect(holder0).sellNFTBatch(gods.address, [300, 400, 500], AddressZero)).to.be.revertedWithCustomError(
                        gods,
                        "TransferFromIncorrectOwner"
                    );
                    await gi.connect(holder0).sellNFTBatch(gods.address, [5, 6], AddressZero);
                });
            });
            context("when the NFTType of gods is settled incorrectly", () => {
                it("reverts", async () => {
                    const gi2 = await (await ethers.getContractFactory("GaiaInterchange")).deploy(GAIA.address, treasury.address, 1000);
                    await GAIA.mint(gi2.address, parseEther("10000").mul(100));
                    await gi2.setNFTInfo([gods.address], [{ price: parseEther("10000"), nftType: MINTABLE }]);
                    await gods.connect(holder0).setApprovalForAll(gi2.address, true);

                    await expect(gi2.connect(holder0).sellNFTBatch(gods.address, [0, 1], AddressZero)).to.be.reverted;
                });
            });
            context("when sellNFTBatch works properly", () => {
                it("transfers fee to the treasury and the remainder to 'priceTo'", async () => {
                    await gi.setFeeRate(6000);
                    await expect(gi.connect(holder0).sellNFTBatch(gods.address, [0, 1], alice.address)).to.changeTokenBalances(
                        GAIA,
                        [gi.address, alice.address, treasury.address],
                        [parseEther("-20000"), parseEther("8000"), parseEther("12000")]
                    );
                });
                it("emits a SellNFT event", async () => {
                    await expect(gi.connect(holder0).sellNFTBatch(gods.address, [0, 1], alice.address))
                        .to.emit(gi, "SellNFTBatch")
                        .withArgs(gods.address, [0, 1], alice.address, UNMINTABLE, parseEther("20000"));
                });
                it("transfers NFT from msg.sender to GaiaInterchange", async () => {
                    expect(await gods.ownerOf(0)).to.be.equal(holder0.address);
                    expect(await gods.ownerOf(1)).to.be.equal(holder0.address);
                    expect(await gods.ownerOf(2)).to.be.equal(holder0.address);
                    await gi.connect(holder0).sellNFTBatch(gods.address, [0, 1], alice.address);
                    expect(await gods.ownerOf(0)).to.be.equal(gi.address);
                    expect(await gods.ownerOf(1)).to.be.equal(gi.address);
                    expect(await gods.ownerOf(2)).to.be.equal(holder0.address);
                });
            });
        });
        describe("BuyNFT", () => {
            beforeEach(async () => {
                await gi.connect(holder0).sellNFTBatch(gods.address, [0, 1, 2], AddressZero);
                await GAIA.connect(holder0).approve(gi.address, MaxUint256);
            });

            context("when GAIA is not enough to buy", () => {
                it("reverts", async () => {
                    await GAIA.connect(holder0).transfer(alice.address, await GAIA.balanceOf(holder0.address));
                    await expect(gi.connect(holder0).buyNFT(gods.address, 0, AddressZero)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
                });
            });
            context("when nft address is zero", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).buyNFT(AddressZero, 0, AddressZero)).to.be.revertedWithCustomError(gi, "AddressZero");
                });
            });
            context("when 'nftTo' is address(0)", () => {
                it("transfers NFT to msg.sender", async () => {
                    expect(await gods.ownerOf(0)).to.be.equal(gi.address);
                    await gi.connect(holder0).buyNFT(gods.address, 0, AddressZero);
                    expect(await gods.ownerOf(0)).to.be.equal(holder0.address);
                });
            });
            context("when 'nftTo' is not address(0)", () => {
                it("transfers NFT to 'nftTo'", async () => {
                    expect(await gods.ownerOf(0)).to.be.equal(gi.address);
                    await gi.connect(holder0).buyNFT(gods.address, 0, alice.address);
                    expect(await gods.ownerOf(0)).to.be.equal(alice.address);
                });
            });
            context("when price in NFTInfo is not settled", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).buyNFT(holder0.address, 0, alice.address)).to.be.revertedWithCustomError(gi, "InvalidNFT");
                });
            });
            context("when trying to buy an NFT not in the GaiaInterchange contract", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).buyNFT(gods.address, 3332, alice.address)).to.be.revertedWithCustomError(
                        gods,
                        "TransferFromIncorrectOwner"
                    );
                    await gods.connect(treasury).setApprovalForAll(gi.address, true);
                    await expect(gi.connect(holder0).buyNFT(gods.address, 3332, alice.address)).to.be.revertedWithCustomError(
                        gods,
                        "TransferFromIncorrectOwner"
                    );
                });
            });
            context("when the NFTType of gods is settled incorrectly", () => {
                it("reverts", async () => {
                    const gods2 = await (await ethers.getContractFactory("GaiaProtocolGods")).deploy("", "", "");
                    await gods2.airdrop([gi.address], [1]);
                    await gi.setNFTInfo([gods2.address], [{ price: parseEther("10000"), nftType: MINTABLE }]);

                    await expect(gi.connect(holder0).buyNFT(gods2.address, 0, AddressZero)).to.be.reverted;
                });
            });
            context("when buyNFT works properly", () => {
                it("transfers NFT to 'nftTo'", async () => {
                    expect(await gods.ownerOf(0)).to.be.equal(gi.address);
                    await gi.connect(holder0).buyNFT(gods.address, 0, alice.address);
                    expect(await gods.ownerOf(0)).to.be.equal(alice.address);
                });
                it("emits a BuyNFT event", async () => {
                    await expect(gi.connect(holder0).buyNFT(gods.address, 0, alice.address))
                        .to.emit(gi, "BuyNFT")
                        .withArgs(gods.address, 0, alice.address, UNMINTABLE, parseEther("10000"));
                });
                it("transfers price from msg.sender to GaiaInterchange", async () => {
                    await expect(gi.connect(holder0).buyNFT(gods.address, 0, alice.address)).to.changeTokenBalances(
                        GAIA,
                        [gi.address, holder0.address, treasury.address],
                        [parseEther("10000"), parseEther("-10000"), 0]
                    );
                });
            });
        });
        describe("BuyNFTBatch", () => {
            beforeEach(async () => {
                await gi.connect(holder0).sellNFTBatch(gods.address, [0, 1, 2, 3, 4], AddressZero);
                await GAIA.connect(holder0).approve(gi.address, MaxUint256);
            });

            context("when GAIA is not enough to buy", () => {
                it("reverts", async () => {
                    await GAIA.connect(holder0).transfer(alice.address, await GAIA.balanceOf(holder0.address));
                    await expect(gi.connect(holder0).buyNFTBatch(gods.address, [0, 1], AddressZero)).to.be.revertedWith(
                        "ERC20: transfer amount exceeds balance"
                    );
                });
            });
            context("when nft address is zero", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).buyNFTBatch(AddressZero, [0, 1], AddressZero)).to.be.revertedWithCustomError(gi, "AddressZero");
                });
            });
            context("when 'nftTo' is address(0)", () => {
                it("transfers NFT to msg.sender", async () => {
                    expect(await gods.ownerOf(0)).to.be.equal(gi.address);
                    await gi.connect(holder0).buyNFTBatch(gods.address, [0, 1], AddressZero);
                    expect(await gods.ownerOf(0)).to.be.equal(holder0.address);
                });
            });
            context("when 'nftTo' is not address(0)", () => {
                it("transfers NFT to 'nftTo'", async () => {
                    expect(await gods.ownerOf(0)).to.be.equal(gi.address);
                    await gi.connect(holder0).buyNFTBatch(gods.address, [0, 1], alice.address);
                    expect(await gods.ownerOf(0)).to.be.equal(alice.address);
                });
            });
            context("when price in NFTInfo is not settled", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).buyNFTBatch(holder0.address, [0, 1], alice.address)).to.be.revertedWithCustomError(gi, "InvalidNFT");
                });
            });
            context("when 'ids' is a blank array", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).buyNFTBatch(gods.address, [], alice.address)).to.be.revertedWithCustomError(gi, "AmountZero");
                });
            });
            context("when trying to buy an NFT not in the GaiaInterchange contract", () => {
                it("reverts", async () => {
                    await expect(gi.connect(holder0).buyNFTBatch(gods.address, [3330, 3331, 3332], alice.address)).to.be.revertedWithCustomError(
                        gods,
                        "TransferFromIncorrectOwner"
                    );
                    await gods.connect(treasury).setApprovalForAll(gi.address, true);
                    await expect(gi.connect(holder0).buyNFTBatch(gods.address, [3330, 3331, 3332], alice.address)).to.be.revertedWithCustomError(
                        gods,
                        "TransferFromIncorrectOwner"
                    );
                });
            });
            context("when the NFTType of gods is settled incorrectly", () => {
                it("reverts", async () => {
                    const gods2 = await (await ethers.getContractFactory("GaiaProtocolGods")).deploy("", "", "");
                    await gods2.airdrop([gi.address], [2]);
                    await gi.setNFTInfo([gods2.address], [{ price: parseEther("10000"), nftType: MINTABLE }]);

                    await expect(gi.connect(holder0).buyNFTBatch(gods2.address, [0, 1], AddressZero)).to.be.reverted;
                });
            });
            context("with multicall", () => {
                it("works properly", async () => {
                    const d0 = gi.interface.encodeFunctionData("buyNFT", [gods.address, 0, AddressZero]);
                    const d1 = gi.interface.encodeFunctionData("buyNFT", [gods.address, 1, AddressZero]);
                    const d2 = gi.interface.encodeFunctionData("buyNFT", [gods.address, 2, AddressZero]);
                    await gi.connect(holder0).multicall([d0, d1, d2]);
                });
            });
            context("when buyNFTBatch works properly", () => {
                it("transfers NFT to 'nftTo'", async () => {
                    expect(await gods.ownerOf(0)).to.be.equal(gi.address);
                    expect(await gods.ownerOf(1)).to.be.equal(gi.address);
                    await gi.connect(holder0).buyNFTBatch(gods.address, [0, 1], alice.address);
                    expect(await gods.ownerOf(0)).to.be.equal(alice.address);
                    expect(await gods.ownerOf(1)).to.be.equal(alice.address);
                });
                it("emits a BuyNFT event", async () => {
                    await expect(gi.connect(holder0).buyNFTBatch(gods.address, [0, 1], alice.address))
                        .to.emit(gi, "BuyNFTBatch")
                        .withArgs(gods.address, [0, 1], alice.address, UNMINTABLE, parseEther("20000"));
                });
                it("transfers price from msg.sender to GaiaInterchange", async () => {
                    await expect(gi.connect(holder0).buyNFTBatch(gods.address, [0, 1], alice.address)).to.changeTokenBalances(
                        GAIA,
                        [gi.address, holder0.address, treasury.address],
                        [parseEther("20000"), parseEther("-20000"), 0]
                    );
                });
            });
        });
    });
});
