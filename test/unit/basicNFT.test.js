const { assert, expect } = require("chai")
const { watchFile } = require("fs")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { waitForDebugger } = require("inspector")
const { developmentChains } = require("../../helper-hardhat-config")
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT", async function () {
          let BasicNFT
          let deployer

          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              BasicNFT = await ethers.getContract("BasicNFT", deployer)
          })
          describe("constructor", async function () {
              it("sets the token counter to zero", async function () {
                  const tokenCounter = await BasicNFT.getTokenCounter()
                  assert.equal(tokenCounter, "0")
              })
          })
          describe("mintNFT", async function () {
              it("sets the token counter to zero", async function () {
                  const tx = await BasicNFT.mintNFT()
                  await tx.wait(1)
                  const tokenCounter = await BasicNFT.getTokenCounter()
                  assert.equal(tokenCounter, "1")
              })
          })
          describe("tokenURI has to always be  the same", async function () {
              it("sets the token counter to zero", async function () {
                  const TOKENURI = await BasicNFT.tokenURI(0)

                  assert.equal(
                      TOKENURI,
                      "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json"
                  )
              })
          })
      })
