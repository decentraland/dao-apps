import React, { useState } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Button, DataView } from '@aragon/ui'
import styled from 'styled-components'

export default function CoordinatesList() {
  const { api, appState } = useAragonApi()

  const [x, setX] = useState('')
  const [y, setY] = useState('')
  const [error, setError] = useState('')

  const { symbol, values } = appState

  function isValidCoordinate(i) {
    return !isNaN(i) && i >= -150 && i <= 150
  }

  function addPOI() {
    setError(null)
    try {
      if (!isValidCoordinate(x)) {
        throw new Error(
          `X must be a number between -150 to 150, but '${x}' found`
        )
      }

      if (!isValidCoordinate(y)) {
        throw new Error(
          `Y must be a number between -150 to 150, but '${y}' found`
        )
      }

      api.add(`${x.trim()},${y.trim()}`).toPromise()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <Title>{`Add a new ${symbol}`}</Title>
      <AddCoordinate>
        <Input
          type="text"
          placeholder="x"
          name="x"
          value={x}
          onChange={(e) => setX(e.currentTarget.value)}
        />
        <Input
          type="text"
          placeholder="y"
          name="y"
          value={y}
          onChange={(e) => setY(e.currentTarget.value)}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button
          mode="strong"
          disabled={!x.length || !y.length}
          onClick={addPOI}
        >
          {`Add ${symbol}`}
        </Button>
      </AddCoordinate>
      {values.length ? (
        <DataWrapper>
          <DataView
            mode="table"
            fields={['POI', 'Actions']}
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

const AddCoordinate = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
  margin-top: 20px;
`

const Input = styled.input`
  width: 70px;
  padding: 7px;
  font-size: 14px;
  margin-right: 25px;

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
