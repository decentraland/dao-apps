/* global artifacts */
var KatalystApp = artifacts.require('KatalystApp.sol')

module.exports = function(deployer) {
  deployer.deploy(KatalystApp)
}
