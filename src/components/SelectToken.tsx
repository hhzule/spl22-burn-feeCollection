// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import { useRouter } from 'next/router';

export const SelectToken: FC = () => {
    const router = useRouter();
    const { publicKey } = useWallet();
    const onClick = useCallback(async () => {
        try {
            // `publicKey` will be null if the wallet isn't connected
            if (!publicKey) throw new Error('Wallet not connected!');
            // `signMessage` will be undefined if the wallet doesn't support it
        //    notify({ type: 'success', message: 'Sign message successful!', txid: bs58.encode(signature) });
        } catch (error: any) {
            notify({ type: 'error', message: ` failed!`, description: error?.message });
            console.log('error', ` failed! ${error?.message}`);
        }
    }, [publicKey, notify]);
    const onClickBurn = useCallback(async () => {
       if (!publicKey) throw new Error('Wallet not connected!');
       router.push("/SOLSniffer"); 
    }, [publicKey]);
    const onClickCollectFee = useCallback(async () => {
     
     if (!publicKey) throw new Error('Wallet not connected!');
     router.push("/fee");    
    }, [publicKey]);
    return (
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
             {publicKey && publicKey ? <>
                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={onClickBurn} disabled={!publicKey}
                >
                  <span className="block group-disabled:hidden" > 
                        Burn SOLSniffer
                    </span>
                </button>
                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={onClickCollectFee} disabled={!publicKey}
                >
                  <span className="block group-disabled:hidden" > 
                        Collect Fee
                    </span>
                </button>
             </> : <>      <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={onClick} disabled={!publicKey}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                   
                </button></>}
          
            </div>
        </div>
    );
};
