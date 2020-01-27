/* global artifacts */
var CatalystApp = artifacts.require('CatalystApp.sol')

module.exports = function(deployer) {
  deployer.deploy(CatalystApp)
}
