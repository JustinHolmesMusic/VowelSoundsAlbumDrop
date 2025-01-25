import { generateVideoMetadata } from './discord_video_fetcher.js';
import { blueRailroadContractAddress } from './constants.js';
import { getProjectDirs } from './locations.js';
import { createConfig, http } from '@wagmi/core';
import { mainnet, optimism } from '@wagmi/core/chains';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import dotenv from 'dotenv';
import { getBlueRailroads } from './chain_reading.js';

dotenv.config();

async function getBlueRailroadMetadata() {
    const { fetchedAssetsDir } = getProjectDirs();
    const spinner = ora('Reading Blue Railroad contract data').start();

    try {
        const config = createConfig({
            chains: [optimism],
            transports: {
                [optimism.id]: http(`https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)
            }
        });

        // Get tokens from contract
        const blueRailroads = await getBlueRailroads(config);
        spinner.succeed(`Found ${Object.keys(blueRailroads).length} Blue Railroads`);

        // Filter for Discord URLs and fetch metadata
        const discordUrls = Object.entries(blueRailroads)
            .filter(([_, token]) => token.uri && token.uri.includes('discordapp.com'));

        if (discordUrls.length === 0) {
            console.log('No Discord URLs found in tokens');
            return;
        }

        spinner.start('Fetching Discord video metadata');
        const discordMetadata = await generateVideoMetadata(
            discordUrls.map(([_, token]) => token.uri)
        );

        // Combine contract and Discord data
        const metadata = {};
        discordUrls.forEach(([tokenId, token], index) => {
            metadata[tokenId] = {
                owner: token.owner,
                discord_message_url: token.uri,
                video_url: discordMetadata[index]?.discordUrl || null,
                timestamp: discordMetadata[index]?.timestamp || null,
                content_type: discordMetadata[index]?.contentType || null
            };
        });

        // Save metadata
        if (!fs.existsSync(fetchedAssetsDir)) {
            fs.mkdirSync(fetchedAssetsDir, { recursive: true });
        }

        const chainId = '10'; // Optimism
        const contractAddr = blueRailroadContractAddress;
        const filename = `${chainId}-${contractAddr}.json`;
        const metadataPath = path.join(fetchedAssetsDir, filename);

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        spinner.succeed(`Metadata written to ${metadataPath}`);

    } catch (error) {
        spinner.fail('Error fetching metadata');
        console.error(error);
        process.exit(1);
    }
}

getBlueRailroadMetadata().catch(console.error); 