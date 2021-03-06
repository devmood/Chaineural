import log4js = require('log4js');
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import * as yaml from 'js-yaml';
import config from '../config';
import FabricClient = require('fabric-client');
import Client = require('fabric-client');
// tslint:disable-next-line:no-var-requires
const copService = require('fabric-ca-client');

const logger = log4js.getLogger('Helper');
logger.setLevel('DEBUG');
FabricClient.setLogger(logger);
let ORGS: any;
const clients = {};
const channels = new Map;
const caClients = {};
//common connection profile
let commonConnectionProfilePath: any;
let startBlockNum: any;

function getBlockFromSomewhere() {
    return startBlockNum;
}

function storeBlockNumForLater(block_num) {
    startBlockNum = block_num;
}

function readAllFiles(dir: string) {
    const files = fs.readdirSync(dir);
    const certs: any = [];
    files.forEach((fileName) => {
        const filePath = path.join(dir, fileName);
        const data = fs.readFileSync(filePath);
        certs.push(data);
    });
    return certs;
}

function getKeyStoreForOrg(org: string) {
    return FabricClient.getConfigSetting('keyValueStore') + '_' + org;
}

function setupPeers(channel: any, org: string, client: Client) {
    for (const key in ORGS[org].peers) {
        if (key) {
            const data = fs.readFileSync(
                path.join(__dirname, ORGS[org].peers[key]['tls_cacerts']));
            const peer = client.newPeer(
                ORGS[org].peers[key].requests,
                {
                    'pem': Buffer.from(data).toString(),
                    'ssl-target-name-override': ORGS[org].peers[key]['server-hostname']
                }
            );
            peer.setName(key);

            channel.addPeer(peer);
        }
    }
}

function newOrderer(client: Client) {
    const caRootsPath = ORGS.orderer.tls_cacerts;
    const data = fs.readFileSync(path.join(__dirname, caRootsPath));
    const caroots = Buffer.from(data).toString();
    return client.newOrderer(ORGS.orderer.url, {
        'pem': caroots,
        'ssl-target-name-override': ORGS.orderer['server-hostname']
    });
}

function getOrgName(org: string) {
    return ORGS[org].name;
}

export function getMspID(org: string) {
    logger.debug('Msp ID : ' + ORGS[org].mspid);
    return ORGS[org].mspid;
}

function newRemotes(names: string[], forPeers: boolean, userOrg: string) {
    const client = getClientForOrg(userOrg);
    const channel = getChannelForOrg(userOrg);
    const targets: any[] = [];
    // find the peer that match the names
    names.forEach((n) => {
        if (ORGS[userOrg].peers[n]) {
            // found a peer matching the name
            const data = fs.readFileSync(
                path.join(__dirname, ORGS[userOrg].peers[n]['tls_cacerts']));
            const grpcOpts = {
                'pem': Buffer.from(data).toString(),
                'ssl-target-name-override': ORGS[userOrg].peers[n]['server-hostname']
            };

            const peer = client.newPeer(ORGS[userOrg].peers[n].requests, grpcOpts);
            if (forPeers) {
                targets.push(peer);
            } else {
                const eh = channel.newChannelEventHub(peer);
                targets.push(eh);
            }
        }
    });

    if (targets.length === 0) {
        logger.error(util.format('Failed to find peers matching the names %s', names));
    }

    return targets;
}

async function getAdminUser(userOrg: string): Promise<FabricClient.User> {
    const users = FabricClient.getConfigSetting('admins');
    const username = users[0].username;
    const password = users[0].secret;

    const client = getClientForOrg(userOrg);

    const store = await FabricClient.newDefaultKeyValueStore({
        path: getKeyStoreForOrg(getOrgName(userOrg))
    });
    client.setStateStore(store);

    const user = await client.getUserContext(username, true);

    if (user && user.isEnrolled()) {
        logger.info('Successfully loaded member from persistence');
        return user;
    }

    const caClient = caClients[userOrg];

    const enrollment = await caClient.enroll({
        enrollmentID: username,
        enrollmentSecret: password
    });

    logger.info('Successfully enrolled user \'' + username + '\'');
    const userOptions: FabricClient.UserOpts = {
        username,
        mspid: getMspID(userOrg),
        cryptoContent: {
            privateKeyPEM: enrollment.key.toBytes(),
            signedCertPEM: enrollment.certificate
        },
        skipPersistence: false
    };

    const member = await client.createUser(userOptions);
    return member;
}

export function newPeers(names: string[], org: string) {
    return newRemotes(names, true, org);
}

export function newEventHubs(names: string[], org: string) {
    return newRemotes(names, false, org);
}

export function setupChaincodeDeploy() {
    process.env.GOPATH = path.join(__dirname, FabricClient.getConfigSetting('CC_SRC_PATH'));
}

export function getOrgs() {
    return ORGS;
}

export function getClientForOrg(org: string): Client {
    return clients[org];
}

export function getChannelForOrg(org: string): FabricClient.Channel {
    return channels[org];
}

export function getAllChannels(): string[] {
    let channelsNames: string[] = [];
    for (let channel of Object.values(channels) as any) {
        var index = channelsNames.findIndex(x => x == channel.getName());
        if (index === -1) {
            channelsNames.push(channel.getName());
        }
    }
    return channelsNames;
}

