import { fileURLToPath } from "url";
import path from "path";

let projectDirs = {
    initialized: false,
    site: null
};

export function initProjectDirs(site_name) {
    // Prevent multiple initializations
    if (projectDirs.initialized) {
        if (projectDirs.site !== site_name) {
            throw new Error(`Project directories already initialized for ${projectDirs.site}, cannot reinitialize for ${site_name}`);
        }
        return projectDirs; // Return existing if already initialized for same site
    }

    const __filename = fileURLToPath(import.meta.url);
    projectDirs.srcDir = path.resolve(__filename, '../..');
    projectDirs.projectRootDir = path.resolve(projectDirs.srcDir, '..');
    projectDirs.siteDir = path.resolve(projectDirs.srcDir, 'sites', site_name);

    // Templates directories 
    projectDirs.templateDir = path.resolve(projectDirs.siteDir, 'templates');

    // Data directories
    projectDirs.dataDir = path.resolve(projectDirs.srcDir, 'data');
    projectDirs.showsDir = path.resolve(projectDirs.dataDir, 'shows');
    projectDirs.imagesSourceDir = path.join(projectDirs.srcDir, 'images');
    projectDirs.fetchedAssetsDir = path.join(projectDirs.srcDir, 'fetched_assets');

    // Output directories
    projectDirs.outputBaseDir = path.resolve(projectDirs.projectRootDir, 'output');

    projectDirs.outputDistDir = path.resolve(projectDirs.outputBaseDir, site_name + '.dist');

    projectDirs.outputPrimaryRootDir = path.resolve(projectDirs.outputBaseDir, '_prebuild_output');

    projectDirs.outputPrimarySiteDir = path.resolve(projectDirs.outputPrimaryRootDir, site_name);

    projectDirs.chainDataDir = path.resolve(projectDirs.outputBaseDir, '_prebuild_chain_data');

    projectDirs.initialized = true;
    projectDirs.site = site_name;

    projectDirs.cryptograssUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:4050'
        : 'https://cryptograss.live';

    return projectDirs;
}

export function getProjectDirs() {
    if (!projectDirs.initialized) {
        throw new Error("Project directories not initialized. Call initProjectDirs first.");
    }
    return projectDirs;
}
