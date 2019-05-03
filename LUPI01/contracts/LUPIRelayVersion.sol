pragma solidity ^0.5.0;

import "tabookey-gasless/contracts/RelayRecipient.sol";

// The most basic demo version
contract LUPIRelayVersion is RelayRecipient {
  mapping(address => uint256) private userInputs;

  event CommitInput(address indexed user, uint256 input);

  constructor(RelayHub hub) public {
    init_relay_hub(hub);
  }

  // RelayRecipient interfaces
  function accept_relayed_call(address /*relay*/, address from, bytes memory /*encoded_function*/, uint /*gas_price*/, uint /*transaction_fee*/ ) public view returns(uint32) {
    // accept everyone
    return 0;
	}

  function post_relayed_call(address relay, address from, bytes memory encoded_function, bool success, uint used_gas, uint transaction_fee ) public {
  }

  function commitInput(uint256 input) external {
    userInputs[get_sender()] = input;
    emit CommitInput(get_sender(), input);
  }

  function getInput() public view returns (uint256) {
    return userInputs[get_sender()];
  }
}
