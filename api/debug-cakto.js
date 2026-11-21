// API de debug temporária — verificar se Vercel consegue acessar a Cakto
// REMOVER APÓS DIAGNÓSTICO
// Caminho: /api/debug-cakto.js

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache');

    const clientId = process.env.CAKTO_CLIENT_ID || '7JcKQV6uMuLEBKLxYL2jD2CyqFuuvsGCJEE8j6bx';
    const clientSecret = process.env.CAKTO_CLIENT_SECRET || 'TSlkII0HF6B6YyEodcOnl19vITpGzHD0Zn4U6AhA3D394Q0sbJ0uJHZhbyB4GU94ZEiGRV5HuyIEpZHCrmIj1OZ6vwPNO4f0cMWEY6DNGPKq61Wb9XuiZv9XYx2Ew4Nz';
    const testEmail = req.query.email || 'mariacavaleca04@gmail.com';

    const log = [];

    try {
        // 1. Token
        log.push('Requesting token...');
        const tokenResp = await fetch('https://api.cakto.com.br/public_api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret })
        });
        log.push(`Token response status: ${tokenResp.status}`);

        if (!tokenResp.ok) {
            const err = await tokenResp.text();
            log.push(`Token error body: ${err}`);
            return res.status(200).json({ success: false, log, error: 'token_failed' });
        }

        const tokenData = await tokenResp.json();
        const token = tokenData.access_token;
        log.push(`Token obtained, length: ${token ? token.length : 0}`);

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Orders paid
        const emailEncoded = encodeURIComponent(testEmail.toLowerCase().trim());
        const ordersUrl = 'https://api.cakto.com.br/public_api/orders/?customer=' + emailEncoded + '&status=paid&limit=10';
        log.push(`Fetching orders: ${ordersUrl}`);

        const ordersResp = await fetch(ordersUrl, { method: 'GET', headers: authHeaders });
        log.push(`Orders response status: ${ordersResp.status}`);

        if (ordersResp.ok) {
            const ordersData = await ordersResp.json();
            log.push(`Orders count: ${ordersData.count}, results: ${ordersData.results ? ordersData.results.length : 0}`);
            if (ordersData.results && ordersData.results.length > 0) {
                ordersData.results.forEach(o => {
                    log.push(`  Order ${o.id}: status=${o.status}, custEmail=${o.customer ? o.customer.email : 'N/A'}, paidAt=${o.paidAt}`);
                });
            }
        } else {
            const ordErr = await ordersResp.text();
            log.push(`Orders error: ${ordErr}`);
        }

        // 3. Subscriptions
        const subsUrl = 'https://api.cakto.com.br/public_api/subscriptions/?search=' + emailEncoded + '&limit=10';
        log.push(`Fetching subscriptions: ${subsUrl}`);

        const subsResp = await fetch(subsUrl, { method: 'GET', headers: authHeaders });
        log.push(`Subs response status: ${subsResp.status}`);

        if (subsResp.ok) {
            const subsData = await subsResp.json();
            log.push(`Subs count: ${subsData.count}, results: ${subsData.results ? subsData.results.length : 0}`);
            if (subsData.results && subsData.results.length > 0) {
                subsData.results.forEach(s => {
                    log.push(`  Sub ${s.id}: status=${s.status}, custEmail=${s.customer ? s.customer.email : 'N/A'}`);
                });
            }
        } else {
            const subErr = await subsResp.text();
            log.push(`Subs error: ${subErr}`);
        }

        return res.status(200).json({ success: true, testEmail, log });

    } catch (err) {
        log.push(`EXCEPTION: ${err.message}`);
        return res.status(200).json({ success: false, log, error: err.message });
    }
}
