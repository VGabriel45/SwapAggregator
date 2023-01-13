const ethers =require('ethers');
const express = require('express')
const aggregatorABI = require('../utils/aggregatorABI.json');
const routerABI = require('../utils/routerABI.json');
const erc20ABI = require('../utils/erc20ABI.json');
const {Provider} = require('ethers-multicall');
require('dotenv').config()

const app = express()
const port = 3000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/swapTokensForETH', async (req, res) => {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
  const wallet = new ethers.Wallet(process.env.WALLET_PRIV_KEY);
  const signer = wallet.connect(provider);
  const aggregatorAddress = process.env.AGGREGATOR_ADDRESS;
  const aggregator = new ethers.Contract(aggregatorAddress, aggregatorABI, signer);
  let routerIFace = new ethers.utils.Interface(routerABI);

  const payload = req.body.swapCallData;
  const callData = [];

  payload.forEach(async (swapCall) => {
    const encodedMethod = routerIFace.encodeFunctionData(
        "swapExactTokensForETH", 
        [ ethers.utils.parseEther(swapCall.amountIn), 
          0, 
          [swapCall.tokenIn, swapCall.tokenOut], 
          swapCall.to, 
          99999999999999
        ]
      )
    const obj = {
      target: swapCall.target,
      tokenIn: swapCall.tokenIn,
      amountIn: ethers.utils.parseEther(swapCall.amountIn),
      data: encodedMethod
    }
    callData.push(obj);
    const token = new ethers.Contract(swapCall.tokenIn, erc20ABI, signer)

    const allowance = await token.connect(signer).allowance(signer.address, aggregator.address);
    if(allowance == 0) {
      await token.connect(signer).approve(aggregator.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    }
  })

  const tx = await aggregator.connect(signer).execute(callData)
  return res.send(
    tx
  ); 
});

app.post('/swapTokensForTokens', async (req, res) => {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
  const wallet = new ethers.Wallet(process.env.WALLET_PRIV_KEY);
  const signer = wallet.connect(provider);
  const aggregatorAddress = process.env.AGGREGATOR_ADDRESS;
  const aggregator = new ethers.Contract(aggregatorAddress, aggregatorABI, signer);
  
  let routerIFace = new ethers.utils.Interface(routerABI);

  const payload = req.body.swapCallData;
  const callData = [];

  payload.forEach(async (swapCall) => {
    const encodedMethod = routerIFace.encodeFunctionData("swapExactTokensForTokens", [ethers.utils.parseEther(swapCall.amountIn), 0, [swapCall.tokenIn, swapCall.tokenOut], swapCall.to, 99999999999999])
    const obj = {
      target: swapCall.target,
      tokenIn: swapCall.tokenIn,
      amountIn: ethers.utils.parseEther(swapCall.amountIn),
      data: encodedMethod
    }
    callData.push(obj);
    const token = new ethers.Contract(swapCall.tokenIn, erc20ABI, signer)

    const allowance = await token.connect(signer).allowance(signer.address, aggregator.address);
    if(allowance == 0) {
      await token.connect(signer).approve(aggregator.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    }
  })

  const tx = await aggregator.connect(signer).execute(callData)

  return res.send(
    tx
  ); 
});

app.post('/getBestReturn', async (req, res) => {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
  const wallet = new ethers.Wallet(process.env.WALLET_PRIV_KEY);
  const signer = wallet.connect(provider);
  const aggregatorAddress = process.env.AGGREGATOR_ADDRESS;
  const aggregator = new ethers.Contract(aggregatorAddress, aggregatorABI, signer);
  
  let routerIFace = new ethers.utils.Interface(routerABI);

  const payload = req.body.data;
  const callData = [];

  payload.forEach(async (swapCall) => {
    const encodedMethod = routerIFace.encodeFunctionData("getAmountsOut", [swapCall.amountIn, [swapCall.tokenIn, swapCall.tokenOut]])
    const obj = {
      target: swapCall.target,
      data: encodedMethod
    }
    callData.push(obj);
  })
  const result = await aggregator.connect(signer).getBestPriceMulticall(callData);
  
  return res.send(
    {return: ethers.utils.formatUnits(result[0]).toString(), target: result[1]}
  ); 
});

app.post('/swapETHForTokens', async (req, res) => {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
  const wallet = new ethers.Wallet(process.env.WALLET_PRIV_KEY);
  const signer = wallet.connect(provider);
  const aggregatorAddress = process.env.AGGREGATOR_ADDRESS;
  const aggregator = new ethers.Contract(aggregatorAddress, aggregatorABI, signer);
  
  let routerIFace = new ethers.utils.Interface(routerABI);

  const payload = req.body.swapCallData;
  const callData = [];
  let totalEth = 0;

  // const ethcallProvider = new Provider(provider);
  // await ethcallProvider.init()

  payload.forEach(async (swapCall) => {
    const encodedMethod = routerIFace.encodeFunctionData("swapExactETHForTokens", [0, [swapCall.ETH, swapCall.tokenOut], swapCall.to, 99999999999999])
    const obj = {
      target: swapCall.target,
      tokenIn: swapCall.ETH,
      amountIn: swapCall.amountIn,
      data: encodedMethod
    }
    totalEth += parseInt(swapCall.amountIn);
    callData.push(obj);
  })
  console.log(totalEth);
  const tx = await aggregator.connect(signer).executeETH(callData, {value: ethers.utils.parseEther(totalEth.toString()), gasLimit: 80000});

  return res.send(
    tx
  ); 
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})