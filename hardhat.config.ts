import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337
    },
      hardhat: {
        forking: {
          url: "https://rpc.ankr.com/bsc",
        }
    }
  }
};

/**
 * 
 * {
 * contractAddress: router address
 * method: "swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline)" --> encode this method --> send encoded to smart contract
 * }
 */

export default config;
