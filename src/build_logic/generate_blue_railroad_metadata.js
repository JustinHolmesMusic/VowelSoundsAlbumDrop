import fs from 'fs';
import path from 'path';
import { pinFileToIPFS } from './ipfs_helpers.js';  // assuming you have this

export async function generateBlueRailroadMetadata(tokenId, imageHash) {
    const metadata = {
        name: `Blue Railroad Train #${tokenId}`,
        description: "A proud blue steam engine charges down the tracks through a pixel art landscape. Part of the Blue Railroad Train collection by CryptoGrass.",
        image: `ipfs://${imageHash}`,
        external_url: `https://cryptograss.com/blue-railroad/${tokenId}`,
        attributes: [
            {
                trait_type: "Type",
                value: "Steam Locomotive"
            },
            {
                trait_type: "Style",
                value: "Pixel Art"
            },
            {
                trait_type: "Perspective",
                value: "First Person"
            }
        ]
    };

    // Write to your build directory
    const outputDir = path.join(process.cwd(), 'dist', 'metadata', 'blue-railroad');
    fs.mkdirSync(outputDir, { recursive: true });

    // Write both numbered and tokenId versions for marketplace compatibility
    fs.writeFileSync(
        path.join(outputDir, `${tokenId}`),
        JSON.stringify(metadata, null, 2)
    );
    fs.writeFileSync(
        path.join(outputDir, `${tokenId}.json`),
        JSON.stringify(metadata, null, 2)
    );

    return metadata;
} 