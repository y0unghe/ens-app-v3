import { namehash } from 'viem'
import { useClient, useReadContract } from 'wagmi'

import { getChainContractAddress, registryResolverSnippet } from '@y0unghe/ens.js/contracts'

type UseRegistryResolverParameters = {
  name: string

  enabled?: boolean
}

export const useRegistryResolver = ({ name, enabled = true }: UseRegistryResolverParameters) => {
  const client = useClient()
  return useReadContract({
    abi: registryResolverSnippet,
    address: getChainContractAddress({ client, contract: 'ensRegistry' }),
    functionName: 'resolver',
    args: [namehash(name)],
    query: {
      enabled: enabled && !!name,
    },
  })
}
