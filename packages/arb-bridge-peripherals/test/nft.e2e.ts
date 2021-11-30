/*
 * Copyright 2019-2020, Offchain Labs, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-env node, mocha */
import { ethers } from 'hardhat'
import { assert, expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract, ContractFactory } from 'ethers'
import { L1NftGateway, L1NftRouter, L2NftGateway } from '../build/types'

describe('Bridge peripherals end-to-end', () => {
  let accounts: SignerWithAddress[]

  let l1RouterTestBridge: L1NftRouter
  let l1TestBridge: L1NftGateway
  let l2TestBridge: L2NftGateway

  const maxSubmissionCost = 1
  const maxGas = 1000000000
  const gasPrice = 1

  before(async function () {
    accounts = await ethers.getSigners()

    // l1 side deploy
    const L1RouterTestBridge = await ethers.getContractFactory('L1NftRouter')
    l1RouterTestBridge = await L1RouterTestBridge.deploy()

    const L1TestBridge = await ethers.getContractFactory('L1NftGatewayTester')
    l1TestBridge = await L1TestBridge.deploy()

    // l2 side deploy

    const StandardArbERC721 = await ethers.getContractFactory(
      'StandardArbERC721'
    )
    const standardArbERC721Logic = await StandardArbERC721.deploy()

    const UpgradeableBeacon = await ethers.getContractFactory(
      'UpgradeableBeacon'
    )
    const beacon = await UpgradeableBeacon.deploy(
      standardArbERC721Logic.address
    )
    const BeaconProxyFactory = await ethers.getContractFactory(
      'BeaconProxyFactory'
    )
    const beaconProxyFactory = await BeaconProxyFactory.deploy()
    const cloneableProxyHash = await beaconProxyFactory.cloneableProxyHash()

    await beaconProxyFactory.initialize(beacon.address)

    const L2TestBridge = await ethers.getContractFactory('L2NftGatewayTester')
    l2TestBridge = await L2TestBridge.deploy()

    // const L2RouterTestBridge: ContractFactory = await ethers.getContractFactory(
    //   'L2GatewayRouter'
    // )
    // l2RouterTestBridge = await L2RouterTestBridge.deploy()

    await l1TestBridge.functions.initialize(
      l2TestBridge.address,
      l1RouterTestBridge.address,
      accounts[0].address // inbox
      //   cloneableProxyHash,
      //   beaconProxyFactory.address
    )

    await l2TestBridge.initialize(
      l1TestBridge.address,
      accounts[1].address, //   router
      beaconProxyFactory.address
    )

    // address _counterpartGateway,
    // address _defaultGateway,
    // address _inbox

    await l1RouterTestBridge.functions.initialize(
      accounts[1].address, // l2RouterTestBridge.address, // counterparty
      l1TestBridge.address, // defaultGateway
      accounts[0].address // inbox
    )

    // const l2DefaultGateway = await l1TestBridge.counterpartGateway()
    // await l2RouterTestBridge.functions.initialize(
    //   l1RouterTestBridge.address,
    //   l2DefaultGateway
    // )

    // assert.equal(
    //   await l2TestBridge.cloneableProxyHash(),
    //   await l1TestBridge.cloneableProxyHash(),
    //   'Wrong cloneable Proxy Hash'
    // )
  })

  it('should deposit tokens', async function () {
    const Token = await ethers.getContractFactory('TestERC721')
    const token = await Token.deploy('mock', 'mck')
    // send escrowed tokens to bridge
    const tokenId = 3
    await token.mint(accounts[0].address, tokenId, '0x')
    await token.approve(l1TestBridge.address, tokenId)

    const data = '0x'

    await l1RouterTestBridge.deposit(
      token.address,
      tokenId,
      accounts[0].address,
      false,
      maxGas,
      gasPrice,
      maxSubmissionCost,
      accounts[0].address,
      data,
      { value: maxSubmissionCost + maxGas * gasPrice }
    )

    const escrowedTokens = await token.balanceOf(l1TestBridge.address)
    assert.equal(escrowedTokens.toNumber(), 1, 'Tokens not escrowed')

    const l2TokenAddress = await l2TestBridge.calculateL2TokenAddress(
      token.address
    )
    const l2TokenAddressFromL1Router =
      await l1RouterTestBridge.calculateL2TokenAddress(token.address, tokenId)
    assert.equal(
      l2TokenAddressFromL1Router,
      l2TokenAddress,
      'Wrong address oracle'
    )

    const l2Token = await Token.attach(l2TokenAddress)
    const l2Balance = await l2Token.balanceOf(accounts[0].address)
    assert.equal(l2Balance.toNumber(), 1, 'Tokens not minted')
  })

  //   it('should withdraw erc20 tokens from L2 without router', async function () {
  //     const Token = await ethers.getContractFactory('TestERC20')
  //     const token = await Token.deploy()
  //     // send escrowed tokens to bridge
  //     const tokenAmount = 100
  //     await token.mint()
  //     await token.approve(l1TestBridge.address, tokenAmount)

  //     const data = ethers.utils.defaultAbiCoder.encode(
  //       ['uint256', 'bytes'],
  //       [maxSubmissionCost, '0x']
  //     )

  //     await l1RouterTestBridge.outboundTransfer(
  //       token.address,
  //       accounts[0].address,
  //       tokenAmount,
  //       maxGas,
  //       gasPrice,
  //       data,
  //       { value: maxSubmissionCost + maxGas * gasPrice }
  //     )

  //     const prevUserBalance = await token.balanceOf(accounts[0].address)

  //     await l2TestBridge.functions[
  //       'outboundTransfer(address,address,uint256,bytes)'
  //     ](token.address, accounts[0].address, tokenAmount, '0x')

  //     const postUserBalance = await token.balanceOf(accounts[0].address)

  //     assert.equal(
  //       prevUserBalance.toNumber() + tokenAmount,
  //       postUserBalance.toNumber(),
  //       'Tokens not escrowed'
  //     )
  //   })

  //   it('should withdraw erc20 tokens from L2 using router', async function () {
  //     const Token = await ethers.getContractFactory('TestERC20')
  //     const token = await Token.deploy()
  //     // send escrowed tokens to bridge
  //     const tokenAmount = 100
  //     await token.mint()
  //     await token.approve(l1TestBridge.address, tokenAmount)

  //     const data = ethers.utils.defaultAbiCoder.encode(
  //       ['uint256', 'bytes'],
  //       [maxSubmissionCost, '0x']
  //     )

  //     await l1RouterTestBridge.outboundTransfer(
  //       token.address,
  //       accounts[0].address,
  //       tokenAmount,
  //       maxGas,
  //       gasPrice,
  //       data,
  //       { value: maxSubmissionCost + maxGas * gasPrice }
  //     )

  //     const prevUserBalance = await token.balanceOf(accounts[0].address)

  //     await l2RouterTestBridge.functions[
  //       'outboundTransfer(address,address,uint256,bytes)'
  //     ](token.address, accounts[0].address, tokenAmount, '0x')

  //     const postUserBalance = await token.balanceOf(accounts[0].address)

  //     assert.equal(
  //       prevUserBalance.toNumber() + tokenAmount,
  //       postUserBalance.toNumber(),
  //       'Tokens not escrowed'
  //     )
  //   })

  //   it('should force withdraw correctly if deposit is incorrect', async function () {
  //     const Token = await ethers.getContractFactory('TestERC20')
  //     const token = await Token.deploy()
  //     // send escrowed tokens to bridge
  //     const tokenAmount = 100
  //     await token.mint()
  //     await token.approve(l1TestBridge.address, tokenAmount)

  //     const data = ethers.utils.defaultAbiCoder.encode(
  //       ['uint256', 'bytes'],
  //       [maxSubmissionCost, '0x']
  //     )

  //     const prevUserBalance = await token.balanceOf(accounts[0].address)
  //     const prevAllowance = await token.allowance(
  //       accounts[0].address,
  //       l1TestBridge.address
  //     )

  //     // here we set the L2 router to recover in case of a bad BeaconProxyFactory deploy
  //     await l2TestBridge.setStubAddressOracleReturn(accounts[0].address)

  //     await l1RouterTestBridge.outboundTransfer(
  //       token.address,
  //       accounts[0].address,
  //       tokenAmount,
  //       maxGas,
  //       gasPrice,
  //       data,
  //       { value: maxSubmissionCost + maxGas * gasPrice }
  //     )

  //     const postUserBalance = await token.balanceOf(accounts[0].address)
  //     const postAllowance = await token.allowance(
  //       accounts[0].address,
  //       l1TestBridge.address
  //     )

  //     assert.equal(
  //       prevUserBalance.toNumber(),
  //       postUserBalance.toNumber(),
  //       'Tokens not escrowed'
  //     )
  //     assert.equal(
  //       prevAllowance.toNumber() - tokenAmount,
  //       postAllowance.toNumber(),
  //       'Tokens not spent in allowance'
  //     )

  //     const l2TokenAddress = await l1RouterTestBridge.calculateL2TokenAddress(
  //       token.address
  //     )

  //     const l2Token = await Token.attach(l2TokenAddress)
  //     const l2Balance = await l2Token.balanceOf(accounts[0].address)

  //     assert.equal(l2Balance.toNumber(), 0, 'User has tokens in L2')

  //     // reset stub return in test case
  //     await l2TestBridge.setStubAddressOracleReturn(ethers.constants.AddressZero)
  //   })

  //   it('should deposit tokens with bytes32 field correctly', async function () {
  //     const Token = await ethers.getContractFactory('Bytes32ERC20WithMetadata')
  //     const token = await Token.deploy()
  //     // send escrowed tokens to bridge
  //     const tokenAmount = 100
  //     await token.mint()
  //     await token.approve(l1TestBridge.address, tokenAmount)

  //     const data = ethers.utils.defaultAbiCoder.encode(
  //       ['uint256', 'bytes'],
  //       [maxSubmissionCost, '0x']
  //     )

  //     await l1RouterTestBridge.outboundTransfer(
  //       token.address,
  //       accounts[0].address,
  //       tokenAmount,
  //       maxGas,
  //       gasPrice,
  //       data,
  //       { value: maxSubmissionCost + maxGas * gasPrice }
  //     )

  //     const l2TokenAddress = await l2RouterTestBridge.calculateL2TokenAddress(
  //       token.address
  //     )

  //     const l2Code = await ethers.provider.getCode(l2TokenAddress)
  //     assert.notEqual(l2Code, '0x', 'No code at L2 token address')

  //     const l2Token = await ethers.getContractAt(
  //       'StandardArbERC20',
  //       l2TokenAddress
  //     )

  //     const name = await l2Token.name()
  //     const symbol = await l2Token.symbol()

  //     assert.equal(name, 'Maker')
  //     assert.equal(symbol, 'MKR')
  //   })

  //   it('should not have L2 getters for unavailable fields', async function () {
  //     const Token = await ethers.getContractFactory('Bytes32ERC20')
  //     const token = await Token.deploy()
  //     // send escrowed tokens to bridge
  //     const tokenAmount = 100
  //     await token.mint()
  //     await token.approve(l1TestBridge.address, tokenAmount)

  //     const data = ethers.utils.defaultAbiCoder.encode(
  //       ['uint256', 'bytes'],
  //       [maxSubmissionCost, '0x']
  //     )

  //     await l1RouterTestBridge.outboundTransfer(
  //       token.address,
  //       accounts[0].address,
  //       tokenAmount,
  //       maxGas,
  //       gasPrice,
  //       data,
  //       { value: maxSubmissionCost + maxGas * gasPrice }
  //     )

  //     const l2TokenAddress = await l2RouterTestBridge.calculateL2TokenAddress(
  //       token.address
  //     )

  //     const l2Code = await ethers.provider.getCode(l2TokenAddress)
  //     assert.notEqual(l2Code, '0x', 'No code at L2 token address')

  //     const l2Token = await ethers.getContractAt(
  //       'StandardArbERC20',
  //       l2TokenAddress
  //     )

  //     await expect(l2Token.name()).to.be.revertedWith('')
  //     await expect(l2Token.symbol()).to.be.revertedWith('')
  //     await expect(l2Token.decimals()).to.be.revertedWith('')
  //   })
})
