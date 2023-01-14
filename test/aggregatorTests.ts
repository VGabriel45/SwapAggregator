const { ethers } = require("hardhat");
const { expect } = require("chai");
const erc20ABI = require('../utils/erc20ABI.json');
const routerABI = require('../utils/routerABI.json');
const aggregatorABI = require('../utils/aggregatorABI.json');

import {Contract, Signer, BigNumber} from "ethers";

const mineNBlocks = async (n: number) => {
    for (let index = 0; index < n; index++) {
        await ethers.provider.send('evm_mine');
    }
}

describe("Aggregator testing", function () {

    //variables
    let pancakeRouterAddr = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    let apeswapRouterAddr = "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7";
    let babyswapRouterAddr = "0x325E343f1dE602396E256B67eFd1F61C3A6B38Bd"
    let cakeTokenAddr = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";
    let bananaTokenAddr = "0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95";
    let busdAddr = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
    let wbnbTokenAddr = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    let aggregator: Contract;
    let owner: Signer;
    let alice: Signer;
    let bob: Signer;
    let routerIFace = new ethers.utils.Interface(routerABI);

    beforeEach("deploy contract before each test", async () => {
        const accounts = await ethers.getSigners();
        owner = accounts[0];
        alice = accounts[0];
        bob = accounts[0];

        const AggregatorContract = await ethers.getContractFactory("Aggregator", owner);
        aggregator = await AggregatorContract.deploy();
        await aggregator.deployed();
        console.log(`Aggregator contract deployed with address: ${aggregator.address}`);

         // get CAKE tokens
         const callerAddr = await owner.getAddress();
         const pancakeRouter = new ethers.Contract(pancakeRouterAddr, routerABI, owner);
         await pancakeRouter.connect(owner).swapExactETHForTokens(
             0,
             [wbnbTokenAddr, cakeTokenAddr],
             callerAddr,
             999999999999,
             {value: ethers.utils.parseEther("1")}
         );
    })

    it('should execute 2 aggregated swaps, tokens for ETH and update caller balances', async () => {
        const callerAddr = await owner.getAddress();

        // construct call data,
        const callData = [{
            target: pancakeRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("1"),
            data: routerIFace.encodeFunctionData("swapExactTokensForETH", [ethers.utils.parseEther("1"), 0, [cakeTokenAddr, wbnbTokenAddr],callerAddr, 99999999999999])
          },
          {
            target: apeswapRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("1"),
            data: routerIFace.encodeFunctionData("swapExactTokensForETH", [ethers.utils.parseEther("1"), 0, [cakeTokenAddr, wbnbTokenAddr], callerAddr, 99999999999999])
          }]
          
        // approve tokens to be spent
        const token = new ethers.Contract(cakeTokenAddr, erc20ABI, owner);
        await token.connect(owner).approve(aggregator.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
          
        // check balance before of token spent
        const balanceBefore = await token.connect(owner).balanceOf(callerAddr);
        console.log(balanceBefore);
          
        // execute multicall tx
        const tx = await aggregator.connect(owner).execute(callData)

        // check balance after tx
        const balanceAfter = await token.connect(owner).balanceOf(callerAddr);
        console.log(balanceAfter);
        
        expect(balanceAfter).to.be.lessThan(balanceBefore);
    });

    it('should execute 3 aggregated swaps, tokens for ETH and update caller balances', async () => {
        const callerAddr = await owner.getAddress();

        // construct call data
        const callData = [{
            target: pancakeRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("1"),
            data: routerIFace.encodeFunctionData("swapExactTokensForETH", [ethers.utils.parseEther("1"), 0, [cakeTokenAddr, wbnbTokenAddr],callerAddr, 99999999999999])
          },
          {
            target: apeswapRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("5"),
            data: routerIFace.encodeFunctionData("swapExactTokensForETH", [ethers.utils.parseEther("5"), 0, [cakeTokenAddr, wbnbTokenAddr], callerAddr, 99999999999999])
          },
          {
            target: babyswapRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("2"),
            data: routerIFace.encodeFunctionData("swapExactTokensForETH", [ethers.utils.parseEther("2"), 0, [cakeTokenAddr, wbnbTokenAddr], callerAddr, 99999999999999])
          }]
          
        // approve tokens to be spent
        const token = new ethers.Contract(cakeTokenAddr, erc20ABI, owner);
        await token.connect(owner).approve(aggregator.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        
        // check balance before of token spent
        const balanceBefore = await token.connect(owner).balanceOf(callerAddr);
        console.log(balanceBefore);
          
        // execute multicall tx
        const tx = await aggregator.connect(owner).execute(callData)

        // check balance after tx
        const balanceAfter = await token.connect(owner).balanceOf(callerAddr);
        console.log(balanceAfter);
        
        expect(balanceAfter).to.be.lessThan(balanceBefore);
    });

    it('whole tx should revert if not enough tokens for a swap', async () => {
        const callerAddr = await owner.getAddress();

        // construct call data
        const callData = [{
            target: pancakeRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("1"),
            data: routerIFace.encodeFunctionData("swapExactTokensForETH", [ethers.utils.parseEther("1"), 0, [cakeTokenAddr, wbnbTokenAddr],callerAddr, 99999999999999])
          },
          {
            target: pancakeRouterAddr,
            tokenIn: bananaTokenAddr, // this should revert
            amountIn: ethers.utils.parseEther("1"),
            data: routerIFace.encodeFunctionData("swapExactTokensForETH", [ethers.utils.parseEther("1"), 0, [cakeTokenAddr, wbnbTokenAddr], callerAddr, 99999999999999])
          },
          {
            target: babyswapRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("1"),
            data: routerIFace.encodeFunctionData("swapExactTokensForETH", [ethers.utils.parseEther("1"), 0, [cakeTokenAddr, wbnbTokenAddr], callerAddr, 99999999999999])
          }]
          
        // approve tokens to be spent
        const cake = new ethers.Contract(cakeTokenAddr, erc20ABI, owner);
        await cake.connect(owner).approve(aggregator.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

        const banana = new ethers.Contract(bananaTokenAddr, erc20ABI, owner);
        await banana.connect(owner).approve(aggregator.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

        // execute multicall tx
        await expect(aggregator.connect(owner).execute(callData)).to.be.revertedWith('BEP20: transfer amount exceeds balance');
        
    });

    it('whole tx should revert if tokens are not approved', async () => {
        const callerAddr = await owner.getAddress();

        // construct call data
        const callData = [{
            target: pancakeRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("1"),
            data: routerIFace.encodeFunctionData("swapExactTokensForETH", [ethers.utils.parseEther("1"), 0, [cakeTokenAddr, wbnbTokenAddr],callerAddr, 99999999999999])
          },
          {
            target: babyswapRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("1"),
            data: routerIFace.encodeFunctionData("swapExactTokensForETH", [ethers.utils.parseEther("1"), 0, [cakeTokenAddr, wbnbTokenAddr], callerAddr, 99999999999999])
          }]

        // execute multicall tx
        await expect(aggregator.connect(owner).execute(callData)).to.be.revertedWith('BEP20: transfer amount exceeds allowance');
        
    });

    it('should execute 2 aggregated swaps, ETH for tokens and update caller balances', async () => {
      const callerAddr = await owner.getAddress();

      // construct call data
      const callData = [{
          target: pancakeRouterAddr,
          etherAmount: ethers.utils.parseEther("1"),
          data: routerIFace.encodeFunctionData("swapExactETHForTokens", [0, [wbnbTokenAddr, cakeTokenAddr], callerAddr, 999999999999999])
        },
        {
          target: apeswapRouterAddr,
          etherAmount: ethers.utils.parseEther("1"),
          data: routerIFace.encodeFunctionData("swapExactETHForTokens", [0, [wbnbTokenAddr, busdAddr], callerAddr, 999999999999999])
        }]

      const token = new ethers.Contract(cakeTokenAddr, erc20ABI, owner);
        
      // check balance before of token spent
      const balanceBefore = await token.connect(owner).balanceOf(callerAddr);
      console.log(balanceBefore);
        
      // execute multicall tx
      const tx = await aggregator.connect(owner).executeETH(callData, {value: ethers.utils.parseEther("2")});

      // check balance after tx
      const balanceAfter = await token.connect(owner).balanceOf(callerAddr);
      console.log(balanceAfter);
      
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });

  it('should execute 2 aggregated swaps, tokens for tokens and update caller balances', async () => {
    const callerAddr = await owner.getAddress();

    // construct call data
    const callData = [{
            target: pancakeRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("10"),
            data: routerIFace.encodeFunctionData("swapExactTokensForTokens", [ethers.utils.parseEther("10"), 0, [cakeTokenAddr, busdAddr], callerAddr, 99999999999999])
        },
        {
            target: babyswapRouterAddr,
            tokenIn: cakeTokenAddr,
            amountIn: ethers.utils.parseEther("10"),
            data: routerIFace.encodeFunctionData("swapExactTokensForTokens", [ethers.utils.parseEther("10"), 0, [cakeTokenAddr, busdAddr], callerAddr, 99999999999999])
        }]
    const cakeToken = new ethers.Contract(cakeTokenAddr, erc20ABI, owner);
    const busdToken = new ethers.Contract(busdAddr, erc20ABI, owner);

    await cakeToken.connect(owner).approve(aggregator.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      
    // check balance before of token spent
    const cakeBalanceBefore = await cakeToken.connect(owner).balanceOf(callerAddr);
    console.log(`Cake before: ${cakeBalanceBefore}`);
    const busdBalanceBefore = await busdToken.connect(owner).balanceOf(callerAddr);
    console.log(`Busd before: ${busdBalanceBefore}`);
      
    // execute multicall tx
    const tx = await aggregator.connect(owner).execute(callData);

    // check balance after tx
    const cakeBalanceAfter = await cakeToken.connect(owner).balanceOf(callerAddr);
    console.log(`Cake after: ${cakeBalanceAfter}`);
    const busdBalanceAfter = await busdToken.connect(owner).balanceOf(callerAddr);
    console.log(`Busd after: ${busdBalanceAfter}`);

    expect(cakeBalanceAfter).to.be.lessThan(cakeBalanceBefore);
    expect(busdBalanceAfter).to.be.greaterThan(busdBalanceBefore);
});

})