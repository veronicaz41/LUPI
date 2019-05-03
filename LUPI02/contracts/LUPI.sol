pragma solidity ^0.5.0;

import "tabookey-gasless/contracts/RelayRecipient.sol";

contract LUPI is RelayRecipient {
  enum Stage { INIT, IN_PROGRESS, END }

  Stage public stage = Stage.INIT;
  address payable public owner = msg.sender;
  uint public pot = 1 ether;
  // Ropsten average block time 9.2 seconds
  // 18 blocks is about 3 min
  uint public commitDuration = 18;
  uint public revealDuration = 18;
  uint public balance;

  uint private commitDeadline;
  uint private revealDeadline;

  address[] private players;
  mapping(address => bytes32) private blindedInputs;
  mapping(address => uint) private revealedInputs;
  mapping(uint => uint) private counts;
  mapping(address => uint) private rewards;

  event CommitInput(address indexed user, bytes32 blindedInput);
  event BogusReveal(address indexed user);
  event RevealInput(address indexed user, uint input);
  event GameOver(address indexed winner);

  modifier onlyOwner() {
    require(get_sender() == owner);
    _;
  }

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

  function setPot(uint _pot) external onlyOwner {
    require(stage != Stage.IN_PROGRESS);
    pot = _pot;
  }

  function setCommitDuration(uint _duration) external onlyOwner {
    require(stage != Stage.IN_PROGRESS);
    commitDuration = _duration;
  }

  function setRevealDuration(uint _duration) external onlyOwner {
    require(stage != Stage.IN_PROGRESS);
    revealDuration = _duration;
  }

  function withdraw(uint amount) external onlyOwner {
    require(stage != Stage.IN_PROGRESS && amount <= balance);
    balance -= amount;
    owner.transfer(amount);
  }

  function deposit() payable external {
    balance += msg.value;
  }

  function reset() private {
    if (stage == Stage.INIT) {
      return;
    }
    for (uint i = 0; i < players.length; i++) {
      delete blindedInputs[players[i]];
      delete revealedInputs[players[i]];
    }
    delete players;
  }

  function start() external onlyOwner {
    require(stage != Stage.IN_PROGRESS && balance >= pot);
    reset();
    commitDeadline = block.number + commitDuration;
    revealDeadline = commitDeadline + revealDuration;
    stage = Stage.IN_PROGRESS;
  }

  function commitInput(bytes32 input) external {
    require(stage == Stage.IN_PROGRESS && block.number <= commitDeadline);
    players.push(get_sender());
    blindedInputs[get_sender()] = input;
    emit CommitInput(get_sender(), input);
  }

  function revealInput(uint number, uint nonce) external {
    require(stage == Stage.IN_PROGRESS
       && block.number > commitDeadline
       && block.number <= revealDeadline);
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
    uint numDistinct = 0;
    uint[] memory distinctValues = new uint[](players.length);

    for (uint i = 0; i < players.length; i++) {
      uint val = revealedInputs[players[i]];
      if (val == 0)
        continue;
      counts[val]++;
      if (counts[val] == 1) {
        distinctValues[numDistinct++] = val;
      }
    }

    uint numUnique = 0;
    uint[] memory uniqueValues = new uint[](numDistinct);
    for (uint i = 0; i < distinctValues.length; i++) {
      uint val = distinctValues[i];
      if (counts[val] == 1) {
        uniqueValues[numUnique++] = val;
      }
    }

    if (uniqueValues.length == 0) {
      return (false, address(0));
    }

    uint minValue = uniqueValues[0];
    for (uint i = 1; i < uniqueValues.length; i++) {
      uint val = uniqueValues[i];
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
    require(stage == Stage.IN_PROGRESS && block.number > revealDeadline);

    (bool hasWinner, address payable winner) = computeWinner();
    emit GameOver(winner);
    stage = Stage.END;
    if (hasWinner) {
      balance -= pot;
      rewards[winner] += pot;
    }
  }

  function withdrawReward() external {
    uint reward = rewards[get_sender()];
    rewards[get_sender()] = 0;
    address payable addr = address(uint160(get_sender()));
    addr.transfer(reward);
  }

  function getInput() public view returns (uint) {
    return revealedInputs[get_sender()];
  }

  function getReward() public view returns (uint) {
    return rewards[get_sender()];
  }
}
