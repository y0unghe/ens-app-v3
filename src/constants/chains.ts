import { holesky } from 'viem/chains'
import { goerli, localhost, mainnet } from 'wagmi/chains'

import { addEnsContracts } from '@y0unghe/ens.js'

import type { Register } from '@app/local-contracts'
import { makeLocalhostChainWithEns } from '@app/utils/chains/makeLocalhostChainWithEns'
import { Chain, defineChain } from 'viem'

export const sepolia = /*#__PURE__*/ defineChain({
  id: 11_155_111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
      apiUrl: 'https://api-sepolia.etherscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 751532,
    },
    ensRegistry: { address: '0x680ccb702b742bc4972dB89eD7d4A8b8Be52877b' },
    ensUniversalResolver: {
      address: '0x1e3393161629b75466D25A1BDdE5Bb3025D3F41a',
      blockCreated: 5674386,
    },
    ensBaseRegistrarImplementation: {
      address: '0x610a87b2b591d5e61d920A1347AB4BB44cF2dEbC',
    },
    ensBulkRenewal: {
      address: '0x81Ed71c5ee5906B112E1d5F9d0B7635e350E5817',
    },
    ensDnsRegistrar: {
      address: '0xb1B8596382a334fCc7eD702F044d51608E42B9eA',
    },
    ensDnssecImpl: {
      address: '0x97C4A83513F3ce1D4e27703271180ba222589Edc',
    },
    ensEthRegistrarController: {
      address: '0xE99aa7E040b3e8161b64EFB169c315442a8dFd6C',
    },
    ensNameWrapper: {
      address: '0xfD42c176a1b34EAfb0eA33Bc60EFC5E0C6A0E1c7',
    },
    ensPublicResolver: {
      address: '0x5a70652592A14EB2E8dd977B5b84e5E1621b261c',
    },
    ensReverseRegistrar: {
      address: '0x7B6d9422758C151Bc95f72DB9c2DdCe02E05f611',
    }
  },
  subgraphs: {
    ens: {
      url: 'https://api.studio.thegraph.com/query/47821/ens-subgraph-sepolia/version/latest',
    },
  },
  testnet: true,
}) satisfies Chain

export const deploymentAddresses = JSON.parse(
  process.env.NEXT_PUBLIC_DEPLOYMENT_ADDRESSES || '{}',
) as Register['deploymentAddresses']

export const localhostWithEns = makeLocalhostChainWithEns<typeof localhost>(
  localhost,
  deploymentAddresses,
)

export const mainnetWithEns = addEnsContracts(mainnet)
export const goerliWithEns = addEnsContracts(goerli)
// TODO: IMPORTANT 一定要把设置这个为我们自定义的合约地址。addEnsContracts()不知道为什么，总是不能返回我们自定义的合约地址。
export const sepoliaWithEns = sepolia
export const holeskyWithEns = addEnsContracts(holesky)

export const chainsWithEns = [
  mainnetWithEns,
  goerliWithEns,
  sepoliaWithEns,
  holeskyWithEns,
  localhostWithEns,
] as const

export const getSupportedChainById = (chainId: number | undefined) =>
  chainId ? chainsWithEns.find((c) => c.id === chainId) : undefined

export type SupportedChain =
  | typeof mainnetWithEns
  | typeof goerliWithEns
  | typeof sepoliaWithEns
  | typeof holeskyWithEns
  | typeof localhostWithEns
