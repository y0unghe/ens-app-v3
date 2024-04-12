import { useTranslation } from 'react-i18next'
import { useAccount } from 'wagmi'

import { GetOwnerReturnType, GetWrapperDataReturnType } from '@y0unghe/ens.js/public'
import { CalendarSVG, FastForwardSVG } from '@ensdomains/thorin'

import { useTransactionFlow } from '@app/transaction-flow/TransactionFlowProvider'
import { nameLevel } from '@app/utils/name'

import type { useExpiryDetails } from './useExpiryDetails'

export const useExpiryActions = ({
  name,
  expiryDetails,
  ownerData,
  wrapperData,
}: {
  name: string
  expiryDetails: ReturnType<typeof useExpiryDetails>['data']
  ownerData?: GetOwnerReturnType
  wrapperData?: GetWrapperDataReturnType
}) => {
  const { t } = useTranslation('common')
  const { address } = useAccount()
  const { usePreparedDataInput } = useTransactionFlow()
  const showExtendNamesInput = usePreparedDataInput('ExtendNames')

  // TODO: remove this when we add support for extending wrapped subnames
  const is2ld = nameLevel(name) === '2ld'

  const isSelf = ownerData?.registrant === address || wrapperData?.owner === address

  const expiryDate = expiryDetails?.find(({ type }) => type === 'expiry')?.date
  if (!expiryDate || !is2ld) return null
  return [
    {
      label: t('action.setReminder'),
      type: 'set-reminder',
      icon: <CalendarSVG />,
      primary: false,
      expiryDate,
    },
    {
      label: t('action.extend'),
      type: 'extend',
      icon: <FastForwardSVG />,
      primary: true,
      onClick: () => {
        showExtendNamesInput(`extend-names-${name}`, {
          names: [name],
          isSelf,
        })
      },
    },
  ] as const
}
