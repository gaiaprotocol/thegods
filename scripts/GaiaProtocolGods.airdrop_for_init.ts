import { ethers } from "hardhat";

async function main() {

    const gods = (await ethers.getContractFactory("GaiaProtocolGods")).attach("0x134590ACB661Da2B318BcdE6b39eF5cF8208E372");
    await gods.deployed();

    let tx = await gods.airdrop(["0x8033cEB86c71EbBF575fF7015FcB8F1689d90aC1"], [1]);
    await tx.wait();
}

main();
