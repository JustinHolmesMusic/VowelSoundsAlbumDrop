import { jest } from '@jest/globals';
import { Collection } from 'discord.js';
import { blueRailroadContractAddress } from '../src/build_logic/constants.js';

const mockFs = {
    existsSync: jest.fn(() => false),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn()
};

const mockMessage = {
    attachments: new Collection([
        ['video', { url: 'http://example.com/video.mp4', contentType: 'video/mp4' }]
    ]),
    createdTimestamp: Date.now()
};

const mockClient = {
    login: jest.fn(),
    channels: {
        fetch: jest.fn(() => Promise.resolve({
            messages: {
                fetch: jest.fn(() => Promise.resolve(mockMessage))
            }
        }))
    },
    destroy: jest.fn()
};

// Set up all mocks
jest.unstable_mockModule('fs', () => ({
    default: mockFs,
    __esModule: true
}));

jest.unstable_mockModule('discord.js', () => ({
    Client: jest.fn(() => mockClient),
    GatewayIntentBits: {
        MessageContent: 1,
        Guilds: 2,
        GuildMessages: 3
    }
}));
jest.unstable_mockModule('node-fetch', () => ({
    default: jest.fn(() => Promise.resolve({
        buffer: () => Promise.resolve(Buffer.from('video data'))
    }))
}));

// Import the functions we want to test - TODO: Move this to a shared file?  Or only do it in one module?  It's a pain.
let fetchDiscordVideos, generateVideoFilename;
beforeAll(async () => {
    const module = await import('../src/build_logic/discord_video_fetcher.js');
    fetchDiscordVideos = module.fetchDiscordVideos;
    generateVideoFilename = module.generateVideoFilename;
});

describe('Discord Video Fetcher', () => {
    test('downloads new video if not exists', async () => {
        const testUrl = 'https://discord.com/channels/server/channel/message';
        await fetchDiscordVideos([testUrl]);
        expect(mockFs.existsSync).toHaveBeenCalled();
        expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
});

describe('Video Filename Generation', () => {
    test('generates correct filename format', () => {
        const tokenId = '42';
        const token = {
            id: tokenId,
            uri: 'https://discord.com/something/video.mp4'
        };

        const filename = generateVideoFilename(token, token.uri);
        const metadataFromFilename = filename.split('.')[0];
        const chainId = metadataFromFilename.split('-')[0];
        const contractAddress = metadataFromFilename.split('-')[1];
        const tokenIdFromFilename = metadataFromFilename.split('-')[2];
        expect(chainId).toBe('10');  // Optimism.  OK.  But what if it's not?
        expect(blueRailroadContractAddress).toContain(contractAddress);
        expect(tokenIdFromFilename).toBe(tokenId);
    });

    test('handles different file extensions', () => {
        const token = {
            id: '42',
            uri: 'https://discord.com/something/video.webm'
        };

        const filename = generateVideoFilename(token, token.uri);
        expect(filename).toMatch(/\.webm$/);
    });

});
