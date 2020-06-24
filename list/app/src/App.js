import React from 'react'
import { useAragonApi, useGuiStyle } from '@aragon/api-react'
import { Header, Main, SyncIndicator, Text, textStyle } from '@aragon/ui'

import CoordinatesList from './components/list/CoordinatesList'
import AddressList from './components/list/AddressList'
import NameList from './components/list/NameList'

function App() {
  const { appState } = useAragonApi()
  const { appearance } = useGuiStyle()

  const { name, symbol, type, isSyncing } = appState

  function renderList() {
    switch (type) {
      case 'COORDINATES':
        return <CoordinatesList />
      case 'ADDRESS':
        return <AddressList />
      case 'NAME':
        return <NameList />
      default:
        return null
    }
  }

  return (
    <Main theme={appearance}>
      {isSyncing && <SyncIndicator />}
      <Header primary={name} />
      {renderList()}
    </Main>
  )
}

export default App
