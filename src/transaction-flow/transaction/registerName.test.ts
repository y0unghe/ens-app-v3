import { mockFunction } from '@app/test-utils'

import { expect, it, vi } from 'vitest'

import { getPrice } from '@y0unghe/ens.js/public'
import { registerName } from '@y0unghe/ens.js/wallet'

import registerNameFlowTransaction from './registerName'

vi.mock('@y0unghe/ens.js/public')
vi.mock('@y0unghe/ens.js/wallet')

const mockGetPrice = mockFunction(getPrice)
const mockRegisterName = mockFunction(registerName.makeFunctionData)

mockGetPrice.mockImplementation(async () => ({ base: 100n, premium: 0n }))
mockRegisterName.mockImplementation((...args: any[]) => args as any)

it('adds a 2% value buffer to the transaction from the real price', async () => {
  const result = (await registerNameFlowTransaction.transaction({
    client: {} as any,
    connectorClient: { walletClient: true } as any,
    data: { name: 'test.eth' } as any,
  })) as unknown as [{ walletClient: true }, { name: string; value: bigint }]
  const data = result[1]
  expect(data.value).toEqual(102n)
})
