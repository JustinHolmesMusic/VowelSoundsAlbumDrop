import { readFileSync } from 'fs';
import path from 'path';
import ora from 'ora';
import cliProgress from 'cli-progress';
import { downloadVideos } from './discord_video_fetcher.js';
import { getProjectDirs } from './locations.js';
import { blueRailroadContractAddress } from './constants.js';

async function main() {
    const { fetchedAssetsDir } = getProjectDirs();
    const spinner = ora('Reading metadata').start();

    try {
        // Construct metadata filename
        const chainId = '10'; // Optimism
        const contractAddr = blueRailroadContractAddress;
        const metadataFilename = `${chainId}-${contractAddr}.json`;
        const metadataPath = path.join(fetchedAssetsDir, metadataFilename);

        const metadata = JSON.parse(readFileSync(metadataPath));
        const videos = Object.entries(metadata)
            .filter(([_, data]) => data.video_url) // Only process entries with video URLs
            .map(([tokenId, data]) => ({
                discordUrl: data.video_url,
                fileName: `${chainId}-${contractAddr}-${tokenId}.mp4`,
                tokenId
            }));

        spinner.succeed(`Found ${videos.length} videos to process`);

        const progressBar = new cliProgress.SingleBar({
            format: 'Downloading videos |{bar}| {percentage}% | {value}/{total} | Token #{tokenId}',
            barCompleteChar: '=',
            barIncompleteChar: '-',
        });

        progressBar.start(videos.length, 0, { tokenId: 'Starting...' });

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            progressBar.update(i, { tokenId: video.tokenId });

            try {
                await downloadVideos([video], fetchedAssetsDir);
            } catch (error) {
                console.error(`\nError downloading token #${video.tokenId}:`, error);
            }
        }

        progressBar.stop();
        console.log('\n🎵 All done! Your videos are ready for the show! 🎸');

    } catch (error) {
        spinner.fail('Error during download process');
        console.error(error);
        process.exit(1);
    }
}

main().catch(console.error); 