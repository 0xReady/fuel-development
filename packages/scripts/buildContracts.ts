import { spawn } from 'child_process';
import config, { Config } from './config';
import { runTypeChain, glob } from 'typechain';

// Build contracts using forc
// We assume forc is install on the local
// if is not install it would result on
// throwing a error
export async function buildContract(path: string) {
  console.log('Build', path);
  return new Promise((resolve, reject) => {
    const forcBuild = spawn('forc', ['build', '-p', path], {
      stdio: 'inherit',
    });
    forcBuild.on('exit', code => {
      if (!code) return resolve(code);
      forcBuild.kill();
      reject();
    });
  });
}

// Generate types using typechain
// and typechain-target-fuels modules
export async function buildTypes(config: Config) {
  const cwd = process.cwd();
  // find all files matching the glob
  const allFiles = glob(cwd, [config.types.artifacts]);
  await runTypeChain({
    cwd,
    filesToProcess: allFiles,
    allFiles,
    outDir: config.types.output,
    target: 'fuels',
  });
}

export async function buildContracts(config: Config) {
  for (const { path } of config.contracts) {
    await buildContract(path);
  }
  await buildTypes(config);
}

buildContracts(config);
