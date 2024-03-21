import create, { State } from 'zustand'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import * as SPLToken from "@solana/spl-token";
interface UserSOLBalanceStore extends State {
  balance: number;
  getUserStakeBalance: (publicKey: PublicKey, connection: Connection) => void
}

const useTokenBalance = create<UserSOLBalanceStore>((set, _get) => ({
  balance: 0,
  getUserStakeBalance: async (publicKey, connection) => {
    let balance;
    let finalBal;
    const TOKEN_MINT = new PublicKey("2hbJ4H9BqGhEL4jWMiaqcsSUBzwm8ETjUsqghTd73KMy")

    try {
      balance = await connection.getTokenAccountsByOwner(publicKey,  {
        mint: TOKEN_MINT,
      });
     
    //   balance = balance / LAMPORTS_PER_SOL;
    balance.value.forEach((e) => {
        // console.log(`pubkey: ${e.pubkey.toBase58()}`);
        const accountInfo = SPLToken.AccountLayout.decode(e.account.data);
       const mintTk = new PublicKey(accountInfo.mint)
        // console.log(`mint: ${new PublicKey(accountInfo.mint)}`);
        // console.log(`amount`,accountInfo.amount);  
        // if(mintTk.toString() === TOKEN_MINT.toString()){
            finalBal = accountInfo.amount / BigInt(1000000)
        // }
       
    });
    //   console.log(`finalBal: `, finalBal);
      balance = finalBal
    } catch (e) {
      console.log(`error getting balance: `, e);
    }
    set((s) => {
      s.balance = balance;
    //   console.log(`balance updated, `, balance);
    })
  },
}));

export default useTokenBalance;