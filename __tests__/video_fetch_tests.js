import { jest } from '@jest/globals';
import { Collection } from 'discord.js';

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
jest.unstable_mockModule('discord.js', () => ({
    Client: jest.fn(() => mockClient),
    GatewayIntentBits: {
        MessageContent: 1,
        Guilds: 2,
        GuildMessages: 3
    }
}));

// Import the functions we want to test
let generateVideoMetadata;
beforeAll(async () => {
    const module = await import('../src/build_logic/discord_video_fetcher.js');
    generateVideoMetadata = module.generateVideoMetadata;
});

describe('Discord Video Metadata Generator', () => {
    test('generates metadata for discord video url', async () => {
        const testUrl = 'https://discord.com/channels/server/channel/message';
        const metadata = await generateVideoMetadata([testUrl]);

        expect(metadata).toHaveLength(1);
        expect(metadata[0]).toEqual(expect.objectContaining({
            originalUrl: testUrl,
            discordUrl: expect.any(String),
            fileName: expect.stringMatching(/\.mp4$/),
            timestamp: expect.any(Number),
            contentType: expect.stringMatching(/^video\//)
        }));
    });
});
