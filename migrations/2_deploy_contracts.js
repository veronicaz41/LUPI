const LUPI = artifacts.require("LUPI");
const LUPIBasic = artifacts.require("LUPIBasic");

module.exports = function(deployer, network) {
    //deployer.deploy(LUPI);

    // To deploy gas station network version
    const RelayHubRopstenAddr = "0x1349584869A1C7b8dc8AE0e93D8c15F5BB3B4B87"
    let dep = deployer.deploy(LUPIBasic, RelayHubRopstenAddr);
    dep.then(()=>{
      console.log( "=== Make sure to use http://gsn.tabookey.com/webtools/contractmanager.html" )
      console.log( "===  to make a deposit for ", LUPIBasic.address, "on network", network )
    })
};
