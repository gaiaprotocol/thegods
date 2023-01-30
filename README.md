# GaiaGods

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Deploy

- Use scripts/GaiaGods.deploy.ts

- It (1) deploys the GaiaGods contract, (2) airdrops nfts to holders with proper amounts, and (3) updates airdropCompleted as true to prevent a further airdrop.
- Before deploy the GaiaGods contract,

  1. [ ] Update treasury address in scripts/holderList.ts

  2. [ ] Update name, symbol, baseURI in GaiaGods.deploy.ts
  3. [ ] Check again if holders and amounts in holderList.ts are correct
  4. [ ] Be careful about a gas price

- e.g)
  1. Deployer[https://goerli.etherscan.io/address/0x96497dae4a1117d940d1260e3669380c0a9be244]
  2. GaiaGods[https://goerli.etherscan.io/address/0x5781715adddbcdc57c1071a4756321f03ce83427]

## Contact

- [TheGreatHB](https://twitter.com/TheGreatHB_/)
