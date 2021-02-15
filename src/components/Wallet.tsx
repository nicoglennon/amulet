import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { isEmpty } from "lodash";
// import { useSpring, animated } from "react-spring";
import styled from "styled-components";
import Navbar from "./Navbar";
import CategoriesMenu from "./CategoriesMenu";
import WalletHeader from "./WalletHeader";
import Collections from "./Collections";
import TokenList from "./TokenList";
import { apiGetAccountUniqueTokens } from "../apis/opensea-api";
import { apiGetERC20Tokens } from "../apis/ethplorer-api";
import { Categories } from "../helpers/constants";
declare global {
  interface Window {
    ethereum: any;
  }
}
interface Props {
  auth?: string;
}
interface Params {
  walletParam: string;
}

const WalletWrapper = styled.div`
  padding: 40px 30px;
  max-width: 850px;
  margin: auto;
  text-align: center;
`;

const Wallet: React.FC<Props> = () => {
  const { walletParam } = useParams<Params>();
  const [walletId, setWalletId] = useState<string>("");
  const [ensAddress, setEnsAddress] = useState<string>();
  const [ethBalance, setEthBalance] = useState<string>("");
  const [NFTs, setNFTs] = useState<object>();
  const [tokens, setTokens] = useState<Array<object>>();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    Categories.COLLECTIONS
  );
  const [selectedContract, setSelectedContract] = useState<string>();
  const [loadingNFTs, setLoadingNFTs] = useState<boolean>(true);
  const [loadingTokens, setLoadingTokens] = useState<boolean>(true);
  const [loadingWalletHeader, setLoadingWalletHeader] = useState(true);

  useEffect(() => {
    const getWeb3 = async () => {
      let addressParam;
      const provider = new ethers.providers.InfuraProvider(
        1,
        process.env.REACT_APP_INFURA_ID
      );
      console.log(walletParam);
      if (walletParam.length === 42) {
        setWalletId(walletParam);
        addressParam = walletParam;
        const ensAddy = await provider.lookupAddress(addressParam);
        setEnsAddress(ensAddy);
      } else {
        addressParam = walletParam + ".eth";
        const walletAddress = await provider.resolveName(addressParam);
        setWalletId(walletAddress);
        setEnsAddress(addressParam);
      }
      const bigNumberBalance = await provider.getBalance(addressParam);
      const balance = await ethers.utils.formatEther(bigNumberBalance);
      const balanceNumber = Number(balance).toFixed(5).toString();
      setEthBalance(balanceNumber);
      setLoadingWalletHeader(false);
    };
    getWeb3();
  }, [walletParam]);

  useEffect(() => {
    const getNFTs = async (wId: string) => {
      const nfts = await apiGetAccountUniqueTokens(wId);
      setNFTs(nfts);
      setLoadingNFTs(false);
    };

    const getERC20s = async (wId: string) => {
      const tokens = await apiGetERC20Tokens(wId);
      setTokens(tokens);
      setLoadingTokens(false);
      console.log("ERC20", tokens);
    };
    if (walletId) {
      getNFTs(walletId);
      getERC20s(walletId);
    }
  }, [walletId]);

  const handleContractClick = (contractName: string): void => {
    setSelectedContract(contractName);
  };

  const handleSelectCategory = (newCategory: string): void => {
    setSelectedCategory(newCategory);
    setSelectedContract(undefined);
  };

  return (
    <WalletWrapper>
      <Navbar />
      <div>
        {loadingWalletHeader ? (
          "loading wallet..."
        ) : (
          <WalletHeader
            walletId={walletId}
            ensAddress={ensAddress}
            ethBalance={ethBalance}
          />
        )}
        <CategoriesMenu
          selectedCategory={selectedCategory}
          handleSelectCategory={handleSelectCategory}
        />
        {selectedCategory === Categories.COLLECTIONS && (
          <>
            {loadingNFTs || !NFTs || isEmpty(NFTs) ? (
              "loading collections..."
            ) : (
              <Collections
                NFTs={NFTs}
                selectedContract={selectedContract}
                handleContractClick={handleContractClick}
              />
            )}
          </>
        )}
        {selectedCategory === Categories.TOKENS && (
          <>
            {loadingTokens || !tokens ? (
              "loading tokens..."
            ) : (
              <TokenList tokens={tokens} />
            )}
          </>
        )}
      </div>
    </WalletWrapper>
  );
};

export default Wallet;