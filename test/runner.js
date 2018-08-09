const getServer = require('./helpers/getServer');

describe('giveth-bridge contract tests', function() {
    this.timeout(0);

    let server;

    before(async () => {
        server = await getServer(8545);
    });

    require('./Owned');

    after(async () => {
        await server.close();
    });
});
