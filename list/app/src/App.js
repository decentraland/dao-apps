import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Header, Main, SyncIndicator, Text, textStyle } from '@aragon/ui'

import CoordinatesList from './components/CoordinatesList'

function App() {
  const { appState } = useAragonApi()

  const { name, symbol, isSyncing } = appState

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
      <CoordinatesList />
    </Main>
  )
}

export default App