commonConnectionProfilePath = path.join(__dirname, '../../config', 'common-connection-profile.yaml')
export function init() {
    FabricClient.addConfigFile(path.join(__dirname, '../../', config.networkConfigFile));
    FabricClient.addConfigFile(path.join(__dirname, '../../', 'app_config.json'));

    ORGS = FabricClient.getConfigSetting('network-config');
    logger.debug('Helper Init Function');
    // set up the client and channel objects for each org
    for (const key in ORGS) {
        if (key.indexOf('org') === 0) {
            const client = new FabricClient();

            const cryptoSuite = FabricClient.newCryptoSuite();
            // TODO: Fix it up as setCryptoKeyStore is only available for s/w impl
            (cryptoSuite as any).setCryptoKeyStore(
                FabricClient.newCryptoKeyStore({
                    path: getKeyStoreForOrg(ORGS[key].name)
                }));
            client.setCryptoSuite(cryptoSuite);

            const channel = client.newChannel(FabricClient.getConfigSetting('channelName'));
            channel.addOrderer(newOrderer(client));

            clients[key] = client;
            channels[key] = channel;

            setupPeers(channel, key, client);

            const caUrl = ORGS[key].ca;
            caClients[key] = new copService(
                caUrl, null /*defautl TLS opts*/, '' /* default CA */, cryptoSuite);
            createAffiliationIfNotExists(key);
        }
    }
}

export async function getRegisteredUsers(
    username: string, userOrg: string): Promise<FabricClient.User> {

    const client = getClientForOrg(userOrg);

    const store = await FabricClient.newDefaultKeyValueStore({
        path: getKeyStoreForOrg(getOrgName(userOrg))
    });

    client.setStateStore(store);
    const user = await client.getUserContext(username, true);


    if (user && user.isEnrolled()) {
        logger.info('Successfully loaded member from persistence');
        return user;
    }

    logger.info('Using admin to enroll this user ..');

    // get the Admin and use it to enroll the user
    const adminUser = await getAdminUser(userOrg);

    const caClient = caClients[userOrg];
    const secret = await caClient.register({
        enrollmentID: username,
        affiliation: userOrg + '.department1'
    }, adminUser);
    logger.debug(username + ' registered successfully');

    const message = await caClient.enroll({
        enrollmentID: username,
        enrollmentSecret: secret
    });

    if (message && typeof message === 'string' && message.includes(
        'Error:')) {
        logger.error(username + ' enrollment failed');
    }
    logger.debug(username + ' enrolled successfully');

    const userOptions: FabricClient.UserOpts = {
        username,
        mspid: getMspID(userOrg),
        cryptoContent: {
            privateKeyPEM: message.key.toBytes(),
            signedCertPEM: message.certificate
        },
        skipPersistence: false
    };

    const member = await client.createUser(userOptions);
    return member;
}

export function getLogger(moduleName: string) {
    const moduleLogger = log4js.getLogger(moduleName);
    moduleLogger.setLevel('DEBUG');
    return moduleLogger;
}

export async function createAffiliationIfNotExists(userOrg: string) {
    const client = getClientForOrg(userOrg);
    client.loadFromConfig(commonConnectionProfilePath);
    client.loadFromConfig(path.join(__dirname, '../../config', `${userOrg}.yaml`));
    const cryptoSuite = FabricClient.newCryptoSuite();


    
    if (userOrg) {
        (cryptoSuite as any).setCryptoKeyStore(
            FabricClient.newCryptoKeyStore({ path: getKeyStoreForOrg(getOrgName(userOrg)) }));
            client.setCryptoSuite(cryptoSuite);
        }
        let adminUserObj = await getAdminUser(userOrg);
        
        let caClient = client.getCertificateAuthority();
    let affiliationService = caClient.newAffiliationService();
    let registeredAffiliations = await affiliationService.getAll(adminUserObj) as any;
    if (!registeredAffiliations.result.affiliations.some(
        x => x.name == userOrg.toLowerCase())) {
        let affiliation = `${userOrg}.department1`;
        await affiliationService.create({
            name: affiliation,
            force: true
        }, adminUserObj);
    }
}

export async function getOrgAdmin(userOrg: string): Promise<FabricClient.User> {
    const admin = ORGS[userOrg].admin;
    const keyPath = path.join(__dirname, admin.key);
    const keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();
    const certPath = path.join(__dirname, admin.cert);
    const certPEM = readAllFiles(certPath)[0].toString();

    const client = getClientForOrg(userOrg);
    const cryptoSuite = FabricClient.newCryptoSuite();

    if (userOrg) {
        (cryptoSuite as any).setCryptoKeyStore(
            FabricClient.newCryptoKeyStore({ path: getKeyStoreForOrg(getOrgName(userOrg)) }));
        client.setCryptoSuite(cryptoSuite);
    }

    const store = await FabricClient.newDefaultKeyValueStore({
        path: getKeyStoreForOrg(getOrgName(userOrg))
    });

    client.setStateStore(store);

    return client.createUser({
        username: 'peer' + userOrg + 'Admin',
        mspid: getMspID(userOrg),
        cryptoContent: {
            privateKeyPEM: keyPEM,
            signedCertPEM: certPEM
        },
        skipPersistence: false
    });
}

export function getClientWithLoadedCommonProfile(org?: string) {
    let client = new FabricClient();
    client = FabricClient.loadFromConfig(commonConnectionProfilePath);

    // client
    if (org != null) {
        let clientConfig = path.join(__dirname, `../../config/${org}.yaml`)
        client.loadFromConfig(clientConfig);
    }
    client.initCredentialStores();
    return client;
}

export function getConfigObject() {
    const config = yaml.safeLoad(fs.readFileSync(commonConnectionProfilePath, 'utf8'));
    const configJson = JSON.stringify(config, null, 4);
    return JSON.parse(configJson);
}