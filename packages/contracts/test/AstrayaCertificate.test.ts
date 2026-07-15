import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type {
  AstrayaCertificate721,
  AstrayaDivination721,
} from "../typechain-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROYALTY_BPS = 500n; // 5%

// sha256 digest interpreted as bytes32 — Phase 1 stores the cert integrityHash
// as a hex string; on-chain we pass it as bytes32.
function fakeIntegrityHash(seed: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(seed));
}

async function deployCertificate() {
  const [deployer, admin, minter, royaltyReceiver, alice, bob] =
    await ethers.getSigners();

  const Factory = await ethers.getContractFactory(
    "AstrayaCertificate721",
    deployer,
  );
  const contract = (await Factory.deploy(
    admin.address,
    minter.address,
    royaltyReceiver.address,
    ROYALTY_BPS,
  )) as unknown as AstrayaCertificate721;
  await contract.waitForDeployment();

  return { contract, deployer, admin, minter, royaltyReceiver, alice, bob };
}

async function deployDivination() {
  const [deployer, admin, minter, royaltyReceiver, alice] =
    await ethers.getSigners();

  const Factory = await ethers.getContractFactory(
    "AstrayaDivination721",
    deployer,
  );
  const contract = (await Factory.deploy(
    admin.address,
    minter.address,
    royaltyReceiver.address,
    ROYALTY_BPS,
  )) as unknown as AstrayaDivination721;
  await contract.waitForDeployment();

  return { contract, deployer, admin, minter, royaltyReceiver, alice };
}

// ---------------------------------------------------------------------------
// Certificate (product) suite
// ---------------------------------------------------------------------------

describe("AstrayaCertificate721", () => {
  describe("Deployment", () => {
    it("sets the expected name + symbol", async () => {
      const { contract } = await loadFixture(deployCertificate);
      expect(await contract.name()).to.equal("Astraya Certificate");
      expect(await contract.symbol()).to.equal("ASTRA-CERT");
    });

    it("grants DEFAULT_ADMIN_ROLE to admin and MINTER_ROLE to minter", async () => {
      const { contract, admin, minter, deployer } =
        await loadFixture(deployCertificate);
      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await contract.MINTER_ROLE();

      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be
        .true;
      expect(await contract.hasRole(MINTER_ROLE, minter.address)).to.be.true;

      // Deployer should NOT silently inherit admin — we pass admin explicitly.
      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be
        .false;
      expect(await contract.hasRole(MINTER_ROLE, deployer.address)).to.be.false;
    });

    it("initialises nextTokenId at 1", async () => {
      const { contract } = await loadFixture(deployCertificate);
      expect(await contract.nextTokenId()).to.equal(1n);
    });

    it("wires the default royalty according to constructor args", async () => {
      const { contract, royaltyReceiver } = await loadFixture(
        deployCertificate,
      );
      const [receiver, amount] = await contract.royaltyInfo(1, 10_000n);
      expect(receiver).to.equal(royaltyReceiver.address);
      // 5% of 10_000 = 500
      expect(amount).to.equal(500n);
    });

    it("skips default royalty when feeBps is 0", async () => {
      const [deployer, admin, minter] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory(
        "AstrayaCertificate721",
        deployer,
      );
      const contract = (await Factory.deploy(
        admin.address,
        minter.address,
        ethers.ZeroAddress,
        0,
      )) as unknown as AstrayaCertificate721;
      await contract.waitForDeployment();

      const [receiver, amount] = await contract.royaltyInfo(1, 10_000n);
      expect(receiver).to.equal(ethers.ZeroAddress);
      expect(amount).to.equal(0n);
    });

    it("reverts when admin or minter is the zero address", async () => {
      const [deployer, admin, minter] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory(
        "AstrayaCertificate721",
        deployer,
      );

      await expect(
        Factory.deploy(
          ethers.ZeroAddress,
          minter.address,
          ethers.ZeroAddress,
          0,
        ),
      ).to.be.revertedWith("AstrayaCert: admin=0");

      await expect(
        Factory.deploy(
          admin.address,
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          0,
        ),
      ).to.be.revertedWith("AstrayaCert: minter=0");
    });
  });

  describe("Minting", () => {
    it("mints with correct tokenId, owner, uri and event", async () => {
      const { contract, minter, alice } = await loadFixture(deployCertificate);
      const hash = fakeIntegrityHash("order-1");
      const uri = "https://astraya.io/api/cert/ASTR-20260423-DEMO";

      await expect(contract.connect(minter).mint(alice.address, hash, uri))
        .to.emit(contract, "CertificateMinted")
        .withArgs(1n, alice.address, hash, uri)
        .and.to.emit(contract, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, 1n);

      expect(await contract.ownerOf(1n)).to.equal(alice.address);
      expect(await contract.tokenURI(1n)).to.equal(uri);
      expect(await contract.tokenIdByHash(hash)).to.equal(1n);
      expect(await contract.nextTokenId()).to.equal(2n);
      expect(await contract.balanceOf(alice.address)).to.equal(1n);
    });

    it("assigns monotonically increasing token ids", async () => {
      const { contract, minter, alice, bob } =
        await loadFixture(deployCertificate);

      await contract
        .connect(minter)
        .mint(alice.address, fakeIntegrityHash("a"), "uri://a");
      await contract
        .connect(minter)
        .mint(bob.address, fakeIntegrityHash("b"), "uri://b");
      await contract
        .connect(minter)
        .mint(alice.address, fakeIntegrityHash("c"), "uri://c");

      expect(await contract.ownerOf(1n)).to.equal(alice.address);
      expect(await contract.ownerOf(2n)).to.equal(bob.address);
      expect(await contract.ownerOf(3n)).to.equal(alice.address);
      expect(await contract.nextTokenId()).to.equal(4n);
    });

    it("rejects a duplicate integrityHash", async () => {
      const { contract, minter, alice, bob } =
        await loadFixture(deployCertificate);
      const hash = fakeIntegrityHash("same");
      await contract.connect(minter).mint(alice.address, hash, "uri://1");

      await expect(
        contract.connect(minter).mint(bob.address, hash, "uri://2"),
      )
        .to.be.revertedWithCustomError(contract, "IntegrityHashAlreadyMinted")
        .withArgs(hash, 1n);
    });

    it("rejects zero recipient and zero hash", async () => {
      const { contract, minter, alice } = await loadFixture(deployCertificate);
      await expect(
        contract
          .connect(minter)
          .mint(ethers.ZeroAddress, fakeIntegrityHash("x"), "uri://"),
      ).to.be.revertedWithCustomError(contract, "ZeroRecipient");

      await expect(
        contract.connect(minter).mint(alice.address, ethers.ZeroHash, "uri://"),
      ).to.be.revertedWithCustomError(contract, "ZeroIntegrityHash");
    });

    it("reverts when a non-minter tries to mint", async () => {
      const { contract, alice } = await loadFixture(deployCertificate);
      const MINTER_ROLE = await contract.MINTER_ROLE();

      await expect(
        contract
          .connect(alice)
          .mint(alice.address, fakeIntegrityHash("z"), "uri://"),
      )
        .to.be.revertedWithCustomError(
          contract,
          "AccessControlUnauthorizedAccount",
        )
        .withArgs(alice.address, MINTER_ROLE);
    });
  });

  describe("Royalty admin", () => {
    it("admin can update the default royalty", async () => {
      const { contract, admin, alice } = await loadFixture(deployCertificate);
      await contract
        .connect(admin)
        .setDefaultRoyalty(alice.address, 250 /* 2.5% */);

      const [receiver, amount] = await contract.royaltyInfo(1, 10_000n);
      expect(receiver).to.equal(alice.address);
      expect(amount).to.equal(250n);
    });

    it("admin can delete the default royalty", async () => {
      const { contract, admin } = await loadFixture(deployCertificate);
      await contract.connect(admin).deleteDefaultRoyalty();
      const [receiver, amount] = await contract.royaltyInfo(1, 10_000n);
      expect(receiver).to.equal(ethers.ZeroAddress);
      expect(amount).to.equal(0n);
    });

    it("non-admin cannot change the default royalty", async () => {
      const { contract, alice } = await loadFixture(deployCertificate);
      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();

      await expect(
        contract.connect(alice).setDefaultRoyalty(alice.address, 100),
      )
        .to.be.revertedWithCustomError(
          contract,
          "AccessControlUnauthorizedAccount",
        )
        .withArgs(alice.address, DEFAULT_ADMIN_ROLE);
    });
  });

  describe("ERC-165 supportsInterface", () => {
    it("advertises ERC-721, ERC-721Metadata, ERC-2981 and AccessControl", async () => {
      const { contract } = await loadFixture(deployCertificate);
      // ERC-165
      expect(await contract.supportsInterface("0x01ffc9a7")).to.be.true;
      // ERC-721
      expect(await contract.supportsInterface("0x80ac58cd")).to.be.true;
      // ERC-721 Metadata
      expect(await contract.supportsInterface("0x5b5e139f")).to.be.true;
      // ERC-2981 royalty
      expect(await contract.supportsInterface("0x2a55205a")).to.be.true;
      // AccessControl
      expect(await contract.supportsInterface("0x7965db0b")).to.be.true;
      // Random garbage → false
      expect(await contract.supportsInterface("0xdeadbeef")).to.be.false;
    });
  });

  describe("Transferability", () => {
    it("holder can transfer their certificate to another wallet", async () => {
      const { contract, minter, alice, bob } =
        await loadFixture(deployCertificate);
      await contract
        .connect(minter)
        .mint(alice.address, fakeIntegrityHash("t"), "uri://");

      await contract
        .connect(alice)
        .transferFrom(alice.address, bob.address, 1n);

      expect(await contract.ownerOf(1n)).to.equal(bob.address);
    });
  });
});

// ---------------------------------------------------------------------------
// Divination (consultation) suite — smoke tests only, the shared base logic
// is already covered above.
// ---------------------------------------------------------------------------

describe("AstrayaDivination721", () => {
  it("sets its own name + symbol and isolates its tokenId counter", async () => {
    const { contract, minter, alice } = await loadFixture(deployDivination);

    expect(await contract.name()).to.equal("Astraya Divination");
    expect(await contract.symbol()).to.equal("ASTRA-DIV");
    expect(await contract.nextTokenId()).to.equal(1n);

    await contract
      .connect(minter)
      .mint(alice.address, fakeIntegrityHash("div-1"), "uri://div-1");

    expect(await contract.ownerOf(1n)).to.equal(alice.address);
    expect(await contract.nextTokenId()).to.equal(2n);
  });
});
