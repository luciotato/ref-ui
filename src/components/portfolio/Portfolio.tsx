import React from 'react';
import { useTokenBalances, useUserRegisteredTokens } from '~state/token';
import { toReadableNumber } from '~utils/numbers';
import TokenList from '~components/tokens/TokenList';
import TabFormWrap from '~/components/forms/TabFormWrap';
import NewUserPortfolio from './NewUserPortfolio';
import Deposit from './Deposit';
import Withdraw from './Withdraw';
import Register from './Register';

function Portfolio() {
  const balances = useTokenBalances();
  const registeredTokens = useUserRegisteredTokens();

  if (registeredTokens.length === 0) {
    return <NewUserPortfolio />;
  }

  return (
    <>
      <h1 className="font-semibold font-inter pt-8">Portfolio</h1>
      <TokenList
        tokens={registeredTokens}
        render={(token) => (
          <p>{toReadableNumber(token.decimals, balances[token.id])}</p>
        )}
      />
      <TabFormWrap titles={['Deposits', 'Withdraws', 'Register']}>
        <Deposit tokens={registeredTokens} />
        <Withdraw tokens={registeredTokens} />
        <Register />
      </TabFormWrap>
    </>
  );
}

export default Portfolio;
