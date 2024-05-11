const fs = require('fs');
const path = require('path');
const axios = require('axios');
const decompress = require('decompress');

const fetchTStore = (namespace, name) =>
    axios.get(`https://thunderstore.io/api/experimental/package/${namespace}/${name}/`).then(response => ({
        version: response.data.latest.version_number,
        download_url: response.data.latest.download_url
    }))

const update = (download_url, newFolder) =>
    download(download_url, "temp.zip").then(() => decompress("temp.zip", newFolder));

async function download(url, dest) {
    const writer = fs.createWriteStream(dest);
    const response = await axios({ url, responseType: 'stream' });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

function fetchUpdate(dir) {
    // read directory
    fs.readdirSync(dir, { withFileTypes: true })
        .filter((file) => file.isDirectory())
        .map(dir => { // deconstruct all plugin names and versions
            const [namespace, name, version] = dir.name.split("-")
            return { namespace, name, version }
        })
        .forEach(plugin => fetchTStore(plugin.namespace, plugin.name).then(data => {
            if (data.version == plugin.version) return
            const oldFolder = path.join(dir, `${plugin.namespace}-${plugin.name}-${plugin.version}`)
            const newFolder = path.join(dir, `${plugin.namespace}-${plugin.name}-${data.version}`);
            update(data.download_url, newFolder);
            // remove old version
            fs.rmSync(oldFolder, { recursive: true });
            console.log(`Updated ${plugin.name} from ${plugin.version} to ${data.version}`);
        }));
}

fetchUpdate(process.env.DIR || "/plugins");
