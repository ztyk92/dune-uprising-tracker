import app from './functions/server.js';

const srv = app.listen(3001, async () => {
    try {
        const res = await fetch("http://localhost:3001/api/vp-actions?spreadsheetId=1W6QdQtyJ3LkjYPedZzc0dczB_ecYLPdM2VKuS1bhMA4");
        console.log(await res.json());
    } catch (e) {
        console.error(e);
    } finally {
        srv.close();
        process.exit(0);
    }
});
