const ethers = require('ethers');
const express = require('express')
const aggregatorABI = require('../utils/aggregatorABI.json');
const routerABI = require('../utils/routerABI.json');
const erc20ABI = require('../utils/erc20ABI.json');
require('dotenv').config()

const app = express()
const port = 3000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
const wallet = new ethers.Wallet(process.env.WALLET_PRIV_KEY);
const signer = wallet.connect(provider);
const aggregatorAddress = process.env.AGGREGATOR_ADDRESS;
const aggregator = new ethers.Contract(aggregatorAddress, aggregatorABI, signer);
let routerIFace = new ethers.utils.Interface(routerABI);

app.post('/swapTokensForETH', async (req, res) => {
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
      amountIn: ethers.utils.parseEther(swapCall.amountIn).toString(),
      data: encodedMethod
    }
    callData.push(obj);
    
  })

  const cakeToken = new ethers.Contract("0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", erc20ABI, signer)
  await cakeToken.connect(signer).approve(aggregator.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")

  await aggregator.connect(signer).execute(callData)

  return res.send(
    "Swap multicall succedeed"
  ); 
});

app.post('/swapTokensForTokens', async (req, res) => {
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
  })

  // approve token in order to swap them
  const cakeToken = new ethers.Contract("0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", erc20ABI, signer);
  const alpacaToken = new ethers.Contract("0x8f0528ce5ef7b51152a59745befdd91d97091d2f", erc20ABI, signer);
  await cakeToken.connect(signer).approve(aggregator.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  await alpacaToken.connect(signer).approve(aggregator.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

  const tx = await aggregator.connect(signer).execute(callData)

  return res.send(
    tx
  ); 
});

app.post('/swapETHForTokens', async (req, res) => {
  const singerAddr = await signer.getAddress();
  
  const payload = req.body.swapCallData;
  const callData = [];
  let totalEther = 0;

  payload.forEach(async (swapCall) => {
    const encodedMethod = routerIFace.encodeFunctionData("swapExactETHForTokens", [0, [swapCall.tokenIn, swapCall.tokenOut], singerAddr, 999999999999999])
    const obj = {
      target: swapCall.target,
      etherAmount: ethers.utils.parseEther(swapCall.etherAmount),
      data: encodedMethod
    }
    callData.push(obj);
    totalEther += parseInt(swapCall.etherAmount);
  })

  const tx = await aggregator.connect(signer).executeETH(callData, {value: ethers.utils.parseEther(totalEther.toString())})
  
  return res.send(
    tx
  ); 
});

app.post('/getBestReturn', async (req, res) => {
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

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})