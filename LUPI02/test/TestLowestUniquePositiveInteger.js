const LowestUniquePositiveIntege = artifacts.require("./LowestUniquePositiveInteger.sol");

contract('LowestUniquePositiveIntege', async accounts => {
  it("should be able to commit input 89", async () => {
    let instance = await LowestUniquePositiveIntege.deployed();
    await instance.commitInput(89);
    let input = await instance.getInput();
    assert.equal(input.toNumber(), 89, "The commited input should have been 89.");
  });
});
