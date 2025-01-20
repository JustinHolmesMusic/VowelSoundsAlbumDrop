import { jest } from '@jest/globals';

const mockFs = {
    existsSync: jest.fn(() => false),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn()
};

const mockFetch = jest.fn(() => Promise.resolve({
    buffer: () => Promise.resolve(Buffer.from('video data'))
}));

// Set up all mocks BEFORE any imports
jest.unstable_mockModule('fs', () => ({
    default: mockFs,
    __esModule: true
}));

jest.unstable_mockModule('node-fetch', () => ({
    default: mockFetch
}));

// Import the function we want to test
let downloadVideos;
beforeAll(async () => {
    const module = await import('../src/build_logic/discord_video_fetcher.js');
    downloadVideos = module.downloadVideos;
});

describe('Video Downloader', () => {
    beforeEach(() => {
        // Clear mock calls between tests
        jest.clearAllMocks();
    });

    test('downloads videos based on metadata', async () => {
        const metadataList = [
            {
                discordUrl: 'http://example.com/video.mp4',
                fileName: 'video.mp4'
            }
        ];
        const outputDir = '/mock/output/dir';

        await downloadVideos(metadataList, outputDir);

        expect(mockFs.existsSync).toHaveBeenCalled();
        expect(mockFs.writeFileSync).toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledWith('http://example.com/video.mp4');
    });
}); 