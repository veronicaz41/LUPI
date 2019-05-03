pragma solidity ^0.5.0;

import "tabookey-gasless/contracts/RelayRecipient.sol";

contract LUPI is RelayReceipt {
  uint256 ante = 0.001 ether;

  enum Stage { INIT, IN_PROGRESS, END }
  Stage private stage;
  uint private commitDeadline;
  uint private revealDeadline;

  uint256 private pot;
  address[] private players;
  mapping(address => bytes32) private blindedInputs;
  mapping(address => uint256) private revealedInputs;
  mapping(uint256 => uint) private counts;

  event CommitInput(address indexed user, bytes32 blindedInput);
  event BogusReveal(address indexed user);
  event RevealInput(address indexed user, uint256 input);
  event GotWinner(address indexed user, uint256 pot);

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

  function start() external {
    if (stage != Stage.INIT) {
      revert();
    }
    commitDeadline = block.number + 12;
    revealDeadline = commitDeadline + 12;
    stage = Stage.IN_PROGRESS;
  }

  function commitInput(bytes32 input) external payable {
    if (stage != Stage.IN_PROGRESS || commitDeadline < block.number) {
      revert();
    }
    if (msg.value < ante) {
      revert();
    }
    pot += msg.value;
    players.push(get_sender());
    blindedInputs[get_sender()] = input;
    emit CommitInput(get_sender(), input);
  }

  function revealInput(uint256 number, uint256 nonce) external {
    if (stage != Stage.IN_PROGRESS
       || block.number <= commitDeadline
       || revealDeadline < block.number) {
      revert();
    }
    bytes32 blindedInput = blindedInputs[get_sender()];
    if (blindedInput != keccak256(abi.encodePacked(number, nonce))
      || number == 0) {
      emit BogusReveal(get_sender());
      return;
    }
    revealedInputs[get_sender()] = number;
    emit RevealInput(get_sender(), number);
  }

  function computeWinner() private returns (bool has_winner, address payable winner) {
    uint256 numDistinct = 0;
    uint256[] memory distinctValues = new uint256[](players.length);

    for (uint i = 0; i < players.length; i++) {
      uint256 val = revealedInputs[players[i]];
      if (val == 0)
        continue;
      counts[val]++;
      if (counts[val] == 1) {
        distinctValues[numDistinct++] = val;
      }
    }

    uint256 numUnique = 0;
    uint256[] memory uniqueValues = new uint256[](numDistinct);
    for (uint i = 0; i < distinctValues.length; i++) {
      uint256 val = distinctValues[i];
      if (counts[val] == 1) {
        uniqueValues[numUnique++] = val;
      }
    }

    if (uniqueValues.length == 0) {
      return (false, address(0));
    }

    uint256 minValue = uniqueValues[0];
    for (uint i = 1; i < uniqueValues.length; i++) {
      uint256 val = uniqueValues[i];
      if (val < minValue) {
        minValue = val;
      }
    }

    for (uint i = 0; i < players.length; i++) {
      if (revealedInputs[players[i]] == minValue) {
        address payable winnerPlayer = address(uint160(players[i]));
        return (true, winnerPlayer);
      }
    }

    for (uint i = 0; i < distinctValues.length; i++) {
      delete counts[distinctValues[i]];
    }
  }

  function settle() external {
    if (stage != Stage.IN_PROGRESS || block.number <= revealDeadline) {
      revert();
    }

    (bool hasWinner, address payable winner) = computeWinner();

    if (!hasWinner) {
      // Everybody lost. :-P  Just burn/bury the pot.
    } else {
      emit GotWinnder(winner, pot);
      winner.transfer(pot);
    }
    stage = Stage.END;
  }

  function getInput() public view returns (uint256) {
    return revealedInputs[get_sender()];
  }
}
