import create, { State } from 'zustand'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import * as SPLToken from "@solana/spl-token";
const TOKEN_2022_PROGRAM_ID = new PublicKey(
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
  );
interface UserSOLBalanceStore extends State {
  TkBalance: number;
  getUserStakeBalance: (publicKey: PublicKey, connection: Connection) => void
}

const useTokenBalance = create<UserSOLBalanceStore>((set, _get) => ({
    TkBalance: 0,
  getUserStakeBalance: async (publicKey, connection) => {
    let TkBalance;
    let finalBal;
    const TOKEN_MINT = new PublicKey("G6o1ncUg59EDBMkyhGHAXHM1CicdpqhM1GAZSpSkHwau")

    try {
        TkBalance = await connection.getTokenAccountsByOwner(publicKey,  {
        mint: TOKEN_MINT,
        programId:TOKEN_2022_PROGRAM_ID
      });
    //   console.log(`TkBalance`,TkBalance);  
    //   balance = balance / LAMPORTS_PER_SOL;
    TkBalance.value.forEach((e) => {
        // console.log(`pubkey: ${e.pubkey.toBase58()}`);
        const accountInfo = SPLToken.AccountLayout.decode(e.account.data);
       const mintTk = new PublicKey(accountInfo.mint)
        // console.log(`mint: ${new PublicKey(accountInfo.mint)}`);
        console.log(`amount`,accountInfo.amount);  
        // if(mintTk.toString() === TOKEN_MINT.toString()){
            finalBal = accountInfo.amount / BigInt(1000000)
        // }
       
    });
    //   console.log(`finalBal: `, finalBal);
    TkBalance = finalBal
    } catch (e) {
      console.log(`error getting balance: `, e);
    }
    set((s) => {
      s.TkBalance = TkBalance;
    //   console.log(`balance updated, `, balance);
    })
  },
}));

export default useTokenBalance;