console.time('primary-build');

import {outputBaseDir, templateDir, pageBaseDir} from "./constants.js";
import Handlebars from 'handlebars';
import fs from 'fs';
import * as glob from 'glob';
import yaml from 'js-yaml';
import path from 'path';
import {songs, shows, songsByProvenance} from "./show_and_set_data.js";
import {marked} from 'marked';
import {gatherAssets, unusedImages} from './asset_builder.js';
import {deserializeChainData, serializeChainData} from './chaindata_db.js';
import {execSync} from 'child_process';
import {generateSetStonePages, renderSetStoneImages} from './setstone_utils.js';
import {registerHelpers} from './utils/template_helpers.js';
import {appendChainDataToShows, fetch_chaindata} from './chain_reading.js';

/////////////////////////
///// Chapter one: chain data (also triggers show processing).
////////////////////////////
console.time("chain-data");
const skip_chain_data_fetch = process.env.SKIP_CHAIN_DATA_FETCH
if (skip_chain_data_fetch) {
    console.log("Skipping chain data generation");
} else {
    const fetchedchainData = await fetch_chaindata(shows);
    serializeChainData(fetchedchainData);
}

let chainData

try {
    chainData = deserializeChainData();
} catch (e) {
    // If the error is that the directory wasn't found, make a suggestion.
    if (e.code === 'ENOENT' && skip_chain_data_fetch) {
        throw new Error("Chain data not found, and you're running with 'skip_chain_data_fetch'. You probably need to fetch chain data.");
    } else {
        throw e;
    }
}

console.timeEnd("chain-data");

//////////////////////////////////
///// Chapter two: assets
//////////////////////////////////

console.time('asset-gathering');
gatherAssets();

function getImageMapping() {
    const mappingFilePath = path.join(outputBaseDir, 'imageMapping.json');
    const jsonData = fs.readFileSync(mappingFilePath, {encoding: 'utf8'});
    return JSON.parse(jsonData);
}

// When preparing context for Handlebars
const imageMapping = getImageMapping();
console.timeEnd('asset-gathering');


// Check if the directory exists, if not, create it
if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, {recursive: true});
}


////////////////////////////////////////////////
///// Chapter three: One-off Pages
/////////////////////////////////////////////
console.time('pages-yaml-read');

////////
/// Chapter 3.1: Register helpers, partials, and context
//////

// We'll need helpers....
registerHelpers();

// ...and processed context...
appendChainDataToShows(shows, chainData); // Mutates shows.
const dataAvailableAsContext = {
    "songs": songs,
    "shows": shows,
    'songsByProvenance': songsByProvenance
};

// ...and partial templates.
// Register Partials
const partialsDir = path.resolve(templateDir, 'partials');
const partialFiles = glob.sync(`${partialsDir}/*.hbs`);
partialFiles.forEach(partialPath => {
    const partialName = path.relative(partialsDir, partialPath).replace(/\.hbs$/, '');
    const partialTemplate = fs.readFileSync(partialPath, 'utf8');
    Handlebars.registerPartial(partialName, partialTemplate);
});

// Copy client-side partials to the output directory
fs.cpSync(path.join(templateDir, 'client_partials'), path.join(outputBaseDir, 'partials'), {recursive: true});


////////////////////
// Chapter 3.2: Render one-off pages from YAML
///////////////////////

let pageyamlFile = fs.readFileSync("src/data/pages.yaml");
let pageyaml = yaml.load(pageyamlFile);

let contextFromPageSpecificFiles = {};
Object.keys(pageyaml).forEach(page => {
    let pageInfo = pageyaml[page];
    let templateName = pageInfo["template"];
    let hbsTemplate = path.join(pageBaseDir, templateName);
    const outputFilePath = path.join(outputBaseDir, templateName).replace(/\.hbs$/, '.html');

    // See if there is a directory in data/page_specifc for this page.
    const pageSpecificDataPath = `src/data/page_specific/${page}`;
    if (fs.existsSync(pageSpecificDataPath)) {
        // Add an entry to the context for this page.
        contextFromPageSpecificFiles[page] = {};

        // Iterate through files in this directory.
        const pageSpecificFiles = fs.readdirSync(pageSpecificDataPath);

        pageSpecificFiles.forEach(file => {
            const fileContents = fs.readFileSync(path.join(pageSpecificDataPath, file), 'utf8');

            // If it's markdown, render it with marked.
            if (file.endsWith('.md')) {
                contextFromPageSpecificFiles[page][file.replace(/\.md$/, '')] = marked(fileContents);
            }
            // If it's yaml, load it as yaml.
            if (file.endsWith('.yaml')) {
                contextFromPageSpecificFiles[page][file.replace(/\.yaml$/, '')] = yaml.load(fileContents);
            }
            // TODO: Handle failure case if there are two files with the same name but different extensions.

        });
    }

    // Ensure the full output path, including subdirs, exists for this particular page.
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }

    // Load and compile the template
    const templateSource = fs.readFileSync(hbsTemplate, 'utf8');
    const template = Handlebars.compile(templateSource);

    let specified_context;

    if (pageInfo['context_from_yaml'] === true) {
        // Load specified context from yaml
        let yaml_for_this_page = fs.readFileSync(`src/data/${page}.yaml`);
        specified_context = {[page]: yaml.load(yaml_for_this_page)};
    } else {
        specified_context = {};
    }

    if (pageInfo['include_chaindata_as_context'] !== undefined) {
        for (let chainDataSection of pageInfo['include_chaindata_as_context']) {
            specified_context[chainDataSection] = chainData[chainDataSection];
        }
    }

    if (pageInfo['include_data_in_context'] !== undefined) {
        for (let dataSection of pageInfo['include_data_in_context']) {
            let dataSectionToInclude = dataAvailableAsContext[dataSection];
            if (dataSectionToInclude === undefined) {
                throw new Error(`Data section ${dataSection} requested for page ${page} but not found in dataAvailableAsContext.`);
            }
            specified_context[dataSection] = dataSectionToInclude;
        }
    }

    let context = {
        page_name: page,
        ...pageInfo['context'],
        ...specified_context,
        imageMapping,
        chainData,
    };

    if (contextFromPageSpecificFiles[page]) {
        context = Object.assign({}, context, contextFromPageSpecificFiles[page])
    }

    // Render the template with context (implement getContextForTemplate as needed)
    const mainBlockContent = template(context);

    let baseTemplateName = pageInfo["base_template"];
    if (baseTemplateName === undefined) {
        baseTemplateName = 'base.hbs';
    }
    const baseTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'layouts', baseTemplateName), 'utf8'));

    let rendered_page = baseTemplate({...context, main_block: mainBlockContent})

    // Write the rendered HTML to the output file path
    fs.writeFileSync(outputFilePath, rendered_page);
});

console.timeEnd('pages-yaml-read');

///////////////////////////////////////////
// Chapter 4: Factory pages (individual shows, songs, etc)  and JSON files
/////////////////////////////////////////////

// Render things that we'll need later.
generateSetStonePages(chainData.showsWithChainData, path.resolve(outputBaseDir, 'setstones'));
renderSetStoneImages(chainData.showsWithChainData, path.resolve(outputBaseDir, 'assets/images/setstones'));

//////////////////////
// Chapter 4.1: Show pages
////////////////////

Object.entries(shows).forEach(([show_id, show]) => {
    const page = `show_${show_id}`;
    const outputFilePath = path.join(outputBaseDir, `shows/${show_id}.html`);

    const hbsTemplate = path.join(templateDir, 'reuse/single-show.hbs');

    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }

    // Load and compile the template
    const templateSource = fs.readFileSync(hbsTemplate, 'utf8');
    const template = Handlebars.compile(templateSource);

    let context = {
        page_name: page,
        page_title: show.title,
        show,
        imageMapping,
        chainData,
    };

    // console.log(context);

    // Add latest git commit to context.
    context['_latest_git_commit'] = execSync('git rev-parse HEAD').toString().trim();

    // Render the template with context
    const mainBlockContent = template(context);

    const baseTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'layouts', 'base.hbs'), 'utf8'));


    let rendered_page = baseTemplate({...context, main_block: mainBlockContent})

    // Write the rendered HTML to the output file path
    fs.writeFileSync(outputFilePath, rendered_page);
});

///////////////////////////
// Chapter 4.2: Song pages
///////////////////////////

Object.entries(songs).forEach(([song_slug, song]) => {
    const page = `song_${song_slug}`;
    const outputFilePath = path.join(outputBaseDir, `songs/${song_slug}.html`);

    const hbsTemplate = path.join(templateDir, 'reuse/single-song.hbs');

    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }

    // Load and compile the template
    const templateSource = fs.readFileSync(hbsTemplate, 'utf8');
    const template = Handlebars.compile(templateSource);

    let context = {
        page_name: page,
        page_title: song.title,
        shows: shows,
        song,
        imageMapping,
        chainData,
    };

    // Render the template with context
    const mainBlockContent = template(context);
    const baseTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'layouts', 'base.hbs'), 'utf8'));

    let rendered_page = baseTemplate({...context, main_block: mainBlockContent})

    // Write the rendered HTML to the output file path
    fs.writeFileSync(outputFilePath, rendered_page);
});


///////////////////////////
// Chapter 5: Cleanup
///////////////////////////

// Warn about each unused image.
unusedImages.forEach(image => {
    console.warn(`Image not used: ${image}`);
});

console.timeEnd('primary-build');
