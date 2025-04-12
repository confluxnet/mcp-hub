import { zeroAddress, toHex, type Hex, type Address } from 'viem';
// Mock Story SDK interface
interface Story {
  ipAsset: any;
  licenseTerms: any;
  royalties: any;
}

interface RecipeMetadata {
  title: string;
  description: string;
  tags: string[];
  icon: string;
  steps: {
    name: string;
    description: string;
    mcpId: string;
  }[];
  mcps: string[];
  codeExamples: {
    typescript: string;
    python: string;
    shell: string;
  };
}

// File hash helper
export async function getFileHash(file: File): Promise<Hex> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return toHex(new Uint8Array(hashBuffer), { size: 32 });
}

// IPFS upload functions
export async function uploadImageToIPFS(data: FormData) {
  const pinFileRes = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: data,
    }
  );
  const { IpfsHash } = await pinFileRes.json();
  return IpfsHash;
}

export async function uploadJSONToIPFS(data: Record<string, any>) {
  // In a real implementation, we would use Pinata SDK
  console.log('Uploading JSON to IPFS:', data);
  // Simulate IPFS hash
  return `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

// Main Story Protocol service
export const storyProtocol = {
  // Register a new IP asset
  registerIPA: async (client: Story, metadata: RecipeMetadata) => {
    try {
      // Upload metadata to IPFS
      const ipfsHash = await uploadJSONToIPFS(metadata);
      const ipfsUri = `ipfs://${ipfsHash}`;
      
      // Generate metadata hashes
      const metadataHash = toHex(crypto.randomUUID(), { size: 32 });
      const nftMetadataHash = toHex(crypto.randomUUID(), { size: 32 });
      
      // Register IP on Story Protocol
      const response = await client.ipAsset.mintAndRegisterIp({
        ipMetadata: {
          ipMetadataURI: ipfsUri,
          ipMetadataHash: metadataHash,
          nftMetadataHash: nftMetadataHash,
          nftMetadataURI: ipfsUri,
        },
        txOptions: { waitForTransaction: true }
      });
      
      return {
        success: true,
        ipId: response.ipId,
        txHash: response.txHash,
        ipfsHash
      };
    } catch (error) {
      console.error('Error registering IPA:', error);
      return { success: false, error };
    }
  },
  
  // Create and attach license terms
  createAndAttachLicenseTerms: async (client: Story, ipId: Address) => {
    try {
      // First create license terms
      const createResponse = await client.licenseTerms.createLicenseTerms({
        licensorIpId: ipId,
        commercial: true,
        commercialRevShare: 500, // 5%
        derivatives: true,
        derivativesRevShare: 200, // 2%
        reciprocal: true,
        attribution: true,
        commercialAdaptations: [{ adaptationType: 1, allowed: true }], // Allow commercial adaptations
        commercialDistributions: [{ distributionType: 1, allowed: true }], // Allow commercial distributions
        territories: [], // Empty means worldwide
        distributionChannels: [], // Empty means all channels
        contentRestrictions: [],
        txOptions: { waitForTransaction: true }
      });
      
      const licenseTermsId = createResponse.licenseTermsId;
      
      // Then attach the license terms to the IP asset
      const attachResponse = await client.ipAsset.attachLicenseTerms({
        licenseTermsId,
        ipId,
        txOptions: { waitForTransaction: true }
      });
      
      return {
        success: true,
        licenseTermsId,
        txHash: attachResponse.txHash
      };
    } catch (error) {
      console.error('Error creating/attaching license terms:', error);
      return { success: false, error };
    }
  },
  
  // Configure royalty distribution
  configureRoyalties: async (client: Story, ipId: Address, ownerAddress: Address) => {
    try {
      // Set up royalty configuration
      const response = await client.royalties.configureRoyalties({
        ipId,
        receivers: [{ receiver: ownerAddress, percentage: 10000 }], // 100%
        txOptions: { waitForTransaction: true }
      });
      
      return {
        success: true,
        royaltyConfigId: response.royaltyConfigId,
        txHash: response.txHash
      };
    } catch (error) {
      console.error('Error configuring royalties:', error);
      return { success: false, error };
    }
  },
  
  // Mint a license token to use a recipe
  mintLicense: async (client: Story, licenseTermsId: string, licensorIpId: Address, receiverAddress: Address) => {
    try {
      const response = await client.ipAsset.mintLicenseTokens({
        licenseTermsId,
        licensorIpId,
        receiver: receiverAddress,
        amount: 1,
        maxMintingFee: 0, // No minting fee
        maxRevenueShare: 100, // Default
        txOptions: { waitForTransaction: true }
      });
      
      return {
        success: true,
        licenseTokenIds: response.licenseTokenIds,
        txHash: response.txHash
      };
    } catch (error) {
      console.error('Error minting license:', error);
      return { success: false, error };
    }
  },
  
  // Register a derivative IP asset
  registerDerivativeIPA: async (client: Story, parentIpId: Address, metadata: RecipeMetadata) => {
    try {
      // First register the new IP asset
      const ipResponse = await storyProtocol.registerIPA(client, metadata);
      if (!ipResponse.success) throw ipResponse.error;
      
      // Then register the relationship between the parent and child
      const relationshipResponse = await client.ipAsset.registerRelationship({
        parentIpId,
        childIpId: ipResponse.ipId as Address,
        relType: 1, // 1 = Derivative
        txOptions: { waitForTransaction: true }
      });
      
      return {
        success: true,
        ipId: ipResponse.ipId,
        relationshipId: relationshipResponse.relationshipId,
        txHash: relationshipResponse.txHash
      };
    } catch (error) {
      console.error('Error registering derivative IPA:', error);
      return { success: false, error };
    }
  },
  
  // Claim royalty revenue
  claimRevenue: async (client: Story, ipId: Address) => {
    try {
      const response = await client.royalties.claimRoyalties({
        ipId,
        txOptions: { waitForTransaction: true }
      });
      
      return {
        success: true,
        amount: response.amount,
        txHash: response.txHash
      };
    } catch (error) {
      console.error('Error claiming revenue:', error);
      return { success: false, error };
    }
  },
  
  // Complete flow to create, register, and monetize a recipe
  createAndRegisterRecipe: async (
    client: Story | null, 
    params: {
      metadata: RecipeMetadata;
      ownerAddress: Address;
    }
  ) => {
    if (!client) {
      return { success: false, error: 'No Story Protocol client available' };
    }
    
    try {
      console.log('Starting complete recipe registration flow');
      
      // 1. Register the IP asset
      const ipaResponse = await storyProtocol.registerIPA(client, params.metadata);
      if (!ipaResponse.success) throw ipaResponse.error;
      const ipId = ipaResponse.ipId as Address;
      
      // 2. Create and attach license terms
      const licenseResponse = await storyProtocol.createAndAttachLicenseTerms(client, ipId);
      if (!licenseResponse.success) throw licenseResponse.error;
      
      // 3. Configure royalty distribution
      const royaltyResponse = await storyProtocol.configureRoyalties(client, ipId, params.ownerAddress);
      if (!royaltyResponse.success) throw royaltyResponse.error;
      
      return {
        success: true,
        ipId,
        licenseTermsId: licenseResponse.licenseTermsId,
        royaltyConfigId: royaltyResponse.royaltyConfigId,
        ipfsHash: ipaResponse.ipfsHash
      };
    } catch (error) {
      console.error('Error in createAndRegisterRecipe:', error);
      return {
        success: false,
        error,
      };
    }
  }
};