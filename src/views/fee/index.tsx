// Next, React
import { FC, useEffect, useState } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
// Wallet
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMint,
  getTransferFeeConfig,
  getTransferFeeAmount,
  unpackAccount,
  withdrawWithheldTokensFromMint,
  createWithdrawWithheldTokensFromMintInstruction,
  createHarvestWithheldTokensToMintInstruction,
} from "@solana/spl-token";
import {
  useWallet,
  useConnection,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { notify } from "../../utils/notifications";
import { useRouter } from "next/router";
// Store
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";
import {
  NetworkConfigurationProvider,
  useNetworkConfiguration,
} from "../../contexts/NetworkConfigurationProvider";
// const MINT_ADDRESS = "D1fr23YLDXg1LZHAyMH8rak7NBqyCV5tR3wpzeQ3zdnU";
const MINT_ADDRESS = "9vPDzcta5HhPfzXsJCY6MZmDFo6vZ6NDRXLXt6ibzpE9";
const MINT_DECIMALS = 6; // Value for USDC-Dev from spl-token-faucet.com | replace with the no. decimals of mint you would like to burn

export const CollectFeeView: FC = ({}) => {
  const router = useRouter();
  const { networkConfiguration } = useNetworkConfiguration();
  const network = networkConfiguration as WalletAdapterNetwork;
  // const endpoint = () => clusterApiUrl(network)
  const wallet = useWallet();
  const { sendTransaction } = useWallet();
  const walletW = useAnchorWallet();
  const [burnTrx, setBurnTrx] = useState("");
  const [supply, setSupply] = useState("");
  const [amount, setAmount] = useState("");
  const [connection, setConnection] = useState(null);
  const { connection: wconn } = useConnection();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("useEffect", network);
    if (network == "mainnet-beta") {
      if (wallet.publicKey) {
        // console.log(wallet.publicKey.toBase58())
        const connection = new Connection(
          "https://mainnet.helius-rpc.com/?api-key=78c69964-e500-4354-8f43-eec127b47bd7"
        );
        setConnection(connection);
      }
    } else {
      if (wallet.publicKey) {
        // console.log(wallet.publicKey.toBase58())
        // console.log("network devnet", network)
        // const connection = wconn
        const connection = new Connection(clusterApiUrl("devnet"));

        setConnection(connection);
      }
    }
  }, [wallet.publicKey, network]);
  useEffect(() => {
    // console.log("totalSupply")
    if (connection) {
      // console.log("totalSupply")
      getTotalSupply();
      getUserSOLBalance(wallet.publicKey, connection);
    }
  }, [connection]);

  const getTotalSupply = async () => {
    try {
      let totalSupply: any = await getMint(
        connection,
        new PublicKey(MINT_ADDRESS),
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      totalSupply = Number(totalSupply.supply.toString()) / 10 ** MINT_DECIMALS;
      setSupply(totalSupply);
    } catch (error) {
      console.log("error", `MINT ADDRESS not found! ${error}`);
    } // return totalSupply
  };

  // connection
  const balance = useUserSOLBalanceStore((s) => s.balance);
  // console.log("first balance", balance);
  const { publicKey } = useWallet();
  // console.log(`wallet`, wallet.publicKey.toString());

  const burnTk = async () => {
    setLoading(true);
    const mintDetail = await getMint(
      connection,
      new PublicKey(MINT_ADDRESS),
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    let feeConfig = await getTransferFeeConfig(mintDetail);
    console.log("feeConfig", feeConfig);
    let withdrawAuthority = feeConfig.withdrawWithheldAuthority.toString();
    let conWal = wallet.publicKey.toString().toLowerCase();
    console.log("withdrawAuthority", withdrawAuthority);

    setBurnTrx("");
    if (!connection) {
      notify({ type: "error", message: `Wallet not connected!` });
      console.log("error", `not connected!`);
      setLoading(false);
      return;
    }
    if (!publicKey) {
      notify({ type: "error", message: `Wallet not connected!` });
      console.log("error", `Send Transaction: Wallet not connected!`);
      setLoading(false);
      return;
    }
    if (withdrawAuthority.toLocaleLowerCase() !== conWal) {
      notify({
        type: "error",
        message: `Connected wallet is not withdraw authority`,
      });
      console.log("error", `unauthorised to collect fee`);
      setLoading(false);
      return;
    }
    if (!amount) {
      notify({
        type: "error",
        message: `enter address`,
      });
      console.log("error", `address to collect fee missing`);
      setLoading(false);
      return;
    }
    // let mintAuthority = (await getMintAuth()).toLowerCase()

    // console.log("connected wallet",conWal)
    // if (mintAuthority !== conWal) {
    //   notify({ type: 'error', message: `Connected wallet is not mint authority` });
    //   console.log('error', `unauthorised to burn`);
    //   setLoading(false);
    //   return;
    // }

    let signature = "";
    try {
      const allAccounts = await connection.getProgramAccounts(
        TOKEN_2022_PROGRAM_ID,
        {
          commitment: "confirmed",
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: MINT_ADDRESS.toString(), // Mint Account address
              },
            },
          ],
        }
      );
      // List of Token Accounts to withdraw fees from
      // console.log("get accounts...", allAccounts);
      const accountsToWithdrawFrom = [];
      let transferFeeAmount;
      for (const accountInfo of allAccounts) {
        const account = unpackAccount(
          accountInfo.pubkey, // Token Account address
          accountInfo.account, // Token Account data
          TOKEN_2022_PROGRAM_ID // Token Extension Program ID
        );

        // Extract transfer fee data from each account
        transferFeeAmount = getTransferFeeAmount(account);
        // console.log("gFeeAmount...", transferFeeAmount);
        // Check if fees are available to be withdrawn
        if (
          transferFeeAmount !== null &&
          transferFeeAmount.withheldAmount > 0
        ) {
          accountsToWithdrawFrom.push(accountInfo.pubkey); // Add account to withdrawal list
        }
      }
      // console.log("get transferFeeAmount...", transferFeeAmount);
      // console.log("get transferFeeAmount...", transferFeeAmount.withheldAmount);
      // console.log("accountsToWithdrawFrom", accountsToWithdrawFrom);
      if (accountsToWithdrawFrom.length < 1) {
        notify({
          type: "success",
          message: "No Fee to collect",
          txid: signature,
        });
        console.log("error", `unauthorised to burn`);
        setLoading(false);
        return;
      }

      if (accountsToWithdrawFrom.length > 0) {
        console.log("amount", amount);
        // let destinationTokenAccount =  new PublicKey("9mtVFuHS3mv9XuY4QMCDvZLpmNHe6TZaXMULXMVtVTvM")
        let destinationTokenAccount = new PublicKey(
          // "9mtVFuHS3mv9XuY4QMCDvZLpmNHe6TZaXMULXMVtVTvM"

          amount
        );
        let ATA = await getAssociatedTokenAddress(
          new PublicKey(MINT_ADDRESS),
          destinationTokenAccount,
          true,
          TOKEN_2022_PROGRAM_ID
        );

        //   const trxDetail = await connection.getParsedTransaction("5y2k36ncmWDkbX9zc1Kh5riijZSDTN8wr2scTvMdBigkhxrDST2LSqBGmaSaTfXfWC3RBCsdFmpY2fsRVopYZUiW","")
        console.log("trxDetail", ATA.toString());
        //    Withdraw withheld tokens from Mint Account

        const transaction2Signature = new Transaction().add(
          createHarvestWithheldTokensToMintInstruction(
            new PublicKey(MINT_ADDRESS), // Public Key of the Token Mint Address
            accountsToWithdrawFrom,
            TOKEN_2022_PROGRAM_ID
          ),
          createWithdrawWithheldTokensFromMintInstruction(
            new PublicKey(MINT_ADDRESS), // Public Key of the Token Mint Address
            ATA,
            walletW.publicKey,
            [],
            TOKEN_2022_PROGRAM_ID
          )
        );
        const signature = await sendTransaction(
          transaction2Signature,
          connection
        );

        console.log(
          "\nWithdraw Fee From Token Accounts:",
          `https://solana.fm/tx/${signature}?cluster=mainnet-beta-solana`
        );
        notify({
          type: "success",
          message: "Transaction successful!",
          txid: signature,
        });
      }

      setLoading(false);
    } catch (error: any) {
      notify({
        type: "error",
        message: `Transaction failed!`,
        description: error?.message,
        txid: signature,
      });
      console.log("error", `Transaction failed! ${error}`);
      console.log("error", `Transaction failed! ${error?.message}`, signature);
      setLoading(false);
      return;
    }
    setAmount("");
  };

  const { getUserSOLBalance } = useUserSOLBalanceStore();
  const onClick = () => {
    router.push("/");
  };

  return (
    <div className=" mx-auto p-4">
      <div className="flex flex-row justify-center">
        <button
          className="group w-40 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={onClick}
        >
          <div className=" group-disabled:block">Home</div>
        </button>
      </div>
      <div className="md:hero-content h-[500px] justify-around flex flex-col">
        <div className="flex flex-col justify-between h-[120px] relative group items-center">
          {/* <RequestAirdrop /> */}
          <h4 className="md:w-full text-2xl text-slate-300 my-2">
            <div className="flex flex-row justify-center">
              <div className="text-slate-600 mr-2">SOLSniffer Phone </div>
              <div> Total Supply : {(supply || 0).toLocaleString()}</div>
            </div>
            {wallet && (
              <div className="flex flex-row justify-center">
                <div>
                  {" "}
                  Wallet Balance : {""}
                  {(balance || 0).toLocaleString()}
                </div>
                <div className="text-slate-600 ml-2">SOL</div>
              </div>
            )}
          </h4>

          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ color: "black", marginBottom: "10px" }}
          ></input>
          <button
            disabled={loading}
            className=" w-[90px] h-[40px] shadow-sm shadow-gray-400 rounded-[10px] bg-red-600"
            onClick={() => burnTk()}
          >
            {loading ? "Collecting ..." : "Collect"}
          </button>
        </div>
        <div className="text-center ">
          <p className="text-center ">
            {burnTrx && (
              <div className=" flex flex-col h-[150px] justify-around items-center">
                <p className=" mb-[20px]">View on explorer</p>
                <a href={burnTrx}>
                  <button className=" w-[90px] h-[40px] shadow-sm shadow-gray-400 rounded-[10px] bg-teal-500">
                    click
                  </button>
                </a>
                <span>{`${burnTrx}`}</span>
              </div>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
