const { rejects } = require("assert")
const { ethers, network } = require("hardhat")
const { resolve } = require("path")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const BasicNFT = await ethers.getContract("BasicNFT", deployer)
    const BasicNFTMintTx = await BasicNFT.mintNFT()
    await BasicNFTMintTx.wait(1)

    console.log(`BasicNft index 0 has tokenURI: ${await BasicNFT.tokenURI(0)}`)

    const RandomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await RandomIpfsNft.getMintFee()
    const RandomNftMintTx = await RandomIpfsNft.requestNft({
        value: mintFee.toString(),
    })
    const RandomNftMintTxReceipt = await RandomNftMintTx.wait(1)

    await new Promise(async (resolve, reject) => {
        setTimeout(
            () => reject("Timeout: 'NFTMinted' event did not fire"),
            300000
        ) // 5 minute timeout time
        RandomIpfsNft.once("NftMinted", async function () {
            resolve()
        })

        if (chainId == 31337) {
            const requestId =
                RandomNftMintTxReceipt.events[1].args.requestId.toString()
            const VRFCoordinatorV2Mock = await ethers.getContract(
                "VRFCoordinatorV2Mock",
                deployer
            )
            await VRFCoordinatorV2Mock.fulfillRandomWords(
                requestId,
                RandomIpfsNft.address
            )
        }
    })
    console.log(
        `Random IPFS NFT index 0 has tokenURI: ${await RandomIpfsNft.tokenURI(
            0
        )}`
    )

    const highValue = ethers.utils.parseEther("4000")
    const DynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const DynamicSvgNftMintTX = await DynamicSvgNft.mintNft(
        highValue.toString()
    )
    await DynamicSvgNftMintTX.wait(1)

    console.log(
        `Dynamic Svg NFT  index 0 has tokenURI: ${await DynamicSvgNft.tokenURI(
            0
        )}`
    )
}
module.exports.tags = ["all", "mint"]
