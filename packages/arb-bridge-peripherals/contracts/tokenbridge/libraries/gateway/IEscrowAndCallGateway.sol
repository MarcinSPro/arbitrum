// SPDX-License-Identifier: Apache-2.0

/*
 * Copyright 2020, Offchain Labs, Inc.
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

pragma solidity ^0.6.11;

interface IEscrowAndCallGateway {
    event TransferAndCallTriggered(
        bool success,
        address indexed _from,
        address indexed _to,
        uint256 _amount,
        bytes callHookData
    );

    function inboundEscrowAndCall(
        address _l2Address,
        address _from,
        address _to,
        uint256 _amount,
        bytes memory _data
    ) external;

    function finalizeInboundTransferAndCall(
        address _token,
        address _from,
        address _to,
        uint256 _amount,
        address refundAddrOnRevert,
        uint256 externalCallGas,
        bytes calldata _data
    ) external payable;

    function outboundTransferWithCall(
        address _token,
        address _refundTo,
        address _to,
        uint256 _amount,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        address refundAddrOnRevert,
        uint256 externalCallGas,
        bytes calldata _data
    ) external payable returns (bytes memory);

    function getOutboundCalldataWithCall(
        address _token,
        address _from,
        address _to,
        uint256 _amount,
        address refundAddrOnRevert,
        uint256 externalCallGas,
        bytes memory _data
    ) external view returns (bytes memory);
}
