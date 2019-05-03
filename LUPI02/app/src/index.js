import Web3 from "web3";
import LUPIArtifact from "../../build/contracts/LUPI.json";
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
    } catch (error) {
      console.error("Could not connect to contract or chain.");
      console.error(error);
    }
  },

  // getInput: async function() {
  //   const { getInput } = this.contract.methods;
  //   const input = await getInput().call({from: this.account});
  //
  //   // TODO: if we haven't commit any input yet, this would show 0
  //
  //   const previousElement = document.getElementById("previous-input");
  //   previousElement.innerHTML = input
  // },

  startGame: async function() {
    const { start } = this.contract.methods;
    this.setStatus("Starting... (please wait)");
    try {
      const result = await start().send({from: this.account});
      this.setStatus("Game started!");
    } catch (error) {
      this.setStatus(error);
    }
  },

  commitInput: async function() {
    const { commitInput } = this.contract.methods;
    // input validation
    const inputStr = document.getElementById("input").value;
    const saltStr = document.getElementById("salt").value;
    const input = parseInt(inputStr);
    if (input == Infinity || String(input) !== inputStr || input <= 0) {
      this.setStatus("Please input a positive integer");
      return;
    }
    const encryptedInput = web3.utils.soliditySha3(inputStr, nonceStr);

    this.setStatus("Committing... (please wait)");
    try {
      const result = await commitInput(encryptedInput).send({from: this.account});
      this.setStatus("Input committed!");
    } catch (error) {
      this.setStatus(error);
    }
  },

  revealInput: async function() {
    const { revealInput } = this.contract.methods;
    const inputStr = document.getElementById("reveal-input").value;
    const saltStr = document.getElementById("reveal-salt").value;
    const input = parseInt(inputStr);
    if (input == Infinity || String(input) !== inputStr || input <= 0) {
      this.setStatus("Please input a positive integer");
      return;
    }

    this.setStatus("Revealing... (please wait)");
    try {
      const result = await revealInput(inputStr, saltStr).send({from: this.account});
      this.setStatus("Reveal completed!");
    } catch (error) {
      this.setStatus(error);
    }
  },

  settle: async function() {
    const { settle } = this.contract.methods;
    this.setStatus("Settling... (please wait)");
    try {
      const result = await settle().send({from: this.account});
      this.setStatus("Game over!");
    } catch (error) {
      this.setStatus(error);
    }
  },

  setStatus: (message) => {
    const status = document.getElementById("status");
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