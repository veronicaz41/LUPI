const LowestUniquePositiveInteger = artifacts.require("LowestUniquePositiveInteger");
const LUPI = artifacts.require("LUPI");
const LUPIRelayVersion = artifacts.require("LUPIRelayVersion");

module.exports = function(deployer, network) {
    //deployer.deploy(LowestUniquePositiveInteger);
    //deployer.deploy(LUPI);

    // To deploy gas station network version
    const RelayHubRopstenAddr = "0x1349584869A1C7b8dc8AE0e93D8c15F5BB3B4B87"
    let dep = deployer.deploy(LUPIRelayVersion, RelayHubRopstenAddr);
    dep.then(()=>{
      console.log( "=== Make sure to use http://gsn.tabookey.com/webtools/contractmanager.html" )
      console.log( "===  to make a deposit for ", LUPIRelayVersion.address, "on network", network )
    })
};
