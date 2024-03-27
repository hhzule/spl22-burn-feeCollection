// Next, React
import { FC, useEffect, useState } from 'react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

// Wallet
import { createBurnInstruction,AccountLayout,TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress ,getMint} from "@solana/spl-token";
import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { notify } from "../../utils/notifications";
import { useRouter } from 'next/router';

// Store
import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';
import useTokenBalance from '../../stores/useTokenBalance';
import {  useNetworkConfiguration } from '../../contexts/NetworkConfigurationProvider';
//constants
const MINT_ADDRESS = "9vPDzcta5HhPfzXsJCY6MZmDFo6vZ6NDRXLXt6ibzpE9"
const MINT_DECIMALS = 6; // Value for USDC-Dev from spl-token-faucet.com | replace with the no. decimals of mint you would like to burn


export const ElonView: FC = ({ }) => {
  const { balance ,getUserSOLBalance } = useUserSOLBalanceStore()
  const { TkBalance,getUserStakeBalance } = useTokenBalance()
    const router = useRouter();
    const { publicKey, sendTransaction } = useWallet();
  const { networkConfiguration } = useNetworkConfiguration();
  const network = networkConfiguration as WalletAdapterNetwork;
  // const endpoint = () => clusterApiUrl(network)
  const wallet = useWallet();
  const walletW = useAnchorWallet();
  const [burnTrx, setBurnTrx] = useState("")
  const [supply, setSupply] = useState("")
  const [amount, setAmount] = useState("")
  const [TKbalance, setTKbalance] = useState(0)
  const [connection, setConnection] = useState(null)
  const [loading, setLoading] = useState(false)
  let TKbalan = useTokenBalance((s) => s.TkBalance)
// console.log('TKbalance',TKbalance);
// const balance = useUserSOLBalanceStore((s) => s.balance)

  useEffect(() => {
    console.log("useEffect", network)
if(network == "mainnet-beta"){
  if (wallet.publicKey ) {
    console.log(wallet.publicKey.toBase58())
    const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=78c69964-e500-4354-8f43-eec127b47bd7"); 
    setConnection(connection)

  }
}else{
  if (wallet.publicKey ) {
    // const connection = wconn
    const connection = new Connection(clusterApiUrl("devnet"));
    setConnection(connection)

  } 
}

  }, [wallet.publicKey,network])
  useEffect(() => {
    if(connection){
      console.log("balance", balance)
        console.log("TkBalance", TkBalance)
      getTotalSupply()
      getUserSOLBalance(wallet.publicKey, connection)
      getUserStakeBalance(wallet.publicKey, connection)
      setTKbalance(TKbalan)
    }

  }, [connection, TKbalan])
  

  const  getTotalSupply = async() =>{
    try {
      let totalSupply: any = await getMint(connection,new PublicKey(MINT_ADDRESS),"confirmed", TOKEN_2022_PROGRAM_ID);
      // console.log("totalSupply",totalSupply.supply.toString())
      totalSupply = Number(totalSupply.supply.toString())/  (10**MINT_DECIMALS)
      setSupply(totalSupply) 
    } catch (error) {
      console.log('error', `MINT ADDRESS not found! ${error}`);
   
    }  // return totalSupply
  }


  
 const burnTk = async () =>{
setLoading(true);
  setBurnTrx("")
  if(!connection){
    notify({ type: 'error', message: `Wallet not connected!` });
    console.log('error', `not connected!`);
    setLoading(false);
    return;
  }
  if (!publicKey) {
    notify({ type: 'error', message: `Wallet not connected!` });
    console.log('error', `Send Transaction: Wallet not connected!`);
    setLoading(false);
    return;
}
if (Number(amount)< 1) {
  notify({ type: 'error', message: `Enter amount` });
  console.log('error', `Enter amount`);
  setLoading(false);
  return;
}
 console.log(`TkBalance`, TkBalance);
 if (TkBalance == undefined) {
  notify({ type: 'error', message: `Token account doesn't exist ` });
  console.log('error', `User Token account doesn't exist `);
  setLoading(false);
  setAmount("")
  return;
}
if (TkBalance < Number(amount)) {
  notify({ type: 'error', message: `Not enough Token to burn` });
  console.log('error', `Enter amount`);
  setLoading(false);
  setAmount("")
  return;
}
let signature = '';
try {
 // Step 1 - Fetch Associated Token Account Address
//  console.log(`Step 1 - Fetch Token Account`);
 const account = await getAssociatedTokenAddress(
  new PublicKey(MINT_ADDRESS),
   wallet.publicKey,
   true,
   TOKEN_2022_PROGRAM_ID
   );
//  console.log(`    ✅ - Associated Token Account Address: ${account.toString()}`);
    const createBurnTransaction = new Transaction().add(
      createBurnInstruction(
      account, // PublicKey of Owner's Associated Token Account
       new PublicKey(MINT_ADDRESS), // Public Key of the Token Mint Address
       wallet.publicKey, // Public Key of Owner's Wallet
       Number(amount) * (10**MINT_DECIMALS), // Number of tokens to burn
      //  MINT_DECIMALS, // Number of Decimals of the Token Mint
    [],
    TOKEN_2022_PROGRAM_ID
      )
    )
    const signature = await sendTransaction(createBurnTransaction, connection);

  console.log(`signature`, signature);
     setBurnTrx(`https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`)
    //  console.log(signature);

    setTKbalance(Number(TkBalance) -  Number(amount))

    notify({ type: 'success', message: 'Transaction successful!', txid: signature });
    setLoading(false);
    setAmount("")
  } catch (error: any) {
    notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
    console.log('error', `Transaction failed! ${error?.message}`, signature);
    setLoading(false);
    setAmount("")
    return;
}
 }
  
const onClick = () => {
    router.push("/")
}

  return (

    <div className=" mx-auto p-3">
           <div className="flex flex-row justify-center">
               <button
                    className="group w-40 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={onClick} 
                >
                    <div className=" group-disabled:block">
                      Home
                    </div>
                 
                </button>
           
        </div>
      <div className="md:hero-content h-[300px] justify-around flex flex-col">
        <div className='mt-3'>
        </div>
    
        <div className="flex flex-col justify-between h-[120px] relative group items-center">

          {/* <RequestAirdrop /> */}
          <h4 className="md:w-full text-2xl text-slate-300 my-2">
         
          <div className="flex flex-row justify-center">
          <div className='text-slate-600 mr-2'>
                SOLSniffer {" "}
              </div>
            <div> Total Supply : {" "}
              {(supply || 0).toLocaleString()}
              </div>
            
          </div>
          {wallet &&
          <div className="flex flex-row justify-center">
            <div> Wallet Balance : {""}
              {(balance || 0).toLocaleString()}
              </div>
              <div className='text-slate-600 ml-2'>
                SOL
              </div>
          </div>
          }
           {wallet &&
          <div className="flex flex-row justify-center">
            <div> Wallet SOLSNiffer Balance : {""}
              {( Number(TKbalance)  || 0).toLocaleString()}
              </div>
              <div className='text-slate-600 ml-2'>
                SOLSniffer
              </div>
          </div>
          }
          </h4>
    {/* burn token */}
    <input
    type='number'
    min={0}
    max={supply}
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
    style={{color: 'black', marginBottom: '10px'}}
    
    >
    </input>
    <button 
    disabled={loading}
    className=' w-[90px] h-[40px] shadow-sm shadow-gray-400 rounded-[10px] bg-red-600' 
    onClick={()=>burnTk()}>
{loading ? "Burning ..." : "Burn"}
    </button>
      </div >

      <div className="text-center pt-[50px]">
    
    <p className="text-center "> 
      {burnTrx && 
      <div className=' flex flex-col h-[150px] justify-around items-center'> 
      <p className=' mb-[20px]'>View on explorer</p>
      <a href={burnTrx} target='_blanck'><button className=' w-[90px] h-[40px] shadow-sm shadow-gray-400 rounded-[10px] bg-teal-500'>click</button>
      </a>
        <span>{`${burnTrx}`}</span>
      
        </div>}
       
      </p> 
      </div>
    
   </div>
    </div>
  );
};
