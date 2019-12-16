import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

app.store(async (state, { event }) => {
  let nextState = { ...state }

  // Initial state
  if (state == null) {
    nextState = {
      katalysts: await getKatalysts()
    }
  }

  switch (event) {
    case 'AddKatalyst':
    case 'RemoveKatalyst':
      nextState = { ...nextState, katalysts: await getKatalysts() }
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

async function getKatalysts() {
  const katalysts = []
  const katalystCount = await app.call('katalystCount').toPromise()

  for (let i = 0; i < katalystCount; i++) {
    const katalystId = await app.call('katalystIds', i).toPromise()
    const { id, owner, domain } = await app
      .call('katalystById', katalystId)
      .toPromise()

    katalysts.push({ id, owner, domain })
  }

  return katalysts
}
