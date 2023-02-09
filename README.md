# GaiaProtocolGods

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Deploy

- Use scripts/GaiaProtocolGods.deploy.ts

- It (1) deploys the GaiaProtocolGods contract, (2) airdrops nfts to holders with proper amounts, and (3) updates airdropCompleted as true to prevent a further airdrop.
- Before deploy the GaiaProtocolGods contract,

  1. [ ] Update treasury address in scripts/holderList.ts

  2. [ ] Update name, symbol, baseURI in GaiaProtocolGods.deploy.ts
  3. [ ] Check again if holders and amounts in holderList.ts are correct
  4. [ ] Be careful about a gas price <e.g) 15 gwei -> totally 0.585 ETH>

- e.g)
  1. Deployer[https://goerli.etherscan.io/address/0x96497dae4a1117d940d1260e3669380c0a9be244]
  2. GaiaProtocolGods[https://goerli.etherscan.io/address/0x5781715adddbcdc57c1071a4756321f03ce83427]

## Contact

- [TheGreatHB](https://twitter.com/TheGreatHB_/)
