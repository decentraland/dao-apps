import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Header, Main, SyncIndicator, Text, textStyle } from '@aragon/ui'

import CoordinatesList from './components/list/CoordinatesList'
import AddressList from './components/list/AddressList'

function App() {
  const { appState } = useAragonApi()

  const { name, symbol, type, isSyncing } = appState

  function renderList() {
    switch (type) {
      case 'COORDINATES':
        return <CoordinatesList />
      case 'ADDRESS':
        return <AddressList />
      default:
        return null
    }
  }

  return (
    <Main>
      {isSyncing && <SyncIndicator />}
      <Header
        primary={name}
        secondary={
          <Text
            css={`
              ${textStyle('title2')}
            `}
          >
            {symbol}
          </Text>
        }
      />
      {renderList()}
    </Main>
  )
}

export default App
