import type { TFunction } from 'react-i18next'
import { Address } from 'viem'

import { getChainContractAddress } from '@y0unghe/ens.js/contracts'
import { getRecords } from '@y0unghe/ens.js/public'
import { getSubgraphRecords } from '@y0unghe/ens.js/subgraph'
import { setRecords } from '@y0unghe/ens.js/wallet'

import { Transaction, TransactionDisplayItem, TransactionFunctionParameters } from '@app/types'
import { profileRecordsToKeyValue } from '@app/utils/records'

type Data = {
  name: string
  resolverAddress: Address
}

const displayItems = ({ name }: Data, t: TFunction): TransactionDisplayItem[] => {
  return [
    {
      label: 'name',
      value: name,
      type: 'name',
    },
    {
      label: 'action',
      value: t('transaction.description.migrateProfileWithReset'),
    },
    {
      label: 'info',
      value: t('transaction.info.migrateProfileWithReset'),
    },
  ]
}

const transaction = async ({
  client,
  connectorClient,
  data,
}: TransactionFunctionParameters<Data>) => {
  const { name, resolverAddress } = data
  const subgraphRecords = await getSubgraphRecords(client, {
    name,
    resolverAddress,
  })
  const profile = await getRecords(client, {
    name,
    texts: subgraphRecords?.texts || [],
    coins: subgraphRecords?.coins || [],
    abi: true,
    contentHash: true,
    resolver: resolverAddress
      ? {
          address: resolverAddress,
          fallbackOnly: false,
        }
      : undefined,
  })

  const profileRecords = await profileRecordsToKeyValue(profile)
  const latestResolverAddress = getChainContractAddress({
    client,
    contract: 'ensPublicResolver',
  })

  return setRecords.makeFunctionData(connectorClient, {
    name: data.name,
    ...profileRecords,
    clearRecords: true,
    resolverAddress: latestResolverAddress,
  })
}

export default { displayItems, transaction } satisfies Transaction<Data>
