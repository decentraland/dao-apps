const { assert } = require('chai')
const { assertRevert } = require('@aragon/contract-test-helpers/assertThrow')
const { assertEvent } = require('@aragon/contract-test-helpers/assertEvent')
const { newDao, newApp } = require('./helpers/dao')
const { setOpenPermission } = require('./helpers/permissions')

const StringListApp = artifacts.require('StringListApp.sol')

contract('StringListApp', ([appManager, user, hacker]) => {
  const PLACE_HOLDER = '____INVALID_PLACE_HOLER'
  const APP_AUTH_FAILED = 'APP_AUTH_FAILED'
  const ERROR_VALUE_NOT_PART_OF_THE_LIST = 'ERROR_VALUE_NOT_PART_OF_THE_LIST'
  const ERROR_VALUE_PART_OF_THE_LIST = 'ERROR_VALUE_PART_OF_THE_LIST'
  const ERROR_INVALID_INDEX = 'ERROR_INVALID_INDEX'
  const ERROR_INVALID_VALUE = 'ERROR_INVALID_VALUE'
  const ERROR_INVALID_TYPE = 'ERROR_INVALID_TYPE'

  const name = 'Test App'
  const symbol = 'TEST'
  const values = [
    'Value1',
    'Value2',
    'Value3',
    'Value4',
    'Value5',
    'Value6',
    'Value7',
  ]

  let appBase, app

  before('deploy base app', async () => {
    // Deploy the app's base contract.
    appBase = await StringListApp.new()
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
    await acl.createPermission(
      user,
      app.address,
      await app.ADD_ROLE(),
      appManager
    )

    await acl.createPermission(
      user,
      app.address,
      await app.REMOVE_ROLE(),
      appManager
    )

    // Initialize the app's proxy.
    await app.initialize(name, symbol, 'COORDINATES')
  })

  describe('List type', async function () {
    it('should be inintialized with COORINDATES type', async () => {
      const { dao, acl } = await newDao(appManager)

      // Instantiate a proxy for the app, using the base contract as its logic implementation.
      const proxyAddress = await newApp(
        dao,
        'string-list',
        appBase.address,
        appManager
      )

      const app = await StringListApp.at(proxyAddress)

      // Set up the app's permissions.
      await acl.createPermission(
        user,
        app.address,
        await app.ADD_ROLE(),
        appManager
      )

      await acl.createPermission(
        user,
        app.address,
        await app.REMOVE_ROLE(),
        appManager
      )

      // Initialize the app's proxy.
      await app.initialize(name, symbol, 'COORDINATES')

      assert(await app.name, name)
      assert(await app.symbol, symbol)
      assert(await app.listType, 'COORDINATES')
    })

    it('should be inintialized with NAMES type', async () => {
      const { dao, acl } = await newDao(appManager)

      // Instantiate a proxy for the app, using the base contract as its logic implementation.
      const proxyAddress = await newApp(
        dao,
        'string-list',
        appBase.address,
        appManager
      )

      const app = await StringListApp.at(proxyAddress)

      // Set up the app's permissions.
      await acl.createPermission(
        user,
        app.address,
        await app.ADD_ROLE(),
        appManager
      )

      await acl.createPermission(
        user,
        app.address,
        await app.REMOVE_ROLE(),
        appManager
      )

      // Initialize the app's proxy.
      await app.initialize(name, symbol, 'NAMES')
      assert(await app.name, name)
      assert(await app.symbol, symbol)
      assert(await app.listType, 'NAMES')
    })

    it('reverts when trying to initialize with an invalid type', async () => {
      const { dao, acl } = await newDao(appManager)

      // Instantiate a proxy for the app, using the base contract as its logic implementation.
      const proxyAddress = await newApp(
        dao,
        'string-list',
        appBase.address,
        appManager
      )

      let app = await StringListApp.at(proxyAddress)

      // Set up the app's permissions.
      await acl.createPermission(
        user,
        app.address,
        await app.ADD_ROLE(),
        appManager
      )

      await acl.createPermission(
        user,
        app.address,
        await app.REMOVE_ROLE(),
        appManager
      )

      // Initialize the app's proxy.
      await assertRevert(
        app.initialize(name, symbol, 'NOT_SUPPORTED_TYPE'),
        ERROR_INVALID_TYPE
      )
    })
  })

  describe('Add', () => {
    it('should add an element to the list', async () => {
      let size = await app.size()
      assert.equal(size, 0)

      const receipt = await app.add('Value1', { from: user })

      assertEvent(receipt, 'Add', {
        _caller: user,
        _value: 'Value1',
      })

      size = await app.size()
      assert.equal(size, 1)

      const value = await app.get(0)
      assert.equal(value, 'Value1')
    })

    it('should add elements to the list', async () => {
      let size = await app.size()
      assert.equal(size, 0)

      for (let i = 0; i < values.length; i++) {
        await app.add(values[i], { from: user })
      }

      size = await app.size()
      assert.equal(size, values.length)

      for (let i = 0; i < values.length; i++) {
        const value = await app.get(i)
        assert.equal(value, values[i])
      }
    })

    it('reverts when trying to add a repeated element', async () => {
      await app.add('Value1', { from: user })
      await assertRevert(
        app.add('Value1', { from: user }),
        ERROR_VALUE_PART_OF_THE_LIST
      )

      await assertRevert(app.get(1), ERROR_INVALID_INDEX)
    })

    it('reverts when trying to get by an invalid index', async () => {
      await assertRevert(app.get(0), ERROR_INVALID_INDEX)
    })

    it('reverts when trying to add the invalid place holder', async () => {
      await assertRevert(
        app.add(PLACE_HOLDER, { from: user }),
        ERROR_INVALID_VALUE
      )
    })

    it('reverts when trying to add an element by an unauthorized sender', async () => {
      await assertRevert(app.add('Value1', { from: hacker }), APP_AUTH_FAILED)
    })
  })

  describe('Remove', () => {
    it('should remove an element from the list', async () => {
      await app.add('Value1', { from: user })

      const receipt = await app.remove('Value1', { from: user })
      assertEvent(receipt, 'Remove', {
        _caller: user,
        _value: 'Value1',
      })

      size = await app.size()
      assert.equal(size, 0)

      await assertRevert(app.get(0), ERROR_INVALID_INDEX)
    })

    it('should remove elements from the list', async () => {
      // From values to Value1 to Value7 (7)
      for (let i = 0; i < values.length; i++) {
        await app.add(values[i], { from: user })
      }

      let size = await app.size()
      assert.equal(size, 7)

      // Remove 2nd value
      await app.remove('Value2', { from: user })
      size = await app.size()
      assert.equal(size, 6)
      assert.equal(await app.get(0), values[0])
      assert.equal(await app.get(1), values[6])
      assert.equal(await app.get(2), values[2])
      assert.equal(await app.get(3), values[3])
      assert.equal(await app.get(4), values[4])
      assert.equal(await app.get(5), values[5])

      // Remove last value
      await app.remove('Value6', { from: user })
      size = await app.size()
      assert.equal(size, 5)
      assert.equal(await app.get(0), values[0])
      assert.equal(await app.get(1), values[6])
      assert.equal(await app.get(2), values[2])
      assert.equal(await app.get(3), values[3])
      assert.equal(await app.get(4), values[4])

      // Remove 3rd value
      await app.remove('Value3', { from: user })
      size = await app.size()
      assert.equal(size, 4)
      assert.equal(await app.get(0), values[0])
      assert.equal(await app.get(1), values[6])
      assert.equal(await app.get(2), values[4])
      assert.equal(await app.get(3), values[3])

      // Remove 1st value
      await app.remove('Value1', { from: user })
      size = await app.size()
      assert.equal(size, 3)
      assert.equal(await app.get(0), values[3])
      assert.equal(await app.get(1), values[6])
      assert.equal(await app.get(2), values[4])
    })

    it('reverts when trying to remove a non exist', async () => {
      await assertRevert(
        app.remove('Value1', { from: user }),
        ERROR_VALUE_NOT_PART_OF_THE_LIST
      )
      await assertRevert(
        app.remove('Value2', { from: user }),
        ERROR_VALUE_NOT_PART_OF_THE_LIST
      )

      await app.add('Value1', { from: user })
      await app.remove('Value1', { from: user })

      await assertRevert(
        app.remove('Value1', { from: user }),
        ERROR_VALUE_NOT_PART_OF_THE_LIST
      )
    })

    it('reverts when trying to remove an element by an unauthorized sender', async () => {
      app.add('Value1', { from: user })
      await assertRevert(
        app.remove('Value1', { from: hacker }),
        APP_AUTH_FAILED
      )
    })
  })
})
