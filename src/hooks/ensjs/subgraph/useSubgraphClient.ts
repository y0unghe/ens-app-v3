import { useMemo } from 'react'
import { useClient } from 'wagmi'

import { createSubgraphClient } from '@y0unghe/ens.js/subgraph'
import {  sepolia } from 'wagmi/chains' 

export const useSubgraphClient = () => {
  const client = useClient({chainId: sepolia.id})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  console.log(`useSubgraphClient`, client)
  return useMemo(() => createSubgraphClient({ client }), [client.chain.id])
}
