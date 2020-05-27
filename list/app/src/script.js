import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

app.store(
  async (state, { event }) => {
    const nextState = {
      ...state,
    }

    try {
      switch (event) {
        case 'Add':
        case 'Remove':
          return { ...nextState, values: await getValues() }
        case events.SYNC_STATUS_SYNCING:
          return { ...nextState, isSyncing: true }
        case events.SYNC_STATUS_SYNCED:
          return { ...nextState, isSyncing: false }
        default:
          return state
      }
    } catch (err) {
      console.log(err)
    }
  },
  {
    init: initializeState(),
  }
)

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

function initializeState() {
  return async (cachedState) => {
    const name = await app.call('name').toPromise()
    const symbol = await app.call('symbol').toPromise()
    const type = 'ADDRESS' // await app.call('listType').toPromise()

    app.identify(`${symbol} List`)

    return {
      ...cachedState,
      name,
      symbol,
      type,
      values: await getValues(),
    }
  }
}

async function getValues() {
  const values = []
  const size = await app.call('size').toPromise()

  for (let i = 0; i < size; i++) {
    const value = await app.call('get', i).toPromise()
    values.push(value)
  }

  return values
}
