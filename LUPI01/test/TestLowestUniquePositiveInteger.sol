pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/LowestUniquePositiveInteger.sol";

contract TestLowestUniquePositiveInteger {
  function testCanCommitInput() public {
    LowestUniquePositiveInteger instance = LowestUniquePositiveInteger(DeployedAddresses.LowestUniquePositiveInteger());
    uint input = 565;
    instance.commitInput(input);
    Assert.equal(instance.getInput(), input, "The commited input should have been 565.");
  }
}
