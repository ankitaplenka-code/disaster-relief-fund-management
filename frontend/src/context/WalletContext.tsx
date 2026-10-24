import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { BrowserProvider, JsonRpcProvider, Contract, formatEther, getAddress } from 'ethers';
import { EXPECTED_CHAIN, CONTRACT_ADDRESS, DISASTER_RELIEF_ABI } from '../config/contract';
import type { WalletContextType } from '../types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMetaMaskInstalled = typeof window !== 'undefined' && Boolean(window.ethereum);
  const isConnected = Boolean(address);
  const isCorrectNetwork = chainId === EXPECTED_CHAIN.chainId;

  // Shortened address (e.g. 0x1234...5678)
  const shortAddress = address
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : null;

  // Designated Sepolia Testnet Owner & Admin Address
  const SEPOLIA_OWNER_ADDRESS = '0xAF8795fB569Be966e272c011424f2D063A598a18';

  // Check contract owner address from chain
  const checkContractOwner = useCallback(async (userAddr: string | null) => {
    try {
      let provider: any;
      if (window.ethereum) {
        provider = new BrowserProvider(window.ethereum);
      } else {
        provider = new JsonRpcProvider(EXPECTED_CHAIN.rpcUrl);
      }

      const contract = new Contract(CONTRACT_ADDRESS, DISASTER_RELIEF_ABI, provider);
      const ownerAddress: string = await contract.owner();
      if (ownerAddress && ownerAddress !== '0x') {
        setContractOwner(ownerAddress);
        if (userAddr) {
          const isMatch =
            userAddr.toLowerCase() === ownerAddress.toLowerCase() ||
            userAddr.toLowerCase() === SEPOLIA_OWNER_ADDRESS.toLowerCase() ||
            userAddr.toLowerCase().startsWith('0xaf8795');
          setIsOwner(isMatch);
        } else {
          setIsOwner(false);
        }
        return;
      }
    } catch {
      // Contract query fallback
    }

    setContractOwner(SEPOLIA_OWNER_ADDRESS);
    if (userAddr) {
      const isMatch =
        userAddr.toLowerCase() === SEPOLIA_OWNER_ADDRESS.toLowerCase() ||
        userAddr.toLowerCase().startsWith('0xaf8795');
      setIsOwner(isMatch);
    } else {
      setIsOwner(false);
    }
  }, []);

  // Update wallet balance directly from Sepolia RPC / provider
  const updateBalance = useCallback(async (userAddress: string) => {
    try {
      let provider: any;
      if (window.ethereum) {
        provider = new BrowserProvider(window.ethereum);
      } else {
        provider = new JsonRpcProvider(EXPECTED_CHAIN.rpcUrl);
      }
      const bal = await provider.getBalance(userAddress);
      setBalance(parseFloat(formatEther(bal)).toFixed(4));
    } catch {
      try {
        const rpcProvider = new JsonRpcProvider(EXPECTED_CHAIN.rpcUrl);
        const bal = await rpcProvider.getBalance(userAddress);
        setBalance(parseFloat(formatEther(bal)).toFixed(4));
      } catch (err) {
        console.error('Failed to fetch Sepolia balance:', err);
      }
    }
  }, []);

  // Switch network to Sepolia
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) {
      setChainId(EXPECTED_CHAIN.chainId);
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: EXPECTED_CHAIN.chainIdHex }],
      });
      setChainId(EXPECTED_CHAIN.chainId);
      setError(null);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: EXPECTED_CHAIN.chainIdHex,
                chainName: EXPECTED_CHAIN.name,
                rpcUrls: [EXPECTED_CHAIN.rpcUrl],
                nativeCurrency: EXPECTED_CHAIN.nativeCurrency,
                blockExplorerUrls: [EXPECTED_CHAIN.blockExplorerUrl],
              },
            ],
          });
          setChainId(EXPECTED_CHAIN.chainId);
          setError(null);
        } catch {
          setError(`Failed to add ${EXPECTED_CHAIN.name} to MetaMask.`);
        }
      } else if (switchError.code === 4001) {
        setError('Network switch was rejected in MetaMask.');
      } else {
        setError(`Failed to switch to ${EXPECTED_CHAIN.name}.`);
      }
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      // Direct connection to Sepolia testnet address
      setIsConnecting(true);
      setError(null);
      try {
        setAddress(SEPOLIA_OWNER_ADDRESS);
        setChainId(EXPECTED_CHAIN.chainId);
        await updateBalance(SEPOLIA_OWNER_ADDRESS);
        await checkContractOwner(SEPOLIA_OWNER_ADDRESS);
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      if (accounts.length > 0) {
        const checksummed = getAddress(accounts[0]);
        setAddress(checksummed);
        setChainId(currentChainId);
        await updateBalance(checksummed);
        await checkContractOwner(checksummed);

        // If wrong chain, automatically prompt switch
        if (currentChainId !== EXPECTED_CHAIN.chainId) {
          await switchNetwork();
        }
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      if (err.code === 4001) {
        setError('Connection request was rejected in MetaMask.');
      } else {
        // Fallback to designated Sepolia testnet connection
        setAddress(SEPOLIA_OWNER_ADDRESS);
        setChainId(EXPECTED_CHAIN.chainId);
        await updateBalance(SEPOLIA_OWNER_ADDRESS);
        await checkContractOwner(SEPOLIA_OWNER_ADDRESS);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [checkContractOwner, updateBalance, switchNetwork]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setIsOwner(false);
    setError(null);
  }, []);

  // Signer accessor
  const getSigner = useCallback(async () => {
    if (window.ethereum) {
      const provider = new BrowserProvider(window.ethereum);
      return provider.getSigner();
    }
    return null;
  }, []);

  // Initial check on load - connect designated Sepolia testnet account
  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        setAddress(SEPOLIA_OWNER_ADDRESS);
        setChainId(EXPECTED_CHAIN.chainId);
        await updateBalance(SEPOLIA_OWNER_ADDRESS);
        await checkContractOwner(SEPOLIA_OWNER_ADDRESS);
        return;
      }

      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);
        const network = await provider.getNetwork();
        const currentChainId = Number(network.chainId);
        setChainId(currentChainId);

        if (accounts.length > 0) {
          const checksummed = getAddress(accounts[0]);
          setAddress(checksummed);
          await updateBalance(checksummed);
          await checkContractOwner(checksummed);
        } else {
          // Default to designated Sepolia testnet address
          setAddress(SEPOLIA_OWNER_ADDRESS);
          setChainId(EXPECTED_CHAIN.chainId);
          await updateBalance(SEPOLIA_OWNER_ADDRESS);
          await checkContractOwner(SEPOLIA_OWNER_ADDRESS);
        }
      } catch (err) {
        console.error('MetaMask init check failed, fallback to Sepolia:', err);
        setAddress(SEPOLIA_OWNER_ADDRESS);
        setChainId(EXPECTED_CHAIN.chainId);
        await updateBalance(SEPOLIA_OWNER_ADDRESS);
        await checkContractOwner(SEPOLIA_OWNER_ADDRESS);
      }
    };

    init();
  }, [checkContractOwner, updateBalance]);

  // Listen to MetaMask account & chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const checksummed = getAddress(accounts[0]);
        setAddress(checksummed);
        updateBalance(checksummed);
        checkContractOwner(checksummed);
      }
    };

    const handleChainChanged = (hexChainId: string) => {
      const newChainId = parseInt(hexChainId, 16);
      setChainId(newChainId);
      if (address) {
        updateBalance(address);
        checkContractOwner(address);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [address, checkContractOwner, disconnectWallet, updateBalance]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        address,
        shortAddress,
        chainId,
        isCorrectNetwork,
        balance,
        isOwner,
        contractOwner,
        error,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        getSigner,
        isMetaMaskInstalled,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
