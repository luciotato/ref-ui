import BN from 'bn.js';
import {
  refFiFunctionCall,
  refFiViewFunction,
  REF_FI_CONTRACT_ID,
  wallet,
} from './near';

export const MIN_DEPOSIT_PER_TOKEN = new BN('1250000000000000000000');

interface DepositStorageOptions {
  accountId?: string;
  registrationOnly?: boolean;
  amount?: string;
}

export const depositStorage = ({
  accountId,
  registrationOnly = true,
  amount = '0.1',
}: DepositStorageOptions) => {
  return refFiFunctionCall({
    methodName: 'storage_deposit',
    args: { account_id: accountId, registration_only: registrationOnly },
    amount,
  });
};

export const depositStorageToCoverToken = () => {
  return depositStorage({
    accountId: wallet.getAccountId(),
    registrationOnly: false,
    amount: '0.00125', // 0.0125 1E20 vs 1E19
  });
};

export interface AccountStorageView {
  total: string;
  available: string;
}
export const currentStorageBalance = (accountId: string) => {
  return refFiViewFunction({
    methodName: 'storage_balance_of',
    args: { account_id: accountId },
  });
};

export const initializeAccount = async () => {
  const balances = await currentStorageBalance(wallet.getAccountId());
  if (balances) return balances;

  return depositStorage({
    accountId: wallet.getAccountId(),
  });
};

export const signIn = () => {
  wallet.requestSignIn(REF_FI_CONTRACT_ID, 'ref-finance');
};

export const signOut = () => {
  wallet.signOut();
  // reload page
  history.go(0);
};
