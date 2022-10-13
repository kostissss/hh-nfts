const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    let ethUsdPriceFeedAddress
    const chainId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }
    const lowSVG = fs.readFileSync("./images/dynamicNft/frown.svg", {
        encoding: "utf8",
    })
    const highSVG = fs.readFileSync("./images/dynamicNft/happy.svg", {
        encoding: "utf8",
    })

    const args = [ethUsdPriceFeedAddress, lowSVG, highSVG]
    const DynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("------------")

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying........")
        await verify(DynamicSvgNft.address, args)
    }
    log("--------------------------------")
}
module.exports.tags = ["all", "dynamicsvg"]
