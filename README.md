# Instructions

Only use BSC forked mainnet.

1. run npm or pnpm install
2. open a new terminal and run "npx hardhat node --fork https://rpc.ankr.com/bscc"
3. open a new terminal and from the root folder of the project run nodemon api/app.js
4. deploy the Aggregator contract by running "npx hardhat run scripts/deploy.ts --network localhost" and replace the address in your .env file
5. replace the wallet private key in your .env file
6. you can start making requests to the Node.js API 

For testing run "npx hardhat test test/aggregatorTests.ts --network localhost"

Payload structure for api:

/swapETHForTokens -->  
       { 
            "target": router address,
            "tokenIn": native token (WBNB for bsc in our case),
            "etherAmount": amount of bnb,
            "tokenOut": token to swap for,
            "to": recipient of tokenOut
        }

/swapTokensForTokens -->  
       { 
            "target" : router address,
            "tokenIn": token to give for swap,
            "tokenOut": token to get after swap,
            "to": recipient of tokenOut,
            "amountIn": amount of tokenIn to send for swap
        }

/swapTokensForETH -->  
       { 
            "target" : router address,
            "tokenIn": token to give for swap,
            "tokenOut": token to get after swap,
            "to": recipient of tokenOut,
            "amountIn": amount of tokenIn to send for swap
        }

/getBestReturn -->
        {
            "target" : router address,
            "tokenIn": get the price for this token,
            "tokenOut": the price of tokenIn in tokenOut tokens,
            "amountIn": amount of tokenIn to get the price for
        }

# Short description of the project

This project aggregates multiple swap transactions into one single transaction from multiple decentralized exchanges, the user provides call data, where he can give instructions like from what decentralized exchanges to swap from, what tokens to swap, how many tokens and who will receive the output tokens after the swap. The Aggregator smart contract does the work by using "multicall", aggregating multiple transactions into one single transaction. The smart contract also can return the best price of an asset in another asset based on what dex'es we want to use.
The projects has an open API that can be used to execute aggregated swaps made in node.js with express.