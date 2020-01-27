import React, { useState } from 'react'
import { useAragonApi, useGuiStyle } from '@aragon/api-react'
import { Main, DataView, Button, IdentityBadge } from '@aragon/ui'
import styled from 'styled-components'

function App() {
  const { api, appState } = useAragonApi()
  const { appearance } = useGuiStyle()

  const { catalysts, isSyncing } = appState
  const [owner, setOwner] = useState('')
  const [domain, setDomain] = useState('')
  const [error, setError] = useState('')

  function addCatalyst() {
    let error = ''
    if (owner.length != 42) {
      error += 'Invalid Owner'
    }

    if (domain.length === 0 || domain.indexOf('://') === -1) {
      error += '\nInvalid Domain'
    }

    if (!error) {
      api.addCatalyst(owner, domain).toPromise()
    }

    setError(error)
  }

  return (
    <Main theme={appearance}>
      <BaseLayout>
        {isSyncing ? (
          <Syncing />
        ) : (
          <>
            <Title>Catalysts</Title>
            <AddCatalyst>
              <Input
                type="text"
                placeholder="0xb4124cEB3451635DAcedd11767f004d8a28c6eE7"
                name="owner"
                value={owner}
                onChange={e => setOwner(e.currentTarget.value)}
              />
              <Input
                type="text"
                name="domain"
                placeholder="https://decentraland.org"
                value={domain}
                onChange={e => setDomain(e.currentTarget.value)}
              />
              {error && <Error>{error}</Error>}
              <Button
                mode="strong"
                disabled={!owner.length || !domain.length}
                onClick={addCatalyst}
              >
                Add catalyst
              </Button>
            </AddCatalyst>

            {catalysts.length ? (
              <DataWrapper>
                <DataView
                  mode="table"
                  fields={['Owner', 'Domain', 'Actions']}
                  entries={catalysts}
                  renderEntry={({ id, owner, domain }) => {
                    const values = [
                      <IdentityBadge entity={owner} />,
                      <p>{domain}</p>,
                      <Button
                        mode="normal"
                        onClick={() => api.removeCatalyst(id).toPromise()}
                      >
                        Remove
                      </Button>
                    ]

                    return values
                  }}
                />
              </DataWrapper>
            ) : null}
          </>
        )}
      </BaseLayout>
    </Main>
  )
}

const BaseLayout = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  flex-direction: column;
`

const Title = styled.h1`
  margin-top: 40px;
  font-size: 28px;
`

const DataWrapper = styled.div`
  width: 100%;
  margin-top: 40px;
`

const Syncing = styled.div.attrs({ children: 'Syncing…' })`
  position: absolute;
  top: 15px;
  right: 20px;
`

const AddCatalyst = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-top: 20px;
`

const Input = styled.input`
  width: 400px;
  padding: 7px;
  font-size: 14px;
  margin-bottom: 20px;

  ::-webkit-input-placeholder {
    /* Chrome/Opera/Safari */
    color: #d2d2d2;
  }
  ::-moz-placeholder {
    /* Firefox 19+ */
    color: #d2d2d2;
  }
  :-ms-input-placeholder {
    /* IE 10+ */
    color: #d2d2d2;
  }
  :-moz-placeholder {
    /* Firefox 18- */
    color: #d2d2d2;
  }
`

const Error = styled.p`
  color: #fd4949;
  white-space: pre-line;
  margin-bottom: 10px;
`

export default App
