import React from 'react'
import { useAragonApi, useGuiStyle } from '@aragon/api-react'
import { Header, Main, SyncIndicator } from '@aragon/ui'
import styled from 'styled-components'

import { locales } from './utils/locales'
import CoordinatesList from './components/list/CoordinatesList'
import AddressList from './components/list/AddressList'
import NameList from './components/list/NameList'

function App() {
  const { appState } = useAragonApi()
  const { appearance } = useGuiStyle()

  const { name, type, isSyncing } = appState

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

  const locale = locales[name.toLowerCase()]
  const title = locale ? locale.title : name
  const description = locale ? locale.description : null

  return (
    <Main theme={appearance}>
      {isSyncing && <SyncIndicator />}
      <HeaderWithSub primary={title} />
      {description && <SubHeader>{description}</SubHeader>}
      {renderList()}
    </Main>
  )
}

const HeaderWithSub = styled(Header)`
  padding-bottom: 10px;
`

const SubHeader = styled.div`
  text-align: left;
`

export default App
