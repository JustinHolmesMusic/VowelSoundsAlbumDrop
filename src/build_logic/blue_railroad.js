import { getProjectDirs } from "./locations.js";
import fs from 'fs';
import path from 'path';
import { blueRailroadContractAddress } from './constants.js';

/**
 * Verifies that all Blue Railroad video files exist and returns sorted metadata
 * @returns {Promise<Array>} Sorted metadata entries in reverse chronological order
 * @throws {Error} If metadata file is missing or if any video files are missing
 */
export async function verifyBlueRailroadVideos() {
    const { fetchedAssetsDir } = getProjectDirs();
    const chainId = '10';
    const metadataPath = path.join(fetchedAssetsDir, `${chainId}-${blueRailroadContractAddress}.json`);

    if (!fs.existsSync(metadataPath)) {
        throw new Error(
            'Blue Railroad metadata not found! Please run:\n' +
            'npm run fetch-video-metadata\n' +
            'npm run download-videos'
        );
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath));
    const missingVideos = [];

    for (const [tokenId, data] of Object.entries(metadata)) {
        if (!data.video_url) continue; // Skip entries without videos

        const expectedVideoPath = path.join(
            fetchedAssetsDir,
            `${chainId}-${blueRailroadContractAddress}-${tokenId}.mp4`
        );

        if (!fs.existsSync(expectedVideoPath)) {
            missingVideos.push(tokenId);
        }
    }

    if (missingVideos.length > 0) {
        throw new Error(
            `Missing videos for tokens: ${missingVideos.join(', ')}\n` +
            'Please run: npm run download-videos'
        );
    }

    // Sort by latest first.
    return Object.entries(metadata).reverse()
}
