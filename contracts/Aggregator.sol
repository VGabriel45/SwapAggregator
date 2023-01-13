// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IPancakeRouter01 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountToken, uint amountETH);
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
}

contract Target {

    uint count = 0;

    function foo() external view returns(uint) {
        return count;
    }

}

contract TestMultiCall {
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts){}

    function encodingFunctionSignature()
	    public
        view
	    returns(bytes memory)
    {
        uint amountIn = 1000000;
        address[] memory path = new address[](2);
        path[0] = 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82;
        path[1] = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
        return abi.encodeWithSelector(IPancakeRouter01.getAmountsOut.selector, amountIn, path);
    }
}


contract Aggregator {

    uint256 MAX_INT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    struct Call{
        address target;
        address tokenIn;
        uint amountIn;
        bytes data;
    }

    struct GetBestPrice{
        address target;
        bytes data;
    }

    struct Result{
        address target;
        uint amount;
    }

    event OptimalResult(address optimalAmm, uint bestReturn);

    function getBestPriceMulticall(
        GetBestPrice[] calldata callData
    ) external view returns (uint, address) {
        Result[] memory results = new Result[](callData.length);
        for(uint i = 0; i < callData.length; i++){
            (bool success, bytes memory data) = callData[i].target.staticcall(callData[i].data);
            require(success, "call failed");
            (,,, uint256 amountOut) = abi.decode(data, (uint256,uint256,uint256,uint256));
            results[i] = Result(callData[i].target, amountOut);
        }
        
        address optimalAmm;
        uint bestReturn = 0;
        for(uint i = 0; i < results.length; i++){
            if(results[i].amount > bestReturn){
                optimalAmm = results[i].target;
                bestReturn = results[i].amount;
            }
        }

        return (bestReturn, optimalAmm);
    }


    function execute(
        Call[] calldata callData
    ) external payable{
        for(uint i = 0; i < callData.length; i++){
            uint allowance = IERC20(callData[i].tokenIn).allowance(address(this), callData[i].target);
            if(allowance == 0){
                IERC20(callData[i].tokenIn).approve(callData[i].target, MAX_INT);
            }
            IERC20(callData[i].tokenIn).transferFrom(msg.sender, address(this), callData[i].amountIn);
            (bool success, bytes memory data) = callData[i].target.call(callData[i].data);
            require(success, "swap call failed");
        }
    }

    function executeETH(
        Call[] calldata callData
    ) external payable{
        for(uint i = 0; i < callData.length; i++){
            (bool success, bytes memory data) = callData[i].target.call{value: msg.value}(callData[i].data);
            require(success, "swap call failed");
        }
    }

}