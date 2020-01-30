/*
 * SPDX-License-Identifier: Apache-2.0
 */
import { Context, Contract } from 'fabric-contract-api';
import { Shim } from 'fabric-shim';
import { Epoch } from './epoch';
import { Minibatch, MinibatchPrivateInfo } from './minibatch';

export class Chaineural extends Contract {
    public async initEpochsLedger(ctx: Context, epochCount: number, miniBatchesAmount: number, org: string) {
        console.info('============= START : Initialize Ledger ===========');
        let epochs: Epoch[] = [];
        for (let i = 0; i < epochCount; i++) {
            const epoch: Epoch = {
                docType: 'epoch',
                epochName: 'epoch' + (i + 1),
                miniBatchesAmount,
                valid: false,
                validatedByOrg: []
            };
            epochs.push(epoch);
            await ctx.stub.putState(epoch.epochName, Buffer.from(JSON.stringify(epoch)));
            console.info('Added <--> ', epoch);
        }
        ctx.stub.setEvent('InitEpochsLedgerEvent', Buffer.from(JSON.stringify({ 'epochs': epochs, 'byOrg': org })));
        console.info('============= END : Initialize Ledger ===========');
        return JSON.stringify(epochs);
    }

    public async initMinibatch(ctx: Context, minibatchNumber: number, epochName: string, workerName: string, org: string) {
        console.info('============= START : Initialize Minibatch ===========');
        // ==== Check if epoch already exists ====
        let currentEpochInLedgerAsBytes = await ctx.stub.getState(epochName); // get the data from chaincode state
        if (!currentEpochInLedgerAsBytes || currentEpochInLedgerAsBytes.length === 0) {
            throw new Error(`${epochName} does not exist`);
        }
        let epoch = <Epoch>JSON.parse(currentEpochInLedgerAsBytes.toString());
        // ==== Check if minibatch already exists ====
        let minibatchAsBytes = await ctx.stub.getState(epochName + '-minibatch' + minibatchNumber);
        if (minibatchAsBytes && minibatchAsBytes.length !== 0) {
            throw new Error(`Minibatch number ${minibatchNumber} for ${epochName} already exists`);
        }

        const minibatch: Minibatch = {
            docType: 'minibatch',
            minibatchNumber,
            epochName,
            workerName,
            byOrg: org,
            finished: false,
        };
        if (minibatchNumber === epoch.miniBatchesAmount) {
            await ctx.stub.putState(`${minibatch.epochName}-finalMinibatch${minibatch.minibatchNumber}'-'${org}`, Buffer.from(JSON.stringify(minibatch)));
            console.info(`Added final minibatch in ${org}<--> `, minibatch);
            ctx.stub.setEvent('FinalMinibatchEvent', Buffer.from(JSON.stringify(minibatch)));
        }
        else {

            await ctx.stub.putState(minibatch.epochName + '-minibatch' + minibatch.minibatchNumber, Buffer.from(JSON.stringify(minibatch)));
            console.info('Added <--> ', minibatch);
            ctx.stub.setEvent('InitMinibatchEvent', Buffer.from(JSON.stringify(minibatch)));
        }
        console.info('============= END : Initialize Minibatch ===========');
        return JSON.stringify(minibatch);
    }

    public async finishMinibatch(ctx: Context, minibatchNumber: number, epochName: string, org: string) {
        console.info('============= START : Finish Minibatch ===========');
        console.info('============= 1 ===========');
        // ==== Check if epoch already exists ====
        let epochInLedgerAsBytes = await ctx.stub.getState(epochName); // get the data from chaincode state
        console.info('============= 2 ===========');
        if (!epochInLedgerAsBytes || epochInLedgerAsBytes.length === 0) {
            throw new Error(`${epochName} does not exist`);
        }
        console.info('============= 3 ===========');
        let epoch = <Epoch>JSON.parse(epochInLedgerAsBytes.toString());
        console.info('============= 4 ===========');
        // ==== Check if minibatch already exists ====
        let minibatchAsBytes = null;
        console.info('============= 5 ===========');
        if (minibatchNumber === epoch.miniBatchesAmount) {
            minibatchAsBytes = await ctx.stub.getState(`${epochName}-finalMinibatch${minibatchNumber}'-'${org}`);
        } else {
            minibatchAsBytes = await ctx.stub.getState(epochName + '-minibatch' + minibatchNumber);
            console.log('else');
        }
        if (!minibatchAsBytes || minibatchAsBytes.length === 0) {
            console.log('error');
            throw new Error(`Minibatch number ${minibatchNumber} for ${epochName} do not exist`);
        }
        
        console.info('============= 6 ===========');
        console.info('minibatchAsBytes');
        console.info(minibatchAsBytes);
        console.info('minibatchAsBytes.toString()');
        console.info(minibatchAsBytes.toString());
        console.info('JSON.parse(minibatchAsBytes.toString())');
        console.info(JSON.parse(minibatchAsBytes.toString()));
        console.info('<Minibatch>JSON.parse(minibatchAsBytes.toString()');
        console.info(<Minibatch>JSON.parse(minibatchAsBytes.toString()));
        let minibatch = <Minibatch>JSON.parse(minibatchAsBytes.toString())
        if (minibatch.finished) {
            throw new Error(`Minibatch number ${minibatchNumber} for ${epochName} had finished before`);
        }
        console.info('============= 7 ===========');
        minibatch.finished = true;
        console.info('============= 8 ===========');
        if (minibatchNumber === epoch.miniBatchesAmount) {
            console.info('============= 9 ===========');
            await ctx.stub.putState(`${epochName}-finalMinibatch${minibatchNumber}'-'${org}`, Buffer.from(JSON.stringify(minibatch)));
            epoch.validatedByOrg.push(org);
            console.info('============= 10 ===========');
            await ctx.stub.putState(epochName, Buffer.from(JSON.stringify(epoch)));
        }
        else {
            console.info('============= 11 ===========');
            await ctx.stub.putState(minibatch.epochName + '-minibatch' + minibatch.minibatchNumber, Buffer.from(JSON.stringify(minibatch)));
        }
        const transMap = ctx.stub.getTransient();
        const result = {};
        console.info('============= 12 ===========');
        transMap.forEach((value, key) => {
            result[key] = value.toString();
        });
        console.info('============= 13 ===========');
        let minibatchPrivateInfo: MinibatchPrivateInfo = {
            docType: 'minibatchPrivateInfo',
            minibatchNumber: minibatch.minibatchNumber,
            epochName: minibatch.epochName,
            learningTime: result['learningTime'],
            loss: result['loss']
        }
        console.info('============= 14 ===========');
        const orgCapitalized = org.charAt(0).toUpperCase() + org.slice(1);
        await ctx.stub.putPrivateData('collectionMinibatchesPrivateDetailsFor' + orgCapitalized, minibatch.epochName + '-minibatch' + minibatch.minibatchNumber, Buffer.from(JSON.stringify(minibatchPrivateInfo)));
        console.info('Added private data<--> ', minibatch);
        console.info('============= 15 ===========');
        ctx.stub.setEvent('FinishMinibatchEvent', Buffer.from(JSON.stringify(minibatch)));
        console.info('============= 16 ===========');
        console.info('============= END : Finish Minibatch ===========');
        if (minibatch.minibatchNumber === epoch.miniBatchesAmount) {
            console.info('============= START : Finalize Epoch ===========');
            console.info('============= 17 ===========');
            if (epoch.validatedByOrg.length === 4 && !this.hasDuplicates(epoch.validatedByOrg)) {
                epoch.valid = true;
                await ctx.stub.putState(epoch.epochName, Buffer.from(JSON.stringify(epoch)));
                console.info('Epoch is valid <--> ', epoch);
                epoch.byOrg = org;
                ctx.stub.setEvent('EpochIsValidEvent', Buffer.from(JSON.stringify(epoch)));
            }
            console.info('============= END : Finalize Epoch ===========');
        }
        return JSON.stringify(minibatch);
    }

    // tslint:disable-next-line: align
    hasDuplicates(arr) {
        return arr.some(function (item) {
            return arr.indexOf(item) !== arr.lastIndexOf(item);
        });
    }

    public async putTestData(ctx: Context, test: string) {
        console.log("START");
        await ctx.stub.putState(test, Buffer.from(test)); // get the data from chaincode state
        console.log("END");
        return "OK";
    }

    public async queryData(ctx: Context, epochName: string): Promise<string> {
        const dataAsBytes = await ctx.stub.getState(epochName); // get the data from chaincode state
        if (!dataAsBytes || dataAsBytes.length === 0) {
            throw new Error(`${epochName} does not exist`);
        }
        console.log(dataAsBytes.toString());
        return dataAsBytes.toString();
    }

    public async queryEpoch(ctx: Context, epochName: string): Promise<string> {
        const dataAsBytes = await ctx.stub.getState(epochName); // get the data from chaincode state
        if (!dataAsBytes || dataAsBytes.length === 0) {
            throw new Error(`${epochName} does not exist`);
        }
        console.log(dataAsBytes.toString());
        return dataAsBytes.toString();
    }

