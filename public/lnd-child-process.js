const os = require('os');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function getProcessName(binName) {
  const filename = os.platform() === 'win32' ? `${binName}.exe` : binName;
  const filePath = __dirname.includes('asar')
    ? path.join(__dirname, '..', '..', 'assets', 'bin', os.platform(), filename)
    : path.join(__dirname, '..', 'assets', 'bin', os.platform(), filename);
  return fs.existsSync(filePath) ? filePath : filename;
}

function startChildProcess(name, args, logger) {
  console.log(`starting child process: ${name}`)
  const processName = getProcessName(name);
  logger.info(`Using ${name} in path ${processName}`);
  const childProcess = cp.spawn(processName, args, {
    detached: true,
    stdio: 'ignore',
  });
  childProcess.unref();
  childProcess.on('error', err =>
    console.log(`Errored in child process: ${err}`)
  );
  return childProcess;
}

function startBlockingProcess(name, args, logger) {
  return new Promise((resolve, reject) => {
    const processName = getProcessName(name);
    logger.info(`Using ${name} in path ${processName}`);
    const childProcess = cp.spawn(processName, args);
    childProcess.stdout.on('data', data => {
      logger.info(`${name}: ${data}`);
    });
    childProcess.stderr.on('data', data => {
      logger.error(`${name} Error: ${data}`);
      reject(new Error(data));
    });
    childProcess.on('exit', resolve);
    childProcess.on('error', reject);
  });
}

module.exports.startLndProcess = function({
  isDev,
  lndSettingsDir,
  lndPort,
  lndPeerPort,
  logger,
  lndRestPort,
  lndProfilingPort,
  lndArgs = [],
}) {
  if (!lndSettingsDir) throw new Error('lndSettingsDir not set!');
  const processName = 'lnd';
  let args = [
    '--bitcoin.active',
    '--debuglevel=debug',
    `--lnddir=${lndSettingsDir}`,
    `--routing.assumechanvalid`,
    '--autopilot.private',
    '--autopilot.minconfs=0',
    '--autopilot.allocation=0.95',
    '--autopilot.heuristic=externalscore:1',
    '--autopilot.heuristic=preferential:0',
    lndPort ? `--rpclisten=localhost:${lndPort}` : '',
    lndPeerPort ? `--listen=localhost:${lndPeerPort}` : '',
    lndRestPort ? `--restlisten=localhost:${lndRestPort}` : '',
    lndProfilingPort ? `--profile=${lndProfilingPort}` : '',
  ];
  // set development or production settings
  if (isDev) {
    args = args.concat([
      '--bitcoin.simnet',
      '--bitcoin.node=neutrino',
      '--neutrino.connect=127.0.0.1:18555',
    ]);
  }
  // set default production settings if no custom flags
  if (!isDev && !lndArgs.length) {
    args = args.concat([
      '--bitcoin.testnet',
      '--bitcoin.node=neutrino',
      '--neutrino.connect=btcd-testnet.lightning.computer',
    ]);
  }
  args = args.concat(lndArgs);
  return startChildProcess(processName, args, logger);
};

module.exports.startBtcdProcess = function({
  isDev,
  logger,
  btcdSettingsDir,
  miningAddress,
}) {
  if (!isDev) return; // don't start btcd if neutrino is used
  const processName = 'btcd';
  const args = [
    '--simnet',
    '--txindex',
    '--rpcuser=kek',
    '--rpcpass=kek',
    btcdSettingsDir ? `--datadir=${path.join(btcdSettingsDir, 'data')}` : '',
    btcdSettingsDir ? `--logdir=${path.join(btcdSettingsDir, 'logs')}` : '',
    miningAddress ? `--miningaddr=${miningAddress}` : '',
  ];
  return startChildProcess(processName, args, logger);
};

module.exports.mineBlocks = async function({ blocks, logger }) {
  const processName = 'btcctl';
  const args = [
    '--simnet',
    '--rpcuser=kek',
    '--rpcpass=kek',
    'generate',
    String(blocks),
  ];
  return startBlockingProcess(processName, args, logger);
};
