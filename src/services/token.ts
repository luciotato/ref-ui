import BN from 'bn.js';
import {
  ONE_YOCTO_NEAR,
  refFiFunctionCall,
  RefFiFunctionCallOptions,
  refFiManyFunctionCalls,
  refFiViewFunction,
  REF_FI_CONTRACT_ID,
  wallet,
} from './near';
import { utils } from 'near-api-js';
import { currentStorageBalance, MIN_DEPOSIT_PER_TOKEN } from './account';

export const checkTokenNeedsStorageDeposit = async (tokenId: string) => {
  const [registeredTokens, { available }] = await Promise.all([
    getUserRegisteredTokens(),
    currentStorageBalance(wallet.getAccountId()),
  ]);

  return (
    MIN_DEPOSIT_PER_TOKEN.gt(new BN(available)) &&
    !registeredTokens.includes(tokenId)
  );
};

export const registerToken = async (tokenId: string) => {
  const actions: RefFiFunctionCallOptions[] = [
    {
      methodName: 'register_tokens',
      args: { token_ids: [tokenId] },
    },
  ];

  const needsStorageDeposit = await checkTokenNeedsStorageDeposit(tokenId);
  if (needsStorageDeposit) {
    actions.unshift({
      methodName: 'storage_deposit',
      args: { account_id: wallet.getAccountId(), registration_only: false },
      amount: '0.00125',
    });
  }

  return refFiManyFunctionCalls(actions);
};

export const unregisterToken = (tokenId: string) => {
  return refFiFunctionCall({
    methodName: 'unregister_tokens',
    args: { token_ids: [tokenId] },
  });
};

interface DepositOptions {
  tokenId: string;
  amount: string;
  msg?: string;
}
export const deposit = async ({
  tokenId,
  amount,
  msg = '',
}: DepositOptions) => {
  return wallet.account().functionCall(
    tokenId,
    'ft_transfer_call',
    {
      receiver_id: REF_FI_CONTRACT_ID,
      amount,
      msg,
    },
    new BN('100000000000000'),
    new BN(utils.format.parseNearAmount(ONE_YOCTO_NEAR))
  );
};

interface WithdrawOptions {
  tokenId: string;
  amount: string;
  unregister?: boolean;
}
export const withdraw = ({
  tokenId,
  amount,
  unregister = false,
}: WithdrawOptions) => {
  return refFiFunctionCall({
    methodName: 'withdraw',
    args: { token_id: tokenId, amount, unregister },
    amount: ONE_YOCTO_NEAR,
  });
};

export interface TokenBalancesView {
  [tokenId: string]: string;
}
export const getTokenBalances = (): Promise<TokenBalancesView> => {
  return refFiViewFunction({
    methodName: 'get_deposits',
    args: { account_id: wallet.getAccountId() },
  });
};

export const getDepositableBalance = (tokenId: string): Promise<string> => {
  return wallet.account().viewFunction(tokenId, 'ft_balance_of', {
    account_id: wallet.getAccountId(),
  });
};

export const getUserRegisteredTokens = (): Promise<string[]> => {
  return refFiViewFunction({
    methodName: 'get_user_whitelisted_tokens',
    args: { account_id: wallet.getAccountId() },
  });
};

export const getWhitelistedTokens = async (): Promise<string[]> => {
  const [globalWhitelist, userWhitelist] = await Promise.all([
    refFiViewFunction({ methodName: 'get_whitelisted_tokens' }),
    refFiViewFunction({
      methodName: 'get_user_whitelisted_tokens',
      args: { account_id: wallet.getAccountId() },
    }),
  ]);

  return [...new Set<string>([...globalWhitelist, ...userWhitelist])];
};

export interface TokenMetadata {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  icon: string;
}

export const getTokenMetadata = async (id: string): Promise<TokenMetadata> => {
  try {
    const metadata = await wallet.account().viewFunction(id, 'ft_metadata', {});
    return {
      id,
      ...metadata,
    };
  } catch {
    return {
      id,
      name: id,
      symbol: id.split('.')[0].slice(0, 8),
      decimals: 6,
      icon:
        'https://fluxprotocol.eth.link/static/media/wrapped-near.8b3a5e4b.svg',
    };
  }
};
