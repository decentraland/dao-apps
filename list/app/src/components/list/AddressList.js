import React, { useState, useEffect } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Button, DataView, IdentityBadge } from '@aragon/ui'
import { ethers } from 'ethers'
import styled from 'styled-components'

function AsyncName({ address }) {
  const { api } = useAragonApi()
  const [name, setName] = useState('N/A')

  useEffect(() => {
    getName()
  }, [])

  async function getName() {
    // The Contract interface
    let abi = [
      'function name() view returns (string value)',
      'function symbol() view returns (string value)',
    ]

    console.log(web3, await web3.eth.getAccounts())
    let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

    // The address from the above deployment example

    // We connect to the Contract using a Provider, so we will only
    // have read-only access to the Contract
    try {
      console.log(provider, api)
      const contract = new ethers.Contract(address, abi, provider)
      return setName(`${await contract.symbol()} (${await contract.name()})`)
    } catch (e) {
      console.log(e.message)
      return setName('N/A')
    }
  }

  return <p>{name}</p>
}

export default function AddressList() {
  const { api, appState } = useAragonApi()

  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  const { symbol, values } = appState

  function getChecksumAddress() {
    try {
      return ethers.utils.getAddress(address)
    } catch (e) {
      throw new Error(`Invalid address`)
    }
  }

  function addAddress() {
    setError(null)
    try {
      const addressToAdd = getChecksumAddress()

      api.add(addressToAdd).toPromise()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <Title>{`Add a new ${symbol}`}</Title>
      <AddAddress>
        <Input
          type="text"
          placeholder="0x123...."
          name="address"
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button mode="strong" disabled={!address.length} onClick={addAddress}>
          {`Add ${symbol}`}
        </Button>
      </AddAddress>
      {values.length ? (
        <DataWrapper>
          <DataView
            mode="table"
            fields={['Address', 'Name', 'Actions']}
            entries={values}
            renderEntry={(value) => {
              const row = [
                <IdentityBadge entity={value} />,
                <>
                  <AsyncName address={value} />
                </>,
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

const AddAddress = styled.div`
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