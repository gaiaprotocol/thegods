// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GaiaToken is ERC20("", "") {
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
