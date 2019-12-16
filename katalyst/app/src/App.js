import React, { useState } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
import styled from 'styled-components'

function App() {
  const { api, appState } = useAragonApi()
  const { katalysts, isSyncing } = appState
  const [owner, setOwner] = useState('')
  const [domain, setDomain] = useState('')

  return (
    <Main>
      <BaseLayout>
        {isSyncing ? (
          <Syncing />
        ) : (
          <>
            <h1>Katalysts</h1>
            {katalysts.map(katalyst => (
              <div
                key={katalyst.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  alignContent: 'center',
                  justifyContent: 'space-between',
                  width: '40%'
                }}
              >
                <p style={{ marginTop: '20px' }}>{katalyst.id}</p>
                <p style={{ marginTop: '20px' }}>{katalyst.domain}</p>
                <p style={{ marginTop: '20px' }}>{katalyst.owner}</p>
                <Button
                  mode="secondary"
                  onClick={() => api.removeKatalyst(katalyst.id).toPromise()}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div>
              <AddressInput
                type="text"
                placeholder="0x123..."
                value={owner}
                onChange={e => setOwner(e.currentTarget.value)}
              />
              <DomainInput
                type="text"
                placeholder="https://google.com/"
                value={domain}
                onChange={e => setDomain(e.currentTarget.value)}
              />
            </div>
            <Buttons>
              <Button
                mode="secondary"
                onClick={() => api.addKatalyst(owner, domain).toPromise()}
              >
                Add katalyst
              </Button>
            </Buttons>
          </>
        )}
      </BaseLayout>
    </Main>
  )
}

const BaseLayout = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  flex-direction: column;
`

const Count = styled.h1`
  font-size: 30px;
`

const Buttons = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 40px;
  margin-top: 20px;
`

const Syncing = styled.div.attrs({ children: 'Syncing…' })`
  position: absolute;
  top: 15px;
  right: 20px;
`

const AddressInput = styled.input`
  width: 300px;
  font-size: 12px;
`

const DomainInput = styled.input`
  width: 200px;
  font-size: 12p;
`

export default App
