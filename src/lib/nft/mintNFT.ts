import { Address } from 'viem';
import { NFTContractAddress } from '../../utils';
import { publicClient, walletClient, account } from '../config/viemConfig';
import { defaultNftContractAbi } from '../../abi/defaultNftContractAbi';
import { storyProtocol } from '../storyProtocol';
import { useStory } from '../context/StoryContext';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
}

/**
 * Converts NFT metadata to Recipe metadata for Story Protocol
 */
function convertToRecipeMetadata(nftMetadata: NFTMetadata) {
  return {
    title: nftMetadata.name,
    description: nftMetadata.description,
    tags: nftMetadata.attributes.map(attr => `${attr.trait_type}:${attr.value}`),
    icon: nftMetadata.image,
    steps: [],
    mcps: [],
    codeExamples: {
      typescript: '',
      python: '',
      shell: ''
    }
  };
}

/**
 * Mints an NFT and registers it with Story Protocol
 * @param to - Address to mint the NFT to
 * @param uri - IPFS URI for the NFT metadata
 * @param metadata - NFT metadata object
 */
export async function mintNFTWithStoryProtocol(
  to: Address, 
  uri: string, 
  metadata: NFTMetadata,
  storyClient: any
): Promise<{ tokenId?: number; ipId?: Address; success: boolean; error?: any }> {
  console.log('Minting a new NFT with Story Protocol integration...');

  try {
    // Step 1: Mint the NFT
    const { request } = await publicClient.simulateContract({
      address: NFTContractAddress,
      functionName: 'mintNFT',
      args: [to, uri],
      abi: defaultNftContractAbi,
    });
    
    const hash = await walletClient.writeContract({ ...request, account });
    
    const { logs } = await publicClient.waitForTransactionReceipt({
      hash,
    });
    
    // Get token ID from the logs
    let tokenId;
    if (logs[0].topics[3]) {
      tokenId = parseInt(logs[0].topics[3], 16);
    } else {
      throw new Error('Failed to get token ID from transaction logs');
    }
    
    console.log(`NFT minted successfully with token ID: ${tokenId}`);
    
    // Step 2: Register the NFT with Story Protocol
    if (!storyClient) {
      return { 
        tokenId, 
        success: true, 
        error: 'No Story Protocol client available for IP registration. NFT minted successfully, but not registered with Story Protocol.' 
      };
    }
    
    // Convert NFT metadata to Recipe metadata format for Story Protocol
    const recipeMetadata = convertToRecipeMetadata(metadata);
    
    // Register with Story Protocol
    const registration = await storyProtocol.createAndRegisterRecipe(
      storyClient,
      {
        metadata: recipeMetadata,
        ownerAddress: to
      }
    );
    
    if (!registration.success) {
      return { 
        tokenId, 
        success: true, 
        error: `NFT minted successfully with token ID ${tokenId}, but failed to register with Story Protocol: ${registration.error}` 
      };
    }
    
    return { 
      tokenId, 
      ipId: registration.ipId, 
      success: true 
    };
  } catch (error) {
    console.error('Error minting NFT with Story Protocol:', error);
    return { success: false, error };
  }
}

/**
 * Hook for minting an NFT with Story Protocol
 * Provides access to the Story Protocol client
 */
export function useMintNFTWithStoryProtocol() {
  const { client: storyClient, setTxLoading, setTxHash, setTxName } = useStory();
  
  const mintNFT = async (to: Address, uri: string, metadata: NFTMetadata) => {
    try {
      setTxLoading(true);
      setTxName('Minting NFT and registering with Story Protocol');
      
      const result = await mintNFTWithStoryProtocol(to, uri, metadata, storyClient);
      
      if (result.success) {
        // Set transaction hash if available
        if (result.tokenId) {
          setTxHash(`TokenID: ${result.tokenId}`);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error in useMintNFTWithStoryProtocol:', error);
      return { success: false, error };
    } finally {
      setTxLoading(false);
    }
  };
  
  return { mintNFT };
}