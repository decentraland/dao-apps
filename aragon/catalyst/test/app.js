const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { getEventArgument } = require('@aragon/test-helpers/events')
const { assertEvent } = require('@aragon/test-helpers/assertEvent')(web3)
const { hash } = require('eth-ens-namehash')
const sleep = require('./helpers/sleep')

const CatalystApp = artifacts.require('CatalystApp')
const Kernel = artifacts.require("Kernel");
const ACL = artifacts.require("ACL");
const EVMScriptRegistryFactory = artifacts.require("EVMScriptRegistryFactory");
const DAOFactory = artifacts.require("DAOFactory");

const APP_AUTH_FAILED = 'APP_AUTH_FAILED'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const ERROR_OWNER_IN_USE = 'ERROR_OWNER_IN_USE'
const ERROR_DOMAIN_IN_USE = 'ERROR_DOMAIN_IN_USE'
const ERROR_CATALYST_NOT_FOUND = 'ERROR_CATALYST_NOT_FOUND'
const ERROR_OWNER_EMPTY = 'ERROR_OWNER_EMPTY'
const ERROR_DOMAIN_EMPTY = 'ERROR_DOMAIN_EMPTY'
const ERROR_CATALYST_ALREADY_REMOVED = 'ERROR_CATALYST_ALREADY_REMOVED'

const domain1 = 'https://decentraland-1.org'
const domain2 = 'https://decentraland-2.org'
const domain3 = 'https://decentraland-3.org'

async function getBlockTimestamp(blockNumber) {
  const block = await web3.eth.getBlock(blockNumber || web3.eth.blockNumber)
  return block.timestamp
}

const deployDAO = async (appManager) => {
  // Deploy a DAOFactory.
  const kernelBase = await Kernel.new(true);
  const aclBase = await ACL.new();
  const registryFactory = await EVMScriptRegistryFactory.new();
  const daoFactory = await DAOFactory.new(
    kernelBase.address,
    aclBase.address,
    registryFactory.address
  );

  // Create a DAO instance.
  const daoReceipt = await daoFactory.newDAO(appManager);
  const dao = Kernel.at(getEventArgument(daoReceipt, "DeployDAO", "dao"));

  // Grant the appManager address permission to install apps in the DAO.
  const acl = ACL.at(await dao.acl());
  const APP_MANAGER_ROLE = await kernelBase.APP_MANAGER_ROLE();
  await acl.createPermission(
    appManager,
    dao.address,
    APP_MANAGER_ROLE,
    appManager,
    { from: appManager }
  );

  return { dao, acl };
};