    public async queryMinibatch(ctx: Context, epochName: string, minibatchNumber: number, org: string): Promise<string> {
        const epochAsBytes = await ctx.stub.getState(epochName); // get the data from chaincode state
        if (!epochAsBytes || epochAsBytes.length === 0) {
            throw new Error(`${epochName} does not exist`);
        }
        let epoch = <Epoch>JSON.parse(epochAsBytes.toString());
        let minibatch;
        if (epoch.miniBatchesAmount === minibatchNumber) {
            minibatch = await ctx.stub.getState(`${epoch.epochName}-finalMinibatch${minibatchNumber}'-'${org}`); // get the data from chaincode state
            if (!minibatch || minibatch.length === 0) {
                throw new Error(`Minibatch number ${minibatchNumber} for ${epochName} for ${org} do not exist`);
            }
        } else {
            minibatch = await ctx.stub.getState(epochName + '-minibatch' + minibatchNumber);
            if (!minibatch || minibatch.length === 0) {
                throw new Error(`Minibatch number ${minibatchNumber} for ${epochName} do not exist`);
            }
        }
        console.log(minibatch.toString());
        return minibatch.toString();
    }

    public async queryMinibatchPrivateInfo(ctx: Context, epochName: string, minibatchNumber: number, org: string): Promise<string> {
        const orgCapitalized = org.charAt(0).toUpperCase() + org.slice(1);
        const dataAsBytes = await ctx.stub.getPrivateData('collectionMinibatchesPrivateDetailsFor' + orgCapitalized, epochName + '-minibatch' + minibatchNumber); // get the data from chaincode private collection
        if (!dataAsBytes || dataAsBytes.length === 0) {
            throw new Error(`${epochName} does not exist`);
        }
        console.log(dataAsBytes.toString());
        return dataAsBytes.toString();
    }

    public async queryAllData(ctx: Context): Promise<string> {
        const startKey = 'epoch1';
        const endKey = 'epoch999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString());

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString());
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString();
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    public async queryAverageTimeAndLoss(ctx: Context, epochName: string, org: string): Promise<string> {
        console.log('queryAverageTimeAndLoss')
        const epochAsBytes = await ctx.stub.getState(epochName); // get the data from chaincode state
        if (!epochAsBytes || epochAsBytes.length === 0) {
            throw new Error(`${epochName} does not exist`);
        }
        console.log('epochAsBytes')
        console.log(epochAsBytes)
        let epoch = <Epoch>JSON.parse(epochAsBytes.toString());
        console.log('epoch')
        console.log(epoch)
        const orgCapitalized = org.charAt(0).toUpperCase() + org.slice(1);
        let allResults: MinibatchPrivateInfo[] = [];
        for (let i = 1; i <= epoch.miniBatchesAmount; i++) {
            const privateDetailsMinibatchAsBytes = await ctx.stub.getPrivateData('collectionMinibatchesPrivateDetailsFor' + orgCapitalized, epochName + '-minibatch' + i);
            if (privateDetailsMinibatchAsBytes && privateDetailsMinibatchAsBytes.length !== 0) {
                let privateDetails = JSON.parse(privateDetailsMinibatchAsBytes.toString());
                allResults.push(privateDetails);
            }
        }
        const sumLearningTime = allResults.map(a => parseFloat(a.learningTime.toString().replace('"', ''))).reduce((a, b) => a + b, 0);
        const avgLearningTime = (sumLearningTime / allResults.length) || 0;
        const sumLoss = allResults.map(a => (parseFloat(a.loss.toString().replace('"', '')))).reduce((a, b) => a + b, 0);
        const avgLoss = (sumLoss / allResults.length) || 0;
        let result = {
            'avgLearningTime': avgLearningTime,
            'avgLoss': avgLoss
        }
        console.log(`The sum is: ${result.avgLearningTime}. The average is: ${result.avgLoss}.`);
        ctx.stub.setEvent('EpochAveragesEvent', Buffer.from(JSON.stringify(result)));
        return JSON.stringify(result);
    }
    //for cleaning all data (only for tests)
    public async deleteAllData(ctx: Context): Promise<string> {
        //all epochs
        for (let i = 0; i < 20; i++) {
            ctx.stub.deleteState('epoch' + i);
        }
        //all minibatches
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 1000; j++) {
                ctx.stub.deleteState('epoch' + i + '-minibatch' + j);
            }
        }
        for (let i = 0; i < 20; i++) {
            for (let y = 0; y < 5; y++) {
                ctx.stub.deleteState('epoch' + i + '-finalMinibatch' + 1000 + '-org' + y);
            }
        }
        console.log('OK');
        return 'OK';
    }
}
