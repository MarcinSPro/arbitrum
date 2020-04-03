/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, Signer } from "ethers";
import { Provider } from "ethers/providers";

import { ArbSys } from "./ArbSys";

export class ArbSysFactory {
    static connect(
        address: string,
        signerOrProvider: Signer | Provider
    ): ArbSys {
        return new Contract(address, _abi, signerOrProvider) as ArbSys;
    }
}

const _abi = [
    {
        constant: false,
        inputs: [
            {
                name: "dest",
                type: "address"
            },
            {
                name: "amount",
                type: "uint256"
            }
        ],
        name: "withdrawERC20",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        constant: false,
        inputs: [
            {
                name: "dest",
                type: "address"
            },
            {
                name: "id",
                type: "uint256"
            }
        ],
        name: "withdrawERC721",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        constant: false,
        inputs: [
            {
                name: "dest",
                type: "address"
            },
            {
                name: "amount",
                type: "uint256"
            }
        ],
        name: "withdrawEth",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "currentMessageTime",
        outputs: [
            {
                name: "",
                type: "uint256"
            }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "timeUpperBound",
        outputs: [
            {
                name: "",
                type: "uint256"
            }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
    },
    {
        constant: true,
        inputs: [
            {
                name: "account",
                type: "address"
            }
        ],
        name: "getTransactionCount",
        outputs: [
            {
                name: "",
                type: "uint256"
            }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
    },
    {
        constant: false,
        inputs: [
            {
                name: "account",
                type: "address"
            }
        ],
        name: "cloneContract",
        outputs: [
            {
                name: "",
                type: "address"
            }
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
    }
];