contract(
  'CatalystApp',
  ([
    appManager,
    user,
    anotherUser,
    catalystOwner1,
    catalystOwner2,
    catalystOwner3,
    hacker
  ]) => {
    let app

    const fromUser = { from: user }
    const fromAnotherUser = { from: anotherUser }
    const fromHacker = { from: hacker }
    const catalystOwners = [catalystOwner1, catalystOwner2, catalystOwner3]
    const domains = [domain1, domain2, domain3]

    beforeEach('deploy dao and app', async () => {
      const { dao, acl } = await deployDAO(appManager)

      // Deploy the app's base contract.
      const appBase = await CatalystApp.new()

      // Instantiate a proxy for the app, using the base contract as its logic implementation.
      const instanceReceipt = await dao.newAppInstance(
        hash('catalyst.aragonpm.test'), // appId - Unique identifier for each app installed in the DAO; can be any bytes32 constests.
        appBase.address, // appBase - Location of the app's base implementation.
        '0x',
        false, // initializePayload - Used to instantiate and initialize the proxy in the same call (if given a non-empty bytes const  false, // setDefault - Whether the app proxy is the default proxy.
        { from: appManager }
      )
      app = CatalystApp.at(
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

    describe('Add and Remove Catalyst', () => {
      it('should add a catalyst', async () => {
        let catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 0)

        const receipt = await app.addCatalyst(catalystOwner1, domain1, fromUser)

        catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 1)

        const catalystId = await app.catalystIds(0)

        assertEvent(receipt, 'AddCatalyst', {
          _id: catalystId,
          _owner: catalystOwner1,
          _domain: domain1
        })

        const catalystIndex = await app.catalystIndexById(catalystId)
        const [id, owner, domain] = await app.catalystById(catalystId)

        assert(catalystIndex, 0)
        assert.equal(id, catalystId)
        assert.equal(owner, catalystOwner1)
        assert.equal(domain, domain1)

        let isSet = await app.owners(catalystOwner1)
        assert.equal(isSet, true)

        isSet = await app.domains(web3.sha3(domain1))
        assert.equal(isSet, true)
      })

      it('reverts to add a catalyst with empty owner', async () => {
        await assertRevert(
          app.addCatalyst(ZERO_ADDRESS, domain1, fromUser),
          ERROR_OWNER_EMPTY
        )
      })

      it('reverts to add a catalyst with empty domain', async () => {
        await assertRevert(
          app.addCatalyst(catalystOwner1, '', fromUser),
          ERROR_DOMAIN_EMPTY
        )
      })

      it('reverts to add a catalyst with empty owner and domain', async () => {
        await assertRevert(
          app.addCatalyst(ZERO_ADDRESS, '', fromUser),
          ERROR_OWNER_EMPTY
        )
      })

      it('should remove a catalyst', async () => {
        let catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 0)

        await app.addCatalyst(catalystOwner1, domain1, fromUser)
        const startTimestamp = await getBlockTimestamp()

        catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 1)

        let catalystId = await app.catalystIds(0)
        let catalyst = await app.catalystById(catalystId)

        assert.equal(catalyst[0], catalystId)
        assert.equal(catalyst[1], catalystOwner1)
        assert.equal(catalyst[2], domain1)
        assert.equal(catalyst[3].toNumber(), startTimestamp)
        assert.equal(catalyst[4].toNumber(), 0)

        const receipt = await app.removeCatalyst(catalystId, fromUser)
        assertEvent(receipt, 'RemoveCatalyst', {
          _id: catalystId,
          _owner: catalystOwner1,
          _domain: domain1
        })

        const endTimestamp = await getBlockTimestamp()

        catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 0)

        catalyst = await app.catalystById(catalystId)
        // Catalyst struct should be preserved
        assert.equal(catalyst[0], catalystId)
        assert.equal(catalyst[1], catalystOwner1)
        assert.equal(catalyst[2], domain1)
        assert.equal(catalyst[3].toNumber(), startTimestamp)
        assert.equal(catalyst[4].toNumber(), endTimestamp)

        let isSet = await app.owners(catalystOwner1)
        assert.equal(isSet, false)

        isSet = await app.domains(web3.sha3(domain1))
        assert.equal(isSet, false)

        await assertRevert(app.catalystIds(0))
      })

      it('should add catalysts', async () => {
        let catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 0)

        await app.addCatalyst(catalystOwner1, domain1, fromUser)
        await app.addCatalyst(catalystOwner2, domain2, fromUser)
        await app.addCatalyst(catalystOwner3, domain3, fromAnotherUser)

        catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 3)

        for (let i = 0; i < catalystCount.toNumber(); i++) {
          const catalystId = await app.catalystIds(i)

          const catalystIndex = await app.catalystIndexById(catalystId)
          const [id, owner, domain] = await app.catalystById(catalystId)

          assert(catalystIndex, i)
          assert.equal(id, catalystId)
          assert.equal(owner, catalystOwners[i])
          assert.equal(domain, domains[i])

          let isSet = await app.owners(catalystOwners[i])
          assert.equal(isSet, true)

          isSet = await app.domains(web3.sha3(domains[i]))
          assert.equal(isSet, true)
        }
      })

      it('should remove catalysts', async () => {
        let catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 0)

        let res = await app.addCatalyst(catalystOwner1, domain1, fromUser)
        const catalystId1 = await app.catalystIds(0)
        const catalystStartDate1 = await getBlockTimestamp(
          res.logs[0].blockNumber
        )

        res = await app.addCatalyst(catalystOwner2, domain2, fromUser)
        const catalystId2 = await app.catalystIds(1)
        const catalystStartDate2 = await getBlockTimestamp(
          res.logs[0].blockNumber
        )

        res = await app.addCatalyst(catalystOwner3, domain3, fromAnotherUser)
        const catalystId3 = await app.catalystIds(2)
        const catalystStartDate3 = await getBlockTimestamp(
          res.logs[0].blockNumber
        )

        catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 3)

        // Check values for third catalyst
        let catalystId = await app.catalystIds(2)
        let catalystIndex = await app.catalystIndexById(catalystId)
        let catalyst = await app.catalystById(catalystId)

        assert.equal(catalystIndex, 2)
        assert.equal(catalyst[0], catalystId)
        assert.equal(catalyst[1], catalystOwner3)
        assert.equal(catalyst[2], domain3)

        // Remove first one
        const { logs } = await app.removeCatalyst(catalystId1, fromUser)
        const catalystEndDate1 = await getBlockTimestamp(logs[0].blockNumber)

        // Check that first catalyst was removed (1)
        catalyst = await app.catalystById(catalystId1)
        catalystIndex = await app.catalystIndexById(catalystId)

        assert.equal(catalystIndex, 0)
        assert.equal(catalyst[0], catalystId1)
        assert.equal(catalyst[1], catalystOwner1)
        assert.equal(catalyst[2], domain1)
        assert.equal(catalyst[3].toNumber(), catalystStartDate1)
        assert.equal(catalyst[4].toNumber(), catalystEndDate1)

        let isSet = await app.owners(catalystOwner1)
        assert.equal(isSet, false)

        isSet = await app.domains(web3.sha3(domain1))
        assert.equal(isSet, false)

        // Check catalyst count
        catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 2)

        // The last catalyst (3) should be the first one then
        catalystId = await app.catalystIds(0)
        catalystIndex = await app.catalystIndexById(catalystId)
        catalyst = await app.catalystById(catalystId)

        assert.equal(catalystIndex, 0)
        assert.equal(catalystId, catalystId3)
        assert.equal(catalyst[0], catalystId)
        assert.equal(catalyst[1], catalystOwner3)
        assert.equal(catalyst[2], domain3)

        // Check values for second catalyst (2)
        catalystId = await app.catalystIds(1)
        catalystIndex = await app.catalystIndexById(catalystId)
        catalyst = await app.catalystById(catalystId)

        assert.equal(catalystIndex, 1)
        assert.equal(catalystId, catalystId2)
        assert.equal(catalyst[0], catalystId)
        assert.equal(catalyst[1], catalystOwner2)
        assert.equal(catalyst[2], domain2)

        // Remove first one (3)
        await app.removeCatalyst(catalystId3, fromUser)
        const catalystEndDate3 = await getBlockTimestamp()

        // Check that third catalyst was removed (3)
        catalyst = await app.catalystById(catalystId3)
        catalystIndex = await app.catalystIndexById(catalystId)

        assert.equal(catalystIndex, 0)
        assert.equal(catalyst[0], catalystId3)
        assert.equal(catalyst[1], catalystOwner3)
        assert.equal(catalyst[2], domain3)
        assert.equal(catalyst[3].toNumber(), catalystStartDate3)
        assert.equal(catalyst[4].toNumber(), catalystEndDate3)

        // Check catalyst count
        catalystCount = await app.catalystCount()
        assert.equal(catalystCount.toNumber(), 1)

        // The last catalyst (2) should be the first one then
        catalystId = await app.catalystIds(0)
        catalystIndex = await app.catalystIndexById(catalystId)

        catalyst = await app.catalystById(catalystId)
        assert.equal(catalystIndex, 0)
        assert.equal(catalystId, catalystId2)
        assert.equal(catalyst[0], catalystId)
        assert.equal(catalyst[1], catalystOwner2)
        assert.equal(catalyst[2], domain2)
        assert.equal(catalyst[3].toNumber(), catalystStartDate2)
        assert.equal(catalyst[4].toNumber(), 0)
      })

      it('should re-add a catalyst with an owner and/or domain removed', async () => {
        await app.addCatalyst(catalystOwner1, domain1, fromUser)
        let catalystId = await app.catalystIds(0)
        await app.removeCatalyst(catalystId, fromUser)

        await sleep(1000)

        // Use same owner and domain
        await app.addCatalyst(catalystOwner1, domain1, fromUser)
        catalystId = await app.catalystIds(0)
        await app.removeCatalyst(catalystId, fromUser)

        await sleep(1000)

        // Use same owner
        await app.addCatalyst(catalystOwner1, domain2, fromUser)
        catalystId = await app.catalystIds(0)
        await app.removeCatalyst(catalystId, fromUser)

        await sleep(1000)

        // Use same domain
        await app.addCatalyst(catalystOwner2, domain1, fromUser)
        catalystId = await app.catalystIds(0)
        await app.removeCatalyst(catalystId, fromUser)
      })

      it('reverts when trying to add a catalyst by an unauthorized sender', async () => {
        await assertRevert(
          app.addCatalyst(catalystOwner1, domain1, fromHacker),
          APP_AUTH_FAILED
        )
      })

      it('reverts when trying to add a catalyst with a used owner', async () => {
        await app.addCatalyst(catalystOwner1, domain1, fromUser)

        await assertRevert(
          app.addCatalyst(catalystOwner1, domain2, fromUser),
          ERROR_OWNER_IN_USE
        )
      })

      it('reverts when trying to add a catalyst with a used domain', async () => {
        await app.addCatalyst(catalystOwner1, domain1, fromUser)

        await assertRevert(
          app.addCatalyst(catalystOwner2, domain1, fromUser),
          ERROR_DOMAIN_IN_USE
        )
      })

      it('reverts when trying to remove an already removed catalyst', async () => {
        await app.addCatalyst(catalystOwner1, domain1, fromUser)

        const catalystId = await app.catalystIds(0)

        await app.removeCatalyst(catalystId, fromUser)

        await assertRevert(
          app.removeCatalyst(catalystId, fromUser),
          ERROR_CATALYST_ALREADY_REMOVED
        )
      })

      it('reverts when trying to remove a non-existing id catalyst', async () => {
        await assertRevert(
          app.removeCatalyst(ZERO_BYTES32.replace('0x00', '0x01'), fromUser),
          ERROR_CATALYST_NOT_FOUND
        )
      })

      it('reverts when trying to remove a zero id catalyst', async () => {
        await assertRevert(
          app.removeCatalyst(ZERO_BYTES32, fromUser),
          ERROR_CATALYST_ALREADY_REMOVED
        )
      })
    })
  }
)
