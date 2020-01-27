import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

app.store(async (state, { event }) => {
  let nextState = { ...state }

  // Initial state
  if (state == null) {
    nextState = {
      catalysts: await getCatalysts()
    }
  }

  switch (event) {
    case 'AddCatalyst':
    case 'RemoveCatalyst':
      nextState = { ...nextState, catalysts: await getCatalysts() }
      break
    case events.SYNC_STATUS_SYNCING:
      nextState = { ...nextState, isSyncing: true }
      break
    case events.SYNC_STATUS_SYNCED:
      nextState = { ...nextState, isSyncing: false }
      break
  }

  return nextState
})

async function getCatalysts() {
  const catalysts = []
  const catalystCount = await app.call('catalystCount').toPromise()

  for (let i = 0; i < catalystCount; i++) {
    const catalystId = await app.call('catalystIds', i).toPromise()
    const { id, owner, domain } = await app
      .call('catalystById', catalystId)
      .toPromise()

    catalysts.push({ id, owner, domain })
  }

  return catalysts
}
