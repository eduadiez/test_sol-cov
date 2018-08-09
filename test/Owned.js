/* eslint-env mocha */
/* eslint-disable no-await-in-loop */
const getWeb3 = require('./helpers/getWeb3');
const chai = require('chai');
const contracts = require('../build/contracts');
const assertFail = require("./helpers/assertFail.js");
const assert = chai.assert;

describe('Owned', function() {
    this.timeout(0);

    let web3;
    let accounts;
    let owned;
    let owner1;
    let someoneaddr;

    before(async () => {
        web3 = getWeb3();
        accounts = await web3.eth.getAccounts();
        owner1 = accounts[0];
        owner2 = accounts[1];
        someoneaddr = accounts[3];
    });

    beforeEach(async () => {
        owned = await contracts.Owned.new(web3);
    });

    it("should have an owner assigned to msg.sender initially", async () => {
        assert.equal((await owned.owner()), owner1);
    });

    it("changes owner after changeOwnership call, and a log is genearated", async () => {
        const result = await owned.changeOwnership(someoneaddr);

        assert.isTrue(await owned.owner() === someoneaddr);

        //assert.equal(result.logs.length, 1);
        assert.hasAllKeys(result.events, "OwnershipTransferred");
        assert.equal(result.events.OwnershipTransferred.returnValues.from, owner1);
        assert.equal(result.events.OwnershipTransferred.returnValues.to, someoneaddr);
    });


    it("should prevent non-owners from transfering ownership", async () => {
        await assertFail(owned.changeOwnership(someoneaddr, { from: someoneaddr }));
    });

    it("changes owner after proposeOwnership & acceptOwnership call, and a log is genearated", async () => {
        let result = await owned.proposeOwnership(owner2);
        assert.equal(await owned.newOwnerCandidate(), owner2);

        assert.hasAllKeys(result.events, "OwnershipRequested");
        assert.equal(result.events.OwnershipRequested.returnValues.by, owner1);
        assert.equal(result.events.OwnershipRequested.returnValues.to, owner2);

        result = await owned.acceptOwnership({ from: owner2, gas: 4200000 });

        assert.equal(await owned.newOwnerCandidate(), '0x0000000000000000000000000000000000000001');
        assert.equal(await owned.owner(), owner2);

        assert.hasAllKeys(result.events, "OwnershipTransferred");
        assert.equal(result.events.OwnershipTransferred.returnValues.from, owner1);
        assert.equal(result.events.OwnershipTransferred.returnValues.to, owner2);
    });

    it("non-owners cannot call proposeOwnership", async () => {
        await assertFail(owned.proposeOwnership(someoneaddr, { from: someoneaddr }));
    });

    it("address non proposed for new membership cannot call acceptOwnership", async () => {
        await assertFail(owned.acceptOwnership({ from: owner2 }));
    });

    it("ownership can be removed", async () => {
        const result = await owned.removeOwnership('0xdAc0000000000000000000000000000000000000', { from: owner1, gas: 4200000 });
        assert.equal(await owned.owner(), '0x0000000000000000000000000000000000000001');
        assert.hasAllKeys(result.events, "OwnershipRemoved");

    });

    it("ownership cannot be removed without using 0xdac parameter", async () => {
        await assertFail(owned.removeOwnership('0xdac1000000000000000000000000000000000000', { from: owner1, gas: 4200000 }));
    });

    it("ownership cannot be removed by non-owner", async () => {
        await assertFail(owned.removeOwnership('0xdAc0000000000000000000000000000000000000', { from: someoneaddr, gas: 4200000 }));
    });
});