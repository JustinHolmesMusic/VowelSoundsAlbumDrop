import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { getProjectDirs } from './locations.js';
import { runPrimaryBuild } from './primary_builder.js';

// Check if SKIP_CHAIN_DATA is set
const skipChainData = process.env.SKIP_CHAIN_DATA;

await runPrimaryBuild(skipChainData);

// Pattern to match all HTML files recursively within the prebuilt directory
const templatesPattern = path.join(outputPrimaryDir, '**/*.html');

// Use glob to find matching files
const templateFiles = glob.sync(templatesPattern);

// Create HtmlWebpackPlugin instances
const htmlPluginInstances = templateFiles.map(templatePath => {
    // Compute the output filename by maintaining the relative directory structure
    // TODO: This is getting a little stretched - let's have a more explicit way to decide the output path.
    const relativePath = path.relative(outputPrimaryDir, templatePath);

    // TODO: This is a simply horrible way to decide which scripts to include.
    if (relativePath.startsWith('music/vowel-sounds')) {
        var chunks = ['vowel_sounds'];
    } else if (relativePath.startsWith('sign')) {
        var chunks = ['main', 'signing'];
    } else if (relativePath.startsWith('magichat')) {
        var chunks = ['main', 'magic_hat'];
    } else if (relativePath.startsWith('cryptograss/tools/add-live-set')) {
        var chunks = ['main', 'add_live_set'];
    } else if (relativePath.startsWith('cryptograss/bazaar/setstones')) {
        var chunks = ['main', 'strike_set_stone'];
    } else if (relativePath.startsWith('shows/')) {
        var chunks = ['main', 'strike_set_stone'];
    } else if (relativePath.startsWith('cryptograss/tools/generate_art')) {
        var chunks = ['main', 'shapes'];
    } else if (relativePath.startsWith('cryptograss/tools/add-show-for-stone-minting')) {
        var chunks = ['main', 'add_show_for_stone_minting'];
    } else if (relativePath.startsWith('cryptograss/tools/setstone-color-palette')) {
        var chunks = ['main', 'setstone_color_palette'];
    } else if (relativePath.startsWith('cryptograss/tools/sign-things')) {
        var chunks = ['main', 'signing'];
    } else if (relativePath.startsWith('blue-railroad-test')) {
        var chunks = ['main', 'blue_railroad'];
    } else {
        var chunks = ['main'];
    }

    return new HtmlWebpackPlugin({
        template: templatePath, // Path to the source template
        filename: relativePath, // Preserve the directory structure in the output
        inject: "body",
        chunks: chunks, // Only include the chunk for this template
    });
});


const common = {
    output: { path: outputjhcomDistDir },
    plugins: [
        // Copy the .htaccess.
        // Copy assets and such.
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(outputPrimaryDir, 'assets'),
                    to: path.resolve(outputjhcomDistDir, 'assets')
                },
                {
                    from: path.resolve(outputPrimaryDir, 'setstones'),
                    to: path.resolve(outputjhcomDistDir, 'setstones')
                },

                // TODO: Design decision on client partials.
                {
                    from: path.resolve(outputPrimaryDir, 'client_partials'),
                    to: path.resolve(outputjhcomDistDir, 'partials')
                },
                {
                    from: 'src/fetched_assets',
                    to: 'assets',
                    globOptions: {
                        dot: true,
                        gitignore: true,
                        ignore: ['**/.gitkeep', '**/.DS_Store'],
                    },
                    noErrorOnMissing: true  // Won't error if directory is empty/missing
                },
            ]
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
        }),
        ...htmlPluginInstances,
    ],

    entry: {
        main: './src/js/index.js',
        vowel_sounds: './src/js/vowel_sounds.js',
        help: './src/js/help.js',
        signing: './src/js/jhmusic_signing.js',
        magic_hat: './src/js/magic_hat.js',
        // strike_set_stone: './src/js/shapes.js',
        strike_set_stone: './src/js/cryptograss/bazaar/strike_set_stones.js',
        add_live_set: './src/js/cryptograss/tools/add_live_set.js',
        add_show_for_stone_minting: './src/js/cryptograss/tools/add_show_for_stone_minting.js',
        shapes: './src/js/shapes.js',
        blue_railroad: './src/js/cryptograss/bazaar/blue_railroad.js',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
        ]
    },
};

export default common;