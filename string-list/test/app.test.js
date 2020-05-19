const { assert } = require('chai')
const { assertRevert } = require('@aragon/contract-test-helpers/assertThrow')
const { newDao, newApp } = require('./helpers/dao')
const { setOpenPermission } = require('./helpers/permissions')

const StringListApp = artifacts.require('StringListApp.sol')

contract('StringListApp', ([appManager, user]) => {
  const INIT_VALUE = 42

  let appBase, app

  before('deploy base app', async () => {
    // Deploy the app's base contract.
    appBase = await StringListApp.new(INIT_VALUE)
  })

  beforeEach('deploy dao and app', async () => {
    const { dao, acl } = await newDao(appManager)

    // Instantiate a proxy for the app, using the base contract as its logic implementation.
    const proxyAddress = await newApp(
      dao,
      'string-list',
      appBase.address,
      appManager
    )
    app = await StringListApp.at(proxyAddress)

    // Set up the app's permissions.
    await setOpenPermission(acl, app.address, await app.ADD_ROLE(), appManager)
    await setOpenPermission(
      acl,
      app.address,
      await app.REMOVE_ROLE(),
      appManager
    )

    // Initialize the app's proxy.
    await app.initialize(INIT_VALUE)
  })

  it('should be incremented by any address', async () => {
    await app.increment(1, { from: user })
    assert.equal(await app.value(), INIT_VALUE + 1)
  })

  it('should not be decremented beyond 0', async () => {
    await assertRevert(app.decrement(INIT_VALUE + 1))
  })
})
