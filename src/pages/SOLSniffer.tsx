import type { NextPage } from "next";
import Head from "next/head";
import { ElonView } from "../views";

const Basics: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>SOLSniffer BURN</title>
        <meta
          name="description"
          content="SOLSniffer BURN"
        />
      </Head>
      <ElonView />
    </div>
  );
};

export default Basics;
