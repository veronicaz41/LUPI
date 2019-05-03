import Web3 from "web3";
import LUPIArtifact from "../build/contracts/LUPI.json";
import { RelayProvider } from 'tabookey-gasless'

const App = {
  web3: null,
  account: null,
  contract: null,

  start: async function() {
    const { web3 } = this;
    const relayProvider = new RelayProvider(web3.currentProvider, {
      force_gasLimit: 5000000,
      force_gasPrice: 1200000000,
      verbose: true,
      txfee: 12,
    });
    web3.setProvider(relayProvider);

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = LUPIArtifact.networks[networkId];
      this.contract = new web3.eth.Contract(
        LUPIArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      this.getBalance();
      this.getPhase();
      this.getReward();
    } catch (error) {
      console.error("Could not connect to contract or chain.");
      console.error(error);
    }
  },

  getBalance: async function() {
    const { balance } = this.contract.methods;
    const amount = await balance().call({from: this.account}) / 1E18;
    const balanceElement = document.getElementById("balance");
    balanceElement.innerHTML = "Balance: " + amount + " ether";
  },

  getPhase: async function() {
    const { getPhase } = this.contract.methods;
    const phase = await getPhase().call({from: this.account});
    const phases = ["Game hasn't started", "Commit", "Reveal", "Settle"];
    const phaseElement = document.getElementById("phase");
    phaseElement.innerHTML = phases[phase];
  },

  getReward: async function() {
    const { getReward } = this.contract.methods;
    const reward = await getReward().call({from: this.account});
    if (reward > 0) {
      const winnerElement = document.getElementById("winner");
      winnerElement.classList.remove("hidden");
      const rewardElement = document.getElementById("reward");
      rewardElement.innerHTML = reward / 1E18;
    }
  },

  donateToPot: async function() {
    const { deposit } = this.contract.methods;
    console.log(this.contract);
    this.setStatus("Depositing... (please wait)", "donate-status");
    try {
      this.web3.currentProvider.enable(false);
      const result = await deposit().send({from: this.account, value: 10**18});
      this.web3.currentProvider.enable(true);
      this.setStatus("Donate successful!", "donate-status");
      this.getBalance();
    } catch (error) {
      this.setStatus(error, "donate-status");
    }
  },

  startGame: async function() {
    const { start } = this.contract.methods;
    this.setStatus("Starting... (please wait)", "start-status");
    try {
      const result = await start().send({from: this.account});
      this.setStatus("Game started!", "start-status");
      this.getPhase();
    } catch (error) {
      this.setStatus(error, "start-status");
    }
  },

  commitInput: async function() {
    const { commitInput } = this.contract.methods;
    // input validation
    const inputStr = document.getElementById("input").value;
    const saltStr = document.getElementById("salt").value;
    const input = parseInt(inputStr);
    const salt = parseInt(saltStr);
    if (input == Infinity || String(input) !== inputStr || input <= 0) {
      this.setStatus("Please input a positive integer", "commit-status");
      return;
    }
    if (salt == Infinity || String(salt) != saltStr || salt <= 0) {
      this.setStatus("Please input a positive integer for salt too", "commit-status");
      return;
    }
    const encryptedInput = this.web3.utils.soliditySha3(inputStr, saltStr);

    this.setStatus("Committing... (please wait)", "commit-status");
    try {
      const result = await commitInput(encryptedInput).send({from: this.account});
      this.setStatus("Input committed!", "commit-status");
    } catch (error) {
      this.setStatus(error, "commit-status");
    }
  },

  revealInput: async function() {
    const { revealInput } = this.contract.methods;
    const inputStr = document.getElementById("reveal-input").value;
    const saltStr = document.getElementById("reveal-salt").value;
    const input = parseInt(inputStr);
    const salt = parseInt(saltStr);
    if (input == Infinity || String(input) !== inputStr || input <= 0) {
      this.setStatus("Please input a positive integer", "reveal-status");
      return;
    }
    if (salt == Infinity || String(salt) != saltStr || salt <= 0) {
      this.setStatus("Please input a positive integer for salt too", "commit-status");
      return;
    }

    this.setStatus("Revealing... (please wait)", "reveal-status");
    try {
      const result = await revealInput(input, salt).send({from: this.account});
      this.setStatus("Reveal completed!", "reveal-status");
    } catch (error) {
      this.setStatus(error, "reveal-status");
    }
  },

  settle: async function() {
    const { settle } = this.contract.methods;
    this.setStatus("Settling... (please wait)", "settle-status");
    try {
      const result = await settle().send({from: this.account});
      this.setStatus("Game over!", "settle-status");
      this.getPhase();
      this.getReward();
    } catch (error) {
      this.setStatus(error, "settle-status");
    }
  },

  withdrawReward: async function() {
    const { withdrawReward } = this.contract.methods;
    this.setStatus("Withdrawing... (please wait)", "withdraw-status");
    try {
      const result = await withdrawReward().send({from: this.account});
      this.setStatus("Congrats! Wtihdraw successful!", "withdraw-status");
      const winnerElement = document.getElementById("winner");
      winnerElement.classList.add("hidden");
    } catch (error) {
      this.setStatus(error, "withdraw-status");
    }
  },

  setStatus: (message, id) => {
    const status = document.getElementById(id);
    status.innerHTML = message;
  },
};

window.App = App;

window.addEventListener("load", async () => {
  if (window.ethereum) {
    // modern dapp browsers
    // use MetaMask's provider
    App.web3 = new Web3(ethereum);
    try {
      // get permission to access accounts
      await ethereum.enable();
    } catch (error) {
      // User denied account access...
      console.warn("Please enable account access.")
    }
  } else if (window.web3) {
    // legacy dapp browsers
    App.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545.",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
    );
  }

  App.start();
});
