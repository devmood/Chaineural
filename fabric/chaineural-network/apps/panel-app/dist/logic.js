'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
// === NODE JS LIBRARIES ===
var fs = require('fs');
var path = require('path');
// === HLF ===
var _a = require('fabric-network'), FileSystemWallet = _a.FileSystemWallet, Gateway = _a.Gateway, Wallet = _a.Wallet;
var FabricClient = require("fabric-client");
var FabricCAServices = require("fabric-ca-client");
var fabricCAClient = require('fabric-ca-client');
// === API ===
var helper = __importStar(require("./libs/helper"));
var channel = __importStar(require("./libs/channel"));
var chaincode = __importStar(require("./libs/chaincode"));
var akkaService = __importStar(require("./services/akka.service"));
var contractEventService = __importStar(require("./services/contract-event-service"));
var logger = helper.getLogger('Logic');
var Logic = /** @class */ (function () {
    function Logic() {
        this.peer = '';
        this.fabricCAClients = [];
        helper.init();
        contractEventService.start('mainchannel', 'chaineuralcc', ['InitEpochsLedgerEvent', 'InitMinibatchEvent', 'FinishMinibatchEvent', 'FinalMinibatchEvent', 'EpochIsValidEvent']);
        this.client = helper.getClientWithLoadedCommonProfile();
        for (var _i = 0, _a = this.getAllCertificateAuthoritiesUrls(); _i < _a.length; _i++) {
            var caClientUrl = _a[_i];
            this.fabricCAClients.push(new FabricCAServices(caClientUrl));
        }
    }
    ;
    Logic.prototype.getAllAnchorPeersObjects = function () {
        var configObj = helper.getConfigObject();
        var peers = [];
        for (var _i = 0, _a = Object.keys(configObj.peers); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            peers.push(this.client.getPeer(name_1));
        }
        return peers;
    };
    ;
    Logic.prototype.getAllCertificateAuthoritiesUrls = function () {
        var configObj = helper.getConfigObject();
        var ca = [];
        for (var _i = 0, _a = Object.values(configObj.certificateAuthorities); _i < _a.length; _i++) {
            var value = _a[_i];
            ca.push(value.url);
        }
        return ca;
    };
    ;
    Logic.prototype.getAllOrgsMspids = function () {
        var configObj = helper.getConfigObject();
        var orgsMspids = [];
        for (var _i = 0, _a = Object.values(configObj.organizations); _i < _a.length; _i++) {
            var orgValue = _a[_i];
            orgsMspids.push(orgValue.mspid);
        }
        return orgsMspids;
    };
    ;
    Logic.prototype.getAllPeers = function () {
        var peers = [];
        var allOrgsMspids = this.getAllOrgsMspids();
        for (var _i = 0, allOrgsMspids_1 = allOrgsMspids; _i < allOrgsMspids_1.length; _i++) {
            var orgMspid = allOrgsMspids_1[_i];
            var peersForOrg = this.client.getPeersForOrg(orgMspid);
            peers = peers.concat(peersForOrg);
        }
        return peers;
    };
    Logic.prototype.getAllChannels = function () {
        return helper.getAllChannels();
    };
    Logic.prototype.getPeerForChannel = function (channelName) {
        return this.getAllPeers().map(function (a) { return a.getName(); });
    };
    Logic.prototype.getAdminCredentialsForOrg = function (mspid) {
        var configObj = helper.getConfigObject();
        var credentials = ['', ''];
        for (var _i = 0, _a = Object.values(configObj.organizations); _i < _a.length; _i++) {
            var orgValue = _a[_i];
            if (orgValue.mspid == mspid) {
                var adminPrivateKey = fs.readFileSync(path.join(orgValue.adminPrivateKey.path));
                var adminCert = fs.readFileSync(path.join(orgValue.signedCert.path));
                credentials = [adminPrivateKey, adminCert];
                break;
            }
        }
        return credentials;
    };
    Logic.prototype.getChannelsBlockchainInfo = function (channels) {
        return __awaiter(this, void 0, void 0, function () {
            var allChannels, map, _i, channels_1, channel_1, _a, _b, channelPeer, channelMspId, namesForMspid, channelExistsInMap, adminCredentials;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        allChannels = [];
                        map = new Map();
                        //                 KEY     ADM KEY, ADM CERT, CHANNELS
                        for (_i = 0, channels_1 = channels; _i < channels_1.length; _i++) {
                            channel_1 = channels_1[_i];
                            for (_a = 0, _b = channel_1.getChannelPeers(); _a < _b.length; _a++) {
                                channelPeer = _b[_a];
                                channelMspId = channelPeer.getMspid();
                                namesForMspid = map.get(channelMspId);
                                if (namesForMspid != undefined) {
                                    namesForMspid[1].push(channel_1);
                                    allChannels.push(channel_1);
                                }
                                else {
                                    channelExistsInMap = allChannels.includes(channel_1);
                                    if (!channelExistsInMap) {
                                        adminCredentials = this.getAdminCredentialsForOrg(channelMspId);
                                        map.set(channelMspId, [adminCredentials, [channel_1]]);
                                        allChannels.push(channel_1);
                                    }
                                }
                            }
                        }
                        return [4 /*yield*/, map.forEach(function (value, key) { return __awaiter(_this, void 0, void 0, function () {
                                var _i, _a, channel_2, blockchainInfo;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _i = 0, _a = value[1];
                                            _b.label = 1;
                                        case 1:
                                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                                            channel_2 = _a[_i];
                                            this.client.setAdminSigningIdentity(value[0][0], value[0][1], key);
                                            return [4 /*yield*/, channel_2.queryInfo(undefined, true)];
                                        case 2:
                                            blockchainInfo = _b.sent();
                                            _b.label = 3;
                                        case 3:
                                            _i++;
                                            return [3 /*break*/, 1];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Logic.prototype.getChannelBlocksHashes = function (channelName, amount, peer, userOrg) {
        return __awaiter(this, void 0, void 0, function () {
            var channel_3, peerObj, mspid, adminCredentials, blocksHashes, blockchainInfo, i, block, blockHash, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, this.client.getChannel(channelName)];
                    case 1:
                        channel_3 = _a.sent();
                        peerObj = helper.getChannelForOrg(userOrg).getPeer(peer).getPeer();
                        mspid = helper.getMspID(userOrg);
                        adminCredentials = this.getAdminCredentialsForOrg(mspid);
                        this.client.setAdminSigningIdentity(adminCredentials[0], adminCredentials[1], mspid);
                        blocksHashes = [];
                        return [4 /*yield*/, channel_3.queryInfo(undefined, true)];
                    case 2:
                        blockchainInfo = _a.sent();
                        blocksHashes.push({ hash: blockchainInfo.currentBlockHash.toString('hex'), number: blockchainInfo.height.low });
                        i = blockchainInfo.height.low - 1;
                        _a.label = 3;
                    case 3:
                        if (!(i >= 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, channel_3.queryBlock(i, peerObj, true, false)];
                    case 4:
                        block = _a.sent();
                        blockHash = block.header.previous_hash.toString('hex');
                        if (blockHash !== '') {
                            blocksHashes.push({ hash: blockHash, number: i });
                        }
                        if (blocksHashes.length === amount) {
                            return [3 /*break*/, 6];
                        }
                        _a.label = 5;
                    case 5:
                        i--;
                        return [3 /*break*/, 3];
                    case 6: 
                    // blocksHashes = blocksHashes.reverse();
                    return [2 /*return*/, blocksHashes.slice(0, 16).reverse()];
                    case 7:
                        e_1 = _a.sent();
                        console.error(e_1);
                        return [2 /*return*/, []];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    Logic.prototype.getChannelAnchorPeers = function (channelName) {
        return __awaiter(this, void 0, void 0, function () {
            var channel_4, channelPeers, peersOrg, i, peerOrg, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.getChannel(channelName)];
                    case 1:
                        channel_4 = _a.sent();
                        channelPeers = channel_4.getChannelPeers();
                        peersOrg = [];
                        for (i = 0; i < channelPeers.length; i++) {
                            peerOrg = {
                                id: i + 1,
                                name: channelPeers[i].getName(),
                                endpoint: channelPeers[i].getUrl(),
                                org: channelPeers[i].getMspid()
                            };
                            peersOrg.push(peerOrg);
                        }
                        return [2 /*return*/, peersOrg];
                    case 2:
                        e_2 = _a.sent();
                        console.error(e_2);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Logic.prototype.getChannelConnections = function (channelName) {
        return __awaiter(this, void 0, void 0, function () {
            var channel_5, channelPeers, allOrgs, _i, channelPeers_1, channelPeer, adminCredentials, request, queryPeer, orgsDict, _a, _b, _c, mspId, value, count, array, values, indexesToMove_1, i, _loop_1, _d, values_1, item, anchorPeers, currentConnections, links, _e, anchorPeers_1, peer, _f, anchorPeers_2, peer1, link, _g, allOrgs_1, org, peers, _h, peers_1, peer, _j, peers_2, peer1, link, nodess, _k, allOrgs_2, org, peers, graph, e_3;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0:
                        _l.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, this.client.getChannel(channelName)];
                    case 1:
                        channel_5 = _l.sent();
                        channelPeers = channel_5.getChannelPeers();
                        allOrgs = [];
                        _i = 0, channelPeers_1 = channelPeers;
                        _l.label = 2;
                    case 2:
                        if (!(_i < channelPeers_1.length)) return [3 /*break*/, 5];
                        channelPeer = channelPeers_1[_i];
                        adminCredentials = this.getAdminCredentialsForOrg(channelPeer.getMspid());
                        this.client.setAdminSigningIdentity(adminCredentials[0], adminCredentials[1], channelPeer.getMspid());
                        request = {
                            target: channelPeer.getPeer(),
                            useAdmin: true
                        };
                        return [4 /*yield*/, this.client.queryPeers(request)];
                    case 3:
                        queryPeer = _l.sent();
                        orgsDict = queryPeer.local_peers;
                        for (_a = 0, _b = Object.entries(orgsDict); _a < _b.length; _a++) {
                            _c = _b[_a], mspId = _c[0], value = _c[1];
                            allOrgs.push({ mspId: mspId, value: value });
                        }
                        _l.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        count = 0;
                        array = [];
                        values = allOrgs.map(function (a, index) { return ({ 'length': a.value.peers.length, 'index': index, 'mspid': a.mspId }); });
                        indexesToMove_1 = [];
                        i = 0;
                        _loop_1 = function (item) {
                            var mspids = values.filter(function (a) { return a.mspid == item.mspid; });
                            if (mspids.length > channelPeers.length - 1) {
                                var max = mspids.reduce(function (prev, current) { return (prev.length > current.length) ? prev : current; });
                                if (!indexesToMove_1.includes(max.index))
                                    indexesToMove_1.push(max.index);
                            }
                        };
                        for (_d = 0, values_1 = values; _d < values_1.length; _d++) {
                            item = values_1[_d];
                            _loop_1(item);
                        }
                        allOrgs = allOrgs.filter(function (a, index) { return indexesToMove_1.includes(index); });
                        return [4 /*yield*/, this.getChannelAnchorPeers(channelName)];
                    case 6:
                        anchorPeers = _l.sent();
                        currentConnections = [];
                        links = [];
                        for (_e = 0, anchorPeers_1 = anchorPeers; _e < anchorPeers_1.length; _e++) {
                            peer = anchorPeers_1[_e];
                            for (_f = 0, anchorPeers_2 = anchorPeers; _f < anchorPeers_2.length; _f++) {
                                peer1 = anchorPeers_2[_f];
                                if (peer != peer1 && !currentConnections.includes([peer1.name, peer.name])) {
                                    link = {
                                        id: this.makeRandomString(),
                                        source: peer1.name,
                                        target: peer.name,
                                        label: channelName
                                    };
                                    links.push(link);
                                    currentConnections.push([link.source, link.target]);
                                    currentConnections.push([link.target, link.source]);
                                }
                                ;
                            }
                            ;
                        }
                        ;
                        for (_g = 0, allOrgs_1 = allOrgs; _g < allOrgs_1.length; _g++) {
                            org = allOrgs_1[_g];
                            peers = org.value.peers;
                            for (_h = 0, peers_1 = peers; _h < peers_1.length; _h++) {
                                peer = peers_1[_h];
                                for (_j = 0, peers_2 = peers; _j < peers_2.length; _j++) {
                                    peer1 = peers_2[_j];
                                    if (peer != peer1
                                        && !currentConnections.includes([peer1.endpoint.substr(0, peer1.endpoint.indexOf(':')), peer.endpoint.substr(0, peer.endpoint.indexOf(':'))])
                                        && !currentConnections.includes([peer.endpoint.substr(0, peer.endpoint.indexOf(':')), peer1.endpoint.substr(0, peer1.endpoint.indexOf(':'))])) {
                                        link = {
                                            id: this.makeRandomString(),
                                            source: peer1.endpoint.substr(0, peer1.endpoint.indexOf(':')),
                                            target: peer.endpoint.substr(0, peer.endpoint.indexOf(':')),
                                            label: 'internal connection'
                                        };
                                        links.push(link);
                                        currentConnections.push([peer1.endpoint.substr(0, peer1.endpoint.indexOf(':')), peer.endpoint.substr(0, peer.endpoint.indexOf(':'))]);
                                    }
                                }
                            }
                        }
                        ;
                        nodess = [];
                        for (_k = 0, allOrgs_2 = allOrgs; _k < allOrgs_2.length; _k++) {
                            org = allOrgs_2[_k];
                            peers = org.value.peers.map(function (peer) { return ({
                                id: peer.endpoint.substr(0, peer.endpoint.indexOf(':')),
                                label: peer.endpoint.substr(0, peer.endpoint.indexOf(':'))
                            }); });
                            nodess = nodess.concat(peers);
                        }
                        graph = {
                            clusters: allOrgs.map(function (org) { return ({
                                id: org.mspId,
                                label: org.mspId,
                                childNodeIds: org.value.peers.map(function (peer) { return peer.endpoint.substr(0, peer.endpoint.indexOf(':')); })
                            }); }),
                            nodes: nodess,
                            links: links
                        };
                        return [2 /*return*/, graph];
                    case 7:
                        e_3 = _l.sent();
                        console.error(e_3);
                        return [2 /*return*/, []];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    Logic.prototype.getChannelInstantiatedChaincodes = function (channelName) {
        return __awaiter(this, void 0, void 0, function () {
            var channel_6, channelPeer, instantiatedChaincodes, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.client.getChannel(channelName)];
                    case 1:
                        channel_6 = _a.sent();
                        return [4 /*yield*/, channel_6.getChannelPeers()[0].getPeer()];
                    case 2:
                        channelPeer = _a.sent();
                        return [4 /*yield*/, channel_6.queryInstantiatedChaincodes(channelPeer, true)];
                    case 3:
                        instantiatedChaincodes = _a.sent();
                        return [2 /*return*/, { result: instantiatedChaincodes.chaincodes.length }];
                    case 4:
                        e_4 = _a.sent();
                        console.error(e_4);
                        return [2 /*return*/, { result: -1 }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Logic.prototype.getInstalledChaincodes = function (peer, type, org) {
        return __awaiter(this, void 0, void 0, function () {
            var users, username;
            return __generator(this, function (_a) {
                users = FabricClient.getConfigSetting('admins');
                username = users[0].username;
                return [2 /*return*/, chaincode.getInstalledChaincodes(peer, type, username, org)];
            });
        });
    };
    Logic.prototype.invokeChaincode = function (peerOrgPairs, channelName, chaincodeName, fcn, args, username, peer, fromOrg) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, channel.invokeChaincode(peerOrgPairs, channelName, chaincodeName, fcn, args, username, peer, fromOrg)];
            });
        });
    };
    Logic.prototype.queryEpochIsValid = function (epochName, peer, fromOrg) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, channel.queryChaincode(peer, 'mainchannel', 'chaineuralcc', [epochName], 'queryEpochIsValid', 'user1', fromOrg)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.toString()];
                }
            });
        });
    };
    Logic.prototype.startLearning = function (peer, trxnID, username, org, epochsCount, workersAmount, synchronizationHyperparameter, featuresSize, hiddenSize, outputSize, ETA) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, channel.getTransactionByID(peer, trxnID, username, org)];
                    case 1:
                        transaction = _a.sent();
                        return [4 /*yield*/, akkaService.startLearning(transaction, epochsCount, workersAmount, synchronizationHyperparameter, featuresSize, hiddenSize, outputSize, ETA)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Logic.prototype.getMinibatchAmount = function (minibatchSize) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, akkaService.getMinibatchAmount(minibatchSize)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Logic.prototype.getEpochAverages = function (epochName) {
        return __awaiter(this, void 0, void 0, function () {
            var allResults, org1Averages, _a, _b, _c, _d, org2Averages, _e, _f, _g, _h, org3Averages, _j, _k, _l, _m, org4Averages, _o, _p, _q, _r, sumLearningTime, avgLearningTimeAll, sumLoss, avgLossAll, result;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0:
                        allResults = [];
                        _b = (_a = JSON).parse;
                        _d = (_c = JSON).parse;
                        return [4 /*yield*/, channel.queryChaincode('peer1', 'mainchannel', 'chaineuralcc', [epochName, 'org1'], 'queryAverageTimeAndLoss', 'user1', 'org1')];
                    case 1:
                        org1Averages = _b.apply(_a, [_d.apply(_c, [_s.sent()])]);
                        allResults.push([parseFloat(org1Averages.avgLearningTime.toString()), parseFloat(org1Averages.avgLoss.toString())]);
                        _f = (_e = JSON).parse;
                        _h = (_g = JSON).parse;
                        return [4 /*yield*/, channel.queryChaincode('peer1', 'mainchannel', 'chaineuralcc', [epochName, 'org2'], 'queryAverageTimeAndLoss', 'user1', 'org2')];
                    case 2:
                        org2Averages = _f.apply(_e, [_h.apply(_g, [_s.sent()])]);
                        allResults.push([parseFloat(org2Averages.avgLearningTime.toString()), parseFloat(org2Averages.avgLoss.toString())]);
                        _k = (_j = JSON).parse;
                        _m = (_l = JSON).parse;
                        return [4 /*yield*/, channel.queryChaincode('peer1', 'mainchannel', 'chaineuralcc', [epochName, 'org3'], 'queryAverageTimeAndLoss', 'user1', 'org3')];
                    case 3:
                        org3Averages = _k.apply(_j, [_m.apply(_l, [_s.sent()])]);
                        allResults.push([parseFloat(org3Averages.avgLearningTime.toString()), parseFloat(org3Averages.avgLoss.toString())]);
                        _p = (_o = JSON).parse;
                        _r = (_q = JSON).parse;
                        return [4 /*yield*/, channel.queryChaincode('peer1', 'mainchannel', 'chaineuralcc', [epochName, 'org4'], 'queryAverageTimeAndLoss', 'user1', 'org4')];
                    case 4:
                        org4Averages = _p.apply(_o, [_r.apply(_q, [_s.sent()])]);
                        allResults.push([parseFloat(org4Averages.avgLearningTime.toString()), parseFloat(org4Averages.avgLoss.toString())]);
                        sumLearningTime = allResults.map(function (a) { return a[0]; }).reduce(function (a, b) { return a + b; }, 0);
                        avgLearningTimeAll = (sumLearningTime / allResults.length) || 0;
                        sumLoss = allResults.map(function (a) { return a[1]; }).reduce(function (a, b) { return a + b; }, 0);
                        avgLossAll = (sumLoss / allResults.length) || 0;
                        result = {
                            'avgLearningTime': avgLearningTimeAll,
                            'avgLoss': avgLossAll
                        };
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Logic.prototype.enrollAdminsOnAllCA = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, caClient, user, enrollment;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.client.initCredentialStores()];
                    case 1:
                        _b.sent();
                        _i = 0, _a = this.fabricCAClients;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                        caClient = _a[_i];
                        return [4 /*yield*/, this.client.getUserContext('admin', true)];
                    case 3:
                        user = _b.sent();
                        if (!user) return [3 /*break*/, 4];
                        console.log("Admin already exists");
                        return [2 /*return*/, this.client.setUserContext(user)];
                    case 4: return [4 /*yield*/, caClient.enroll({
                            enrollmentID: 'admin',
                            enrollmentSecret: 'adminpw',
                            attr_reqs: [
                                { name: "hf.Registrar.Roles", optional: false },
                                { name: "hf.Registrar.Attributes", optional: false }
                            ]
                        })];
                    case 5:
                        enrollment = _b.sent();
                        console.log('Successfully enrolled admin user "admin"');
                        _b.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    Logic.prototype.getAdminCreateIfNotExist = function () {
        return __awaiter(this, void 0, void 0, function () {
            var user, enrollment, createdUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.initCredentialStores()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.client.getUserContext('admin', true)];
                    case 2:
                        user = _a.sent();
                        if (!user) return [3 /*break*/, 3];
                        console.log("Admin already exists");
                        return [2 /*return*/, this.client.setUserContext(user)];
                    case 3: return [4 /*yield*/, fabricCAClient.enroll({
                            enrollmentID: 'admin',
                            enrollmentSecret: 'adminpw',
                            attr_reqs: [
                                { name: "hf.Registrar.Roles", optional: false },
                                { name: "hf.Registrar.Attributes", optional: false }
                            ]
                        })];
                    case 4:
                        enrollment = _a.sent();
                        console.log('Successfully enrolled admin user "admin"');
                        return [4 /*yield*/, this.client.createUser({
                                username: 'admin',
                                mspid: 'Org1MSP',
                                cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate },
                                skipPersistence: true
                            })];
                    case 5:
                        createdUser = _a.sent();
                        return [2 /*return*/, this.client.setUserContext(createdUser)];
                }
            });
        });
    };
    Logic.prototype.makeRandomString = function () {
        var outString = '';
        var inOptions = 'abcdefghijklmnopqrstuvwxyz';
        for (var i = 0; i < 32; i++) {
            outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
        }
        return outString;
    };
    return Logic;
}());
module.exports = Logic;
//# sourceMappingURL=logic.js.map