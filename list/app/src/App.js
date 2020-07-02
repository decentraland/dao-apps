import React from 'react'
import { useAragonApi, useGuiStyle } from '@aragon/api-react'
import { Header, Main, SyncIndicator } from '@aragon/ui'
import styled from 'styled-components'

import { getLocale } from './utils/locales'
import CoordinatesList from './components/list/CoordinatesList'
import AddressList from './components/list/AddressList'
import NameList from './components/list/NameList'

function App() {
  const { appState } = useAragonApi()
  const { appearance } = useGuiStyle()
  console.log(appState)
  const { appName, appType, isSyncing } = appState

  function renderList() {
    switch (appType) {
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

  const locale = getLocale(appName)
  const title = locale.get('title')
  const description = locale.get('description')

  return (
    <Main theme={appearance}>
      {isSyncing && <SyncIndicator />}
      <HeaderWithSub primary={title} />
      {description.length > 0 && <SubHeader>{description}</SubHeader>}
      {renderList()}
    </Main>
  )
}

const HeaderWithSub = styled(Header)`
  padding-bottom: 10px;
  @media (max-width: 768px) {
    box-shadow: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`

const SubHeader = styled.div`
  text-align: left;
  @media (max-width: 768px) {
    padding: 0 16px;
    background-color: white;
    box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.05);
    text-align: left;
    padding-bottom: 10px;
  }
`

export default App
