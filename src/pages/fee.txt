import type { NextPage } from "next";
import Head from "next/head";
import { CollectFeeView } from "../views";

const Basics: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>SOLSniffer Collect Fee</title>
        <meta
          name="description"
          content="SOLSniffer Collect Fee"
        />
      </Head>
      <CollectFeeView />
    </div>
  );
};

export default Basics;
