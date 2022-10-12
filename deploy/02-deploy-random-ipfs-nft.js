const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/uploadToPinata")
const { verify } = require("../utils/verify")
const imagesLocation = "../images/randomNft"
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}
let tokenUris = [
    "ipfs://QmZpwPc48ngDXBBYEDAMuhECDemnAHK59hRZXYGc8oiKxv",
    "ipfs://QmTLCfKcFuc7MmuPxtD2mE7kk9xGRQVGAGwpspQ5syBf8B",
    "ipfs://QmVWaPxzpuzij2pXVQRUFUE1iYjiayK3sWpBU7vk4N29U3",
]

const FUND_AMMOUNT = "1000000000000000000000"
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }
    let VRFCoordinatorV2Address, subscriptionId
    if (developmentChains.includes(network.name)) {
        const VRFCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        )
        VRFCoordinatorV2Address = VRFCoordinatorV2Mock.address
        const tx = await VRFCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        await VRFCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            FUND_AMMOUNT
        )
    } else {
        VRFCoordinatorV2Address = networkConfig[chainId].VRFCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    log("-------------------")

    //await storeImages(imagesLocation)
    log("-------------------")

    const args = [
        VRFCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ]

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying........")
        await verify(randomIpfsNft.address, args)
    }
}

async function handleTokenUris() {
    const { responses: imageUploadResponses, files } = await storeImages(
        imagesLocation
    )
    for (imageUploadResponsesIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponsesIndex].replace(
            "png",
            ""
        )
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`

        console.log(`Uploading${tokenUriMetadata.name}....`)

        const metadataUploadResponse = await storeTokenUriMetadata(
            tokenUriMetadata
        )
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs upladed!!!")
    console.log(tokenUris)

    return tokenUris
}

module.exports.tags = ["all", "mocks"]
