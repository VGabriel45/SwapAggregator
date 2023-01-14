// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC20 {
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IPancakeRouter01 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
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

    struct CallETH {
        address target;
        uint etherAmount;
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
        CallETH[] calldata callData
    ) external payable{
        for(uint i = 0; i < callData.length; i++){
            (bool success, bytes memory data) = callData[i].target.call{value: callData[i].etherAmount}(callData[i].data);
            require(success, "swap call failed");
        }
    }

}