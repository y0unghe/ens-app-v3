import {
  QueryFunctionContext,
  useQueries,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query'
import { useMemo } from 'react'
import { Address, BlockTag, GetBlockParameters, GetBlockReturnType } from 'viem'
import { getBlock } from 'viem/actions'
import { useAccount, useClient } from 'wagmi'

import { ChainWithEns } from '@y0unghe/ens.js/contracts'
import { GetNameHistoryReturnType } from '@y0unghe/ens.js/subgraph'
import { ChildFuseKeys, decodeFuses, ParentFuseKeys } from '@y0unghe/ens.js/utils'

import { AnyFuseKey, ClientWithEns, CreateQueryKey } from '@app/types'

import { useNameHistory } from '../ensjs/subgraph/useNameHistory'
import { createQueryKey } from '../useQueryOptions'

type UseFusesSetDatesParameters = {
  name: string
  enabled?: boolean
}

type FuseSetBlocks = [AnyFuseKey, number][]

type FuseSetEntries = {
  [key in AnyFuseKey]?: string
}

type GetBlockQueryKey<
  TIncludeTransactions extends boolean = false,
  TBlockTag extends BlockTag = 'latest',
> = CreateQueryKey<GetBlockParameters<TIncludeTransactions, TBlockTag>, 'getBlock', 'standard'>

export const getBlockQueryFn =
  (client: ClientWithEns) =>
  async <TIncludeTransactions extends boolean = false, TBlockTag extends BlockTag = 'latest'>({
    queryKey: [params],
  }: QueryFunctionContext<GetBlockQueryKey<TIncludeTransactions, TBlockTag>>) => {
    return getBlock(client, params)
  }

export const generateFuseSetBlocks = (
  nameHistory: GetNameHistoryReturnType | undefined,
): {
  blocksNeeded: Set<bigint>
  fuseSetBlocks: FuseSetBlocks
} => {
  if (!nameHistory) return { blocksNeeded: new Set<bigint>(), fuseSetBlocks: [] }
  const { domainEvents } = nameHistory

  let hasWrappedEvent = false
  const fusesSetMap: Map<AnyFuseKey, bigint> = new Map()

  for (let i = domainEvents.length - 1; i >= 0 && !hasWrappedEvent; i -= 1) {
    const reference = domainEvents[i]
    switch (reference.type) {
      case 'NameWrapped':
        hasWrappedEvent = true
      // eslint-disable-next-line no-fallthrough
      case 'FusesSet': {
        const decodedFuses = decodeFuses(reference.fuses)
        const burnedParentFuses = ParentFuseKeys.filter((key) => decodedFuses.parent[key])
        const burnedChildFuses = ChildFuseKeys.filter((key) => decodedFuses.child[key])
        const burnedFuses = [...burnedParentFuses, ...burnedChildFuses]
        for (const fuse of burnedFuses) {
          fusesSetMap.set(fuse, BigInt(reference.blockNumber))
        }
        break
      }
      default:
        break
    }
  }
  if (!hasWrappedEvent) return { blocksNeeded: new Set<bigint>(), fuseSetBlocks: [] }
  return {
    blocksNeeded: new Set(fusesSetMap.values()),
    fuseSetBlocks: [...fusesSetMap.entries()].map(([f, b]) => [f, Number(b)]),
  }
}

export const generateGetBlockQueryArray = (
  client: ClientWithEns,
  { address, blocksNeeded }: { address: Address | undefined; blocksNeeded: Set<bigint> },
) => {
  return [...blocksNeeded].map(
    (blockNumber) =>
      ({
        queryKey: createQueryKey({
          chainId: client.chain.id,
          address,
          functionName: 'getBlock',
          params: { blockNumber },
          queryDependencyType: 'standard',
        }),
        queryFn: getBlockQueryFn(client),
        staleTime: Infinity,
      }) as const,
  )
}

export const generateMatchedFuseBlockData = ({
  fuseSetBlocks,
  blockDatas,
  queries,
}: {
  fuseSetBlocks: FuseSetBlocks
  blockDatas: UseQueryResult<GetBlockReturnType<ChainWithEns, boolean, BlockTag>, unknown>[]
  queries: ReturnType<typeof generateGetBlockQueryArray>
}) => {
  if (fuseSetBlocks.length === 0)
    return { data: undefined, hasLoadingBlocks: false, hasFetchingBlocks: false }
  const data: FuseSetEntries = {}
  const blockMap = new Map(
    blockDatas.map((query, i) => [queries[i].queryKey[0].blockNumber.toString(), query]),
  )

  let hasLoadingBlocks = false
  let hasFetchingBlocks = false
  let hasIncompleteData = false
  let hasAllSuccessData = true

  for (const [fuseKey, blockNumber] of fuseSetBlocks) {
    const blockQuery = blockMap.get(blockNumber.toString())
    if (blockQuery?.isLoading) hasLoadingBlocks = true
    if (blockQuery?.isFetching) hasFetchingBlocks = true
    // don't allow incomplete data to be returned
    if (!blockQuery?.data) {
      hasIncompleteData = true
      hasAllSuccessData = false
      // eslint-disable-next-line no-continue
      continue
    }
    if (!blockQuery.isSuccess) hasAllSuccessData = false

    const { data: block } = blockQuery
    const dateString = new Date(Number(block.timestamp) * 1000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    data[fuseKey] = dateString
  }

  return {
    data: hasIncompleteData ? undefined : data,
    hasLoadingBlocks,
    hasFetchingBlocks,
    hasAllSuccessData,
  }
}

export const useFusesSetDates = ({ name, enabled = true }: UseFusesSetDatesParameters) => {
  const queryClient = useQueryClient()

  const client = useClient()
  const { address } = useAccount()

  const {
    data: nameHistory,
    isLoading: isNameHistoryLoading,
    isFetching: isNameHistoryFetching,
    isSuccess: isNameHistorySuccess,
  } = useNameHistory({ name, enabled })
  const { blocksNeeded, fuseSetBlocks } = useMemo(
    () => generateFuseSetBlocks(nameHistory),
    [nameHistory],
  )

  const queries = useMemo(
    () => generateGetBlockQueryArray(client, { address, blocksNeeded }),
    [client, address, blocksNeeded],
  )

  const blockDatas = useQueries({ queries }, queryClient)

  const { data, hasLoadingBlocks, hasFetchingBlocks, hasAllSuccessData } = useMemo(
    () => generateMatchedFuseBlockData({ fuseSetBlocks, blockDatas, queries }),
    [fuseSetBlocks, blockDatas, queries],
  )

  return {
    data,
    isLoading: isNameHistoryLoading || hasLoadingBlocks,
    isFetching: isNameHistoryFetching || hasFetchingBlocks,
    isSuccess: isNameHistorySuccess && hasAllSuccessData,
  }
}
