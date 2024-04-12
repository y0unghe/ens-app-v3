import type { TFunction } from 'react-i18next'
import type { Address } from 'viem'

import { getChainContractAddress } from '@y0unghe/ens.js/contracts'
import { getRecords } from '@y0unghe/ens.js/public'
import { getSubgraphRecords } from '@y0unghe/ens.js/subgraph'
import { setRecords } from '@y0unghe/ens.js/wallet'

import type { Transaction, TransactionDisplayItem, TransactionFunctionParameters } from '@app/types'
import { profileRecordsToKeyValue } from '@app/utils/records'

type Data = {
  name: string
  resolverAddress?: Address
}

const displayItems = (
  { name }: Data,
  t: TFunction<'translation', undefined>,
): TransactionDisplayItem[] => [
  {
    label: 'name',
    value: name,
    type: 'name',
  },
  {
    label: 'action',
    value: t(`transaction.description.migrateProfile`),
  },
  {
    label: 'info',
    value: t(`transaction.info.migrateProfile`),
  },
]

const transaction = async ({
  client,
  connectorClient,
  data,
}: TransactionFunctionParameters<Data>) => {
  const subgraphRecords = await getSubgraphRecords(client, data)
  if (!subgraphRecords) throw new Error('No subgraph records found')
  const profile = await getRecords(connectorClient, {
    name: data.name,
    texts: subgraphRecords.texts,
    coins: subgraphRecords.coins,
    abi: true,
    contentHash: true,
    resolver: data.resolverAddress
      ? {
          address: data.resolverAddress,
          fallbackOnly: false,
        }
      : undefined,
  })
  const resolverAddress = getChainContractAddress({
    client,
    contract: 'ensPublicResolver',
  })
  if (!profile) throw new Error('No profile found')
  const records = await profileRecordsToKeyValue(profile)
  return setRecords.makeFunctionData(connectorClient, {
    name: data.name,
    resolverAddress,
    ...records,
  })
}

export default { displayItems, transaction } satisfies Transaction<Data>
