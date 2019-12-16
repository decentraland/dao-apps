/* global artifacts contract beforeEach it assert */

const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { getEventArgument } = require('@aragon/test-helpers/events')
const { assertEvent } = require('@aragon/test-helpers/assertEvent')(web3)
const { hash } = require('eth-ens-namehash')
const deployDAO = require('./helpers/deployDAO')

const KatalystApp = artifacts.require('KatalystApp.sol')

const APP_AUTH_FAILED = 'APP_AUTH_FAILED'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const ERROR_OWNER_IN_USE = 'ERROR_OWNER_IN_USE'
const ERROR_DOMAIN_IN_USE = 'ERROR_DOMAIN_IN_USE'
const ERROR_KATALYST_NOT_FOUND = 'ERROR_KATALYST_NOT_FOUND'

const domain1 = 'https://decentraland-1.org'
const domain2 = 'https://decentraland-2.org'
const domain3 = 'https://decentraland-3.org'

contract(
  'KatalystApp',
  ([
    appManager,
    user,
    anotherUser,
    katalystOwner1,
    katalystOwner2,
    katalystOwner3,
    hacker
  ]) => {
    let app

    const fromUser = { from: user }
    const fromAnotherUser = { from: anotherUser }
    const fromHacker = { from: hacker }
    const katalystOwners = [katalystOwner1, katalystOwner2, katalystOwner3]
    const domains = [domain1, domain2, domain3]

    beforeEach('deploy dao and app', async () => {
      const { dao, acl } = await deployDAO(appManager)

      // Deploy the app's base contract.
      const appBase = await KatalystApp.new()

      // Instantiate a proxy for the app, using the base contract as its logic implementation.
      const instanceReceipt = await dao.newAppInstance(
        hash('catalyst.aragonpm.test'), // appId - Unique identifier for each app installed in the DAO; can be any bytes32 constests.
        appBase.address, // appBase - Location of the app's base implementation.
        '0x',
        false, // initializePayload - Used to instantiate and initialize the proxy in the same call (if given a non-empty bytes const  false, // setDefault - Whether the app proxy is the default proxy.
        { from: appManager }
      )
      app = KatalystApp.at(
        getEventArgument(instanceReceipt, 'NewAppProxy', 'proxy')
      )

      // Set up the app's permissions.
      await acl.createPermission(
        user, // entity (who?) - The entity or address that will have the permission.
        app.address, // app (where?) - The app that holds the role involved in this permission.
        await app.MODIFY_ROLE(), // role (what?) - The particular role that the entity is being assigned to in this permission.
        appManager, // manager - Can grant/revoke further permissions for this role.
        { from: appManager }
      )

      // Grant permissions to another address.
      await acl.grantPermission(
        anotherUser, // entity (who?) - The entity or address that will have the permission.
        app.address, // app (where?) - The app that holds the role involved in this permission.
        await app.MODIFY_ROLE(), // role (what?) - The particular role that the entity is being assigned to in this permission.
        { from: appManager }
      )

      await app.initialize()
    })

    describe('Add and Remove Katalyst', () => {
      it('should add a katalyst', async () => {
        let katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 0)

        const receipt = await app.addKatalyst(katalystOwner1, domain1, fromUser)

        katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 1)

        const katalystId = await app.katalystIds(0)
        assertEvent(receipt, 'AddKatalyst', {
          _id: katalystId,
          _owner: katalystOwner1,
          _domain: domain1
        })

        const katalystIndex = await app.katalystIndexById(katalystId)
        const [id, owner, domain] = await app.katalystById(katalystId)

        assert(katalystIndex, 0)
        assert.equal(id, katalystId)
        assert.equal(owner, katalystOwner1)
        assert.equal(domain, domain1)
      })

      it('should remove a katalyst', async () => {
        let katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 0)

        await app.addKatalyst(katalystOwner1, domain1, fromUser)

        katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 1)

        let katalystId = await app.katalystIds(0)
        let katalyst = await app.katalystById(katalystId)

        assert.equal(katalyst[0], katalystId)
        assert.equal(katalyst[1], katalystOwner1)
        assert.equal(katalyst[2], domain1)

        const receipt = await app.removeKatalyst(katalystId, fromUser)
        assertEvent(receipt, 'RemoveKatalyst', {
          _id: katalystId,
          _owner: katalystOwner1,
          _domain: domain1
        })

        katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 0)

        katalyst = await app.katalystById(katalystId)

        assert.equal(katalyst[0], ZERO_BYTES32)
        assert.equal(katalyst[1], ZERO_ADDRESS)
        assert.equal(katalyst[2], '')
      })

      it('should add katalysts', async () => {
        let katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 0)

        await app.addKatalyst(katalystOwner1, domain1, fromUser)
        await app.addKatalyst(katalystOwner2, domain2, fromUser)
        await app.addKatalyst(katalystOwner3, domain3, fromAnotherUser)

        katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 3)

        for (let i = 0; i < katalystCount.toNumber(); i++) {
          const katalystId = await app.katalystIds(i)

          const katalystIndex = await app.katalystIndexById(katalystId)
          const [id, owner, domain] = await app.katalystById(katalystId)

          assert(katalystIndex, i)
          assert.equal(id, katalystId)
          assert.equal(owner, katalystOwners[i])
          assert.equal(domain, domains[i])
        }
      })

      it('should remove katalysts', async () => {
        let katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 0)

        await app.addKatalyst(katalystOwner1, domain1, fromUser)
        await app.addKatalyst(katalystOwner2, domain2, fromUser)
        await app.addKatalyst(katalystOwner3, domain3, fromAnotherUser)

        katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 3)

        // Check values for third katalyst
        let katalystId = await app.katalystIds(2)
        let katalystIndex = await app.katalystIndexById(katalystId)
        let katalyst = await app.katalystById(katalystId)

        assert(katalystIndex, 2)
        assert.equal(katalyst[0], katalystId)
        assert.equal(katalyst[1], katalystOwner3)
        assert.equal(katalyst[2], domain3)

        // Remove first one
        // The last katalyst (3) should be the first one then
        katalystId = await app.katalystIds(0)
        await app.removeKatalyst(katalystId, fromUser)

        // Check that first katalyst was removed
        katalystIndex = await app.katalystIndexById(katalystId)
        katalyst = await app.katalystById(katalystId)

        assert(katalystIndex, 0)
        assert.equal(katalyst[0], ZERO_BYTES32)
        assert.equal(katalyst[1], ZERO_ADDRESS)
        assert.equal(katalyst[2], '')

        katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 2)

        katalystId = await app.katalystIds(0)
        katalystIndex = await app.katalystIndexById(katalystId)
        katalyst = await app.katalystById(katalystId)

        assert(katalystIndex, 0)
        assert.equal(katalyst[0], katalystId)
        assert.equal(katalyst[1], katalystOwner3)
        assert.equal(katalyst[2], domain3)

        // Check values for second katalyst
        katalystId = await app.katalystIds(1)
        katalystIndex = await app.katalystIndexById(katalystId)
        katalyst = await app.katalystById(katalystId)

        assert(katalystIndex, 1)
        assert.equal(katalyst[0], katalystId)
        assert.equal(katalyst[1], katalystOwner2)
        assert.equal(katalyst[2], domain2)

        // Remove first one
        // The last katalyst (2) should be the first one then
        katalystId = await app.katalystIds(0)

        await app.removeKatalyst(katalystId, fromUser)

        // Check that third katalyst was removed
        katalystIndex = await app.katalystIndexById(katalystId)
        katalyst = await app.katalystById(katalystId)

        assert(katalystIndex, 0)
        assert.equal(katalyst[0], ZERO_BYTES32)
        assert.equal(katalyst[1], ZERO_ADDRESS)
        assert.equal(katalyst[2], '')

        katalystCount = await app.katalystCount()
        assert.equal(katalystCount.toNumber(), 1)

        katalystId = await app.katalystIds(0)
        katalystIndex = await app.katalystIndexById(katalystId)
        katalyst = await app.katalystById(katalystId)

        assert(katalystIndex, 0)
        assert.equal(katalyst[0], katalystId)
        assert.equal(katalyst[1], katalystOwner2)
        assert.equal(katalyst[2], domain2)
      })

      it('should re-add a katalyst with an owner and/or domain removed', async () => {
        await app.addKatalyst(katalystOwner1, domain1, fromUser)
        let katalystId = await app.katalystIds(0)
        await app.removeKatalyst(katalystId, fromUser)

        // Use same owner and domain
        await app.addKatalyst(katalystOwner1, domain1, fromUser)
        katalystId = await app.katalystIds(0)
        await app.removeKatalyst(katalystId, fromUser)

        // Use same owner
        await app.addKatalyst(katalystOwner1, domain2, fromUser)
        katalystId = await app.katalystIds(0)
        await app.removeKatalyst(katalystId, fromUser)

        // Use same domain
        await app.addKatalyst(katalystOwner2, domain1, fromUser)
        katalystId = await app.katalystIds(0)
        await app.removeKatalyst(katalystId, fromUser)
      })

      it('reverts when trying to add a katalyst by an unauthorized sender', async () => {
        await assertRevert(
          app.addKatalyst(katalystOwner1, domain1, fromHacker),
          APP_AUTH_FAILED
        )
      })

      it('reverts when trying to add a katalyst with a used owner', async () => {
        await app.addKatalyst(katalystOwner1, domain1, fromUser)

        await assertRevert(
          app.addKatalyst(katalystOwner1, domain2, fromUser),
          ERROR_OWNER_IN_USE
        )
      })

      it('reverts when trying to add a katalyst with a used domain', async () => {
        await app.addKatalyst(katalystOwner1, domain1, fromUser)

        await assertRevert(
          app.addKatalyst(katalystOwner2, domain1, fromUser),
          ERROR_DOMAIN_IN_USE
        )
      })

      it('reverts when trying to remove a non-existing katalyst', async () => {
        await app.addKatalyst(katalystOwner1, domain1, fromUser)

        const katalystId = await app.katalystIds(0)

        await app.removeKatalyst(katalystId, fromUser)

        await assertRevert(
          app.removeKatalyst(katalystId, fromUser),
          ERROR_KATALYST_NOT_FOUND
        )
      })
    })
  }
)
