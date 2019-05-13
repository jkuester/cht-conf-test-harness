const fs = require('fs');
const path = require('path');

const usage = `Usage: build-assets --path=[DIRECTORY]
  
Builds the content of a project folder for user in project explorer.
  --path         path to the medic project folder
  --output       path where the built assets will be written (optional)
`;

const argv = require('minimist')(process.argv.slice(2));
const { path: pathToProject } = argv;

if (!pathToProject) {
  console.error(usage);
  return -1;
}

if (!fs.existsSync(pathToProject)) {
  console.error(`Could not locate project folder at: ${path.resolve(pathToProject)}`);
  return -1;
}

const outputPath = argv['output'] || path.resolve(__dirname, '../dist', 'project-assets.js');
console.log(`Building assets from project in ${pathToProject}`);

const formsInDirectory = [
    pathToProject,
    path.join(pathToProject, 'forms'),
    path.join(pathToProject, 'forms/app'),
    path.join(pathToProject, 'forms/contact'),
  ]
  .reduce((agg, curr) => [...agg, ...fs.readdirSync(curr).map(file => path.join(curr, file))], [])
  .filter(f => f.endsWith('.xml'));

if (formsInDirectory.length === 0) {
  console.warn(`No xml files found in folder: ${pathToProject}`);
  return -1;
}

const data = formsInDirectory
  .map(fullPath => `  '${path.basename(fullPath)}': require('${fullPath}'),`)
  .join('\n');
fs.writeFileSync(outputPath, `module.exports = {
  ${data}
};`);
console.log(`Compiling to ${outputPath}`);
