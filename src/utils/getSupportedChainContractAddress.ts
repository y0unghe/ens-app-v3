import { getChainContractAddress } from 'viem'

import { ClientWithEns } from '@app/types'

export const getSupportedChainContractAddress = <
  TContract extends Extract<keyof ClientWithEns['chain']['contracts'], string>,
  TContractObject extends ClientWithEns['chain']['contracts'][TContract],
>({
  client,
  contract,
  blockNumber,
}: {
  client: ClientWithEns
  contract: TContract
  blockNumber?: bigint
}) => {
  console.log(`getSupportedChainContractAddress`, client.chain, contract)
  return getChainContractAddress({
    chain: client.chain,
    contract,
    blockNumber,
  }) as TContractObject['address']
}
