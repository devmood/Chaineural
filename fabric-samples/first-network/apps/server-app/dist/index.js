"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var chaincodeApi = __importStar(require("./libs/chaincode"));
var channelApi = __importStar(require("./libs/channel"));
var helper = __importStar(require("./libs/helper"));
helper.init();
var peers = ['peer1'];
var chaincodeName = 'chaineuralcc';
var chaincodePath = '/../../../chaineural/typescript';
var chaincodeVersion = '1.0';
var channelName = 'mainchannel';
start();
function start() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // await installChaincodes();
                // await instantiateChaincode();
                // await queryListChaincode("instantiated");
                // await invokeChaincode();
                return [4 /*yield*/, queryChaincode()];
                case 1:
                    // await installChaincodes();
                    // await instantiateChaincode();
                    // await queryListChaincode("instantiated");
                    // await invokeChaincode();
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function installChaincodes() {
    return __awaiter(this, void 0, void 0, function () {
        var result, result, result, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, chaincodeApi.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, '', 'org1')];
                case 1:
                    result = _a.sent();
                    console.log(result);
                    return [4 /*yield*/, chaincodeApi.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, '', 'org2')];
                case 2:
                    result = _a.sent();
                    console.log(result);
                    return [4 /*yield*/, chaincodeApi.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, '', 'org3')];
                case 3:
                    result = _a.sent();
                    console.log(result);
                    return [4 /*yield*/, chaincodeApi.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, '', 'org4')];
                case 4:
                    result = _a.sent();
                    console.log(result);
                    return [2 /*return*/];
            }
        });
    });
}
function instantiateChaincode() {
    return __awaiter(this, void 0, void 0, function () {
        var result1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channelApi.instantiateChainCode(channelName, chaincodeName, chaincodeVersion, '', [], '', 'org2')];
                case 1:
                    result1 = _a.sent();
                    console.log(result1);
                    return [2 /*return*/];
            }
        });
    });
}
function queryListChaincode(type) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, chaincodeApi.getInstalledChaincodes('peer1', type, '', 'org2')];
                case 1:
                    result = _a.sent();
                    console.log(result);
                    return [2 /*return*/];
            }
        });
    });
}
function queryChaincode() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channelApi.queryChaincode('peer1', channelName, chaincodeName, ["data6"], 'queryData', 'miron3', 'org2')];
                case 1:
                    result = _a.sent();
                    console.log(result);
                    return [2 /*return*/];
            }
        });
    });
}
// async function invokeChaincode(){
//     var result = await channelApi.invokeChaincode([['peer1','org1'],['peer1','org2'],['peer1','org3'],['peer1','org4']], channelName, chaincodeName,'createData',["data6","6"],'miron3', 'org2');
//     console.log(result);
// }
//# sourceMappingURL=index.js.map