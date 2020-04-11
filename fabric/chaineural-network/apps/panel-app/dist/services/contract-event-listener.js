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
var helper = __importStar(require("./helper"));
var logger = helper.getLogger('ContractListener');
function ContractListen() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, org, adminUser, client, channel_1, event_hubs;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _i = 0, _a = Object.keys(helper.getOrgs());
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    org = _a[_i];
                    if (!org.startsWith('org')) return [3 /*break*/, 3];
                    return [4 /*yield*/, helper.getOrgAdmin(org)];
                case 2:
                    adminUser = _b.sent();
                    client = helper.getClientForOrg(org);
                    client.setUserContext(adminUser);
                    channel_1 = client.getChannel('mainchannel');
                    event_hubs = channel_1.getChannelEventHubsForOrg();
                    event_hubs.forEach(function (eh) {
                        console.log('event_hub ' + eh.getPeerAddr().toString());
                        eh.registerChaincodeEvent('chaineuralcc', 'InitEpochsLedgerEvent', function (event, block_num, tx, status) { return eventCallBack(event, block_num, tx, status); }, function (error) { return eventError(error); });
                        eh.registerChaincodeEvent('chaineuralcc', 'InitMinibatchEvent', function (event, block_num, tx, status) { return eventCallBack(event, block_num, tx, status); }, function (error) { return eventError(error); });
                        eh.registerChaincodeEvent('chaineuralcc', 'FinishMinibatchEvent', function (event, block_num, tx, status) { return eventCallBack(event, block_num, tx, status); }, function (error) { return eventError(error); });
                        eh.registerChaincodeEvent('chaineuralcc', 'FinalMinibatchEvent', function (event, block_num, tx, status) { return eventCallBack(event, block_num, tx, status); }, function (error) { return eventError(error); });
                        eh.connect(true);
                    });
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.ContractListen = ContractListen;
function eventCallBack(event, block_num, tx, status) {
    logger.info('Successfully got a chaincode event with transid:' + tx + ' with status:' + status);
    logger.info('Successfully got a chaincode event with payload:' + console.log(event.payload.toString()));
    if (block_num) {
        logger.info('Successfully received the chaincode event on block number ' + block_num);
    }
    else {
        logger.info('Successfully got chaincode event ... just not the one we are looking for on block number ' + block_num);
    }
}
function eventError(error) {
    logger.info('Failed to receive the chaincode event ::' + error);
}
//# sourceMappingURL=contract-event-listener.js.map