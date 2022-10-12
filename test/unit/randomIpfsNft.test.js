const { assert, expect } = require("chai")
const { watchFile } = require("fs")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")

const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNft", async function () {
          let RandomIpfsNft
          let deployer
          let VRFCoordinatorV2Mock

          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              RandomIpfsNft = await ethers.getContract(
                  "RandomIpfsNft",
                  deployer
              )

              VRFCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              )
          })
          describe("constructor", async function () {
              it("sets starting values correctly", async function () {
                  const dogTokenURIZero = await RandomIpfsNft.getDogTokenUris(0)
                  assert(dogTokenURIZero.includes("ipfs://"))
              })
          })
          describe("requestNFT", async function () {
              it("reverts if value is less than the mint feee", async function () {
                  await expect(RandomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })
              it("emits an event when an NFT is requested", async function () {
                  const fee = await RandomIpfsNft.getMintFee()
                  await expect(
                      RandomIpfsNft.requestNft({ value: fee.toString() })
                  ).to.emit(RandomIpfsNft, "NftRequested")
              })
          })
          describe("fulfillRandomWords", async function () {
              it("emits an event when an NFT is minted", async function () {
                  const fee = await RandomIpfsNft.getMintFee()
                  const requestId = await RandomIpfsNft.requestNft({
                      value: fee.toString(),
                  })
                  await expect(
                      RandomIpfsNft.fulfillRandomWords(
                          requestId,
                          RandomIpfsNft.address
                      )
                  ).to.emit(RandomIpfsNft, "NftMinted")
              })
              it("increases token counter", async function () {
                  const tokenCounter = await RandomIpfsNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "1")
              })
          })
      })
