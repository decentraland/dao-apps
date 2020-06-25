import React, { useState } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Button, DataView } from '@aragon/ui'
import styled from 'styled-components'

export default function NameList() {
  const { api, appState } = useAragonApi()

  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const { symbol, values } = appState

  function addName() {
    setError(null)
    try {
      if (name.length === 0) {
        throw new Error('Name should not be empty')
      }

      const regex = new RegExp('^[_A-z0-9]*((-|s)*[_A-z0-9])*$')
      if (!regex.test(name)) {
        throw new Error(`Invalid name: ${name}`)
      }

      api.add(name).toPromise()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <Title>{`Add a new ${symbol}`}</Title>
      <AddName>
        <Input
          type="text"
          placeholder="0x123...."
          name="name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button mode="strong" disabled={!name.length} onClick={addName}>
          {`Add ${symbol}`}
        </Button>
      </AddName>
      {values.length ? (
        <DataWrapper>
          <DataView
            mode="table"
            fields={['Name', 'Actions']}
            entries={values}
            renderEntry={(value) => {
              const row = [
                <p>{value}</p>,
                <Button
                  mode="normal"
                  onClick={() => api.remove(value).toPromise()}
                >
                  Remove
                </Button>,
              ]

              return row
            }}
          />
        </DataWrapper>
      ) : null}
    </>
  )
}

const Title = styled.h1`
  margin-top: 40px;
  font-size: 28px;
`

const AddName = styled.div`
  display: flex;
  align-items: start;
  justify-content: flex-start;
  flex-direction: column;
  margin-top: 20px;
`

const Input = styled.input`
  width: 400px;
  padding: 7px;
  font-size: 14px;
  margin-bottom: 25px;
  color: black;

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

const ErrorMessage = styled.p`
  color: #fd4949;
  white-space: pre-line;
  margin-bottom: 10px;
`

const DataWrapper = styled.div`
  width: 100%;
  margin-top: 40px;
`
