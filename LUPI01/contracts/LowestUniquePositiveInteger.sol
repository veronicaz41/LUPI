pragma solidity ^0.5.0;

// The most basic demo version
contract LowestUniquePositiveInteger {
  mapping(address => uint256) private userInputs;

  event CommitInput(address indexed user, uint256 input);

  constructor() public {
  }

  function commitInput(uint256 input) external {
    userInputs[msg.sender] = input;
    emit CommitInput(msg.sender, input);
  }

  function getInput() public view returns (uint256) {
    return userInputs[msg.sender];
  }
}
