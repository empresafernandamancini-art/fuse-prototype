// API Endpoint para verificar compras da Cakto por E-mail
// Caminho do arquivo: /api/verify-purchase.js
// Versão: 2.1 — Debug inline para diagnostico Vercel + correcao critica liberacao

export default async function handler(req, res) {
    // Adiciona headers de CORS para permitir chamadas do frontend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    // Previne cache intermediário para garantir validação em tempo real de novas compras
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { email, debug } = req.query;
    const isDebug = debug === '1';
    const dbgLog = [];

    if (!email) {
        return res.status(400).json({ success: false, message: 'Por favor, insira um e-mail válido.' });
    }

    const emailClean = email.toLowerCase().trim();

    // CATÁLOGO OFICIAL DE CLIENTES DA CAKTO (Fallback / Alta Disponibilidade)
    const VERIFIED_CUSTOMERS = {
        // Clientes liberadas e ativadas
        "fernandagomesdebrito@hotmail.com": { name: "Fernanda Gomes de Brito", status: "active" },
        "paulalfiamoncini@gmail.com": { name: "Paula Fiamoncini", status: "active" },
        "rafhaella2009@gmail.com": { name: "Rafhaella", status: "active" },
        "contatorosanapersonal@gmail.com": { name: "Rosana Personal", status: "active" },

        // Clientes com assinatura ativa confirmada
        "pricilaoliveiras21@gmail.com": { name: "Pricila Oliveira Rocha", status: "active" },
        "camillyleticiaramos@gmail.com": { name: "Camilly Gerhardt Gerhardt", status: "active" },
        "bebelsantos534@gmail.com": { name: "Isabelys dos Santos da Silva", status: "active" },
        "jacquelinemesqui@gmail.com": { name: "Jacqueline Mesquita", status: "active" },
        "juliaschaefer10@gmail.com": { name: "Julia schaefer", status: "active" },
        "marinavilacac@gmail.com": { name: "Marina Vilaça", status: "active" },
        "thaismoreirasap@gmail.com": { name: "Thais Moreira", status: "active" },
        "ehriikaa17@hotmail.com": { name: "Érika Nascimento Santos", status: "active" },
        "anneorzechowsky695@gmail.com": { name: "Anne Orzechowsky", status: "active" },
        "mariaanaviann7@gmail.com": { name: "Mariaana Klein Viana", status: "active" },
        "gabioff1234@gmail.com": { name: "Gabriela  Nascimento de Carvalho", status: "active", validUntil: "2026-10-22T23:59:59-03:00" },
        "bruninhavidal25@hotmail.com": { name: "Bruna A Vidal", status: "active" },
        "luanacosta.2619@gmail.com": { name: "Raiza Luana de Miranda Costa da Silva", status: "active" },
        "amariles_rodrigues@outlook.com": { name: "Amariles Paloma Rodrigues", status: "active" },
        "monteiro20al@gmail.com": { name: "Aline Monteiro", status: "active" },
        "nluana683@gmail.com": { name: "Luana Nunes da Cunha", status: "active" },
        "jujugabriele.r@gmail.com": { name: "Julia Gabriele Paulino", status: "active" },
        "demouramarcele@gmail.com": { name: "Marcele Dias de Moura", status: "active" },
        "larissa_silvestre01@hotmail.com": { name: "Larissa Silvestre", status: "active" },
        "l.almeida1391@gmail.com": { name: "Lais Borges de Almeida", status: "active" },
        "carolyne.xavier@hotmail.com": { name: "Ana Carolyne Xavier dos Santos", status: "active" },
        "enfabeatriz@outlook.com": { name: "Beatriz Oliveira", status: "active" },
        "itsbrubarbosa@gmail.com": { name: "Bruna Barbosa", status: "active" },
        "tininha.benitz@gmail.com": { name: "Albertina Benitz dos Santos", status: "active" },
        "janiellyssantos26@gmail.com": { name: "Janielly da Silva Santos", status: "active" },
        "jennyffer2301@gmail.com": { name: "Jennyffer Ribeiro da Silva", status: "active" },
        "souzalidiane03@gmail.com": { name: "Lidiane de Souza Santana dos Santos", status: "active" },
        "solanginhasol@hotmail.com": { name: "Solange Santos", status: "active" },
        "nutri.stephanieduarte@gmail.com": { name: "Stephanie Duarte", status: "active" },
        "as9233809@gmail.com": { name: "Amanda Caroline dos Santos Ferreira", status: "active" },
        "mirellihi@hotmail.com": { name: "Mirelli Lopes Vasconcelos", status: "active" },
        "gi_blho@hotmail.com": { name: "Gisele Evelyn Dantas Santos", status: "active" },
        "gabriela.fernanda@redesupermercado.com.br": { name: "Gabriela Fernanda", status: "active" },
        "mscontabil_@outlook.com": { name: "Milena Souza Souza", status: "active" },
        "scryslayne9@gmail.com": { name: "Cryslayne Santos", status: "active" },
        "sarah.heggler@gmail.com": { name: "Sarah Hegler", status: "active" },
        "leticiahegler@gmail.com": { name: "Letícia Hegler", status: "active" },
        "cribeiral@gmail.com": { name: "Clara Gomes Ribeiral", status: "active" },
        "larahmagela@gmail.com": { name: "LARAH CAMACHO MAGELA", status: "active" },
        "malurodriguesdelima@gmail.com": { name: "Maria Luiza Rodrigues de lima", status: "active" },
        "cailaner38@gmail.com": { name: "Cailane Ribeiro", status: "active" },

        // Clientes canceladas / inativas (acesso expressamente revogado)
        "andressadasilvadasilva32491@gmail.com": { name: "Andressa Bezerra da Silva", status: "canceled" },
        "amaintegrare@gmail.com": { name: "Amanda Rodrigues", status: "canceled" },
        "marquesray86@gmail.com": { name: "Rayssa Millena Marques", status: "canceled" },
        "souz2kelly@gmail.com": { name: "Kelly Souza Silva", status: "canceled" },
        "lolysilvaalves3@gmail.com": { name: "Lorena Alves", status: "canceled" },
        "fabi.casturina123@gmail.com": { name: "Fabiana Casturina Ferreira", status: "canceled" },
        "eduardaaleixosm@gmail.com": { name: "Eduarda do Carmo Aleixo", status: "canceled" },
        "tomanari.gabrielle@gmail.com": { name: "Gabrielle Tomanari", status: "canceled" },
        "franciara_fran@hotmail.com": { name: "Franciara Lima", status: "canceled" },
        "rayanemeneses70@gmail.com": { name: "RAIANE ALINE SILVA DE MENESES", status: "canceled" }
    };

    // LISTA DE EMAILS AUTOMATICAMENTE APROVADOS (Confiança / Liberação Rápida)
    const trustedEmails = [
        'as9233809@gmail.com',
        'duda@fuse.com',
        'fernanda@fuse.com',
        'fernanda@fuse.com.br',
        'amanda@fuse.com.br',
        'fer@gmail.com',
        'pratsroberta@gmail.com',
        'fernandagomesdebrito@hotmail.com',
        'paulalfiamoncini@gmail.com',
        'rafhaella2009@gmail.com',
        'contatorosanapersonal@gmail.com'
    ];

    if (trustedEmails.includes(emailClean) || emailClean.endsWith('@fuse.com') || emailClean.endsWith('@fuse.com.br')) {
        const custName = (VERIFIED_CUSTOMERS[emailClean] && VERIFIED_CUSTOMERS[emailClean].name) ? VERIFIED_CUSTOMERS[emailClean].name : emailClean.split('@')[0].toUpperCase();
        return res.status(200).json({
            success: true,
            isCanceled: false,
            message: 'Compra premium aprovada encontrada (Lista de Confiança)!',
            customerName: custName,
            email: emailClean,
            status: 'paid',
            orderId: 'trusted_' + Date.now(),
            paidAt: new Date().toISOString(),
            purchasedProducts: ['FUSE', 'Desafio Core']
        });
    }

    // Chaves de API do Cakto: lê das variáveis de ambiente primeiro, depois usa fallback hardcoded
    const clientId = process.env.CAKTO_CLIENT_ID || '7JcKQV6uMuLEBKLxYL2jD2CyqFuuvsGCJEE8j6bx';
    const clientSecret = process.env.CAKTO_CLIENT_SECRET || 'TSlkII0HF6B6YyEodcOnl19vITpGzHD0Zn4U6AhA3D394Q0sbJ0uJHZhbyB4GU94ZEiGRV5HuyIEpZHCrmIj1OZ6vwPNO4f0cMWEY6DNGPKq61Wb9XuiZv9XYx2Ew4Nz';

    // Helper para fazer fetch com retry e timeout adequado para Vercel serverless
    async function fetchWithTimeout(url, options, timeoutMs = 8000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const resp = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            return resp;
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }

    try {
        dbgLog.push(`[start] email=${emailClean}`);

        // 1. Solicita Token OAuth2 à API do Cakto
        const tokenResponse = await fetchWithTimeout('https://api.cakto.com.br/public_api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!tokenResponse.ok) {
            const tokenErr = await tokenResponse.json().catch(() => ({}));
            console.error('Falha no token Cakto:', tokenErr);
            dbgLog.push(`[token] FAILED status=${tokenResponse.status}`);
            // Cai no fallback do catálogo
            throw new Error('token_failed');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        dbgLog.push(`[token] OK len=${accessToken ? accessToken.length : 0}`);

        const authHeaders = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };

        // 2. Busca pedidos PAGOS da cliente via filtro customer=email
        //    CORREÇÃO: usar encodeURIComponent apenas no valor do email, não na URL inteira
        let orders = [];
        
        const paidOrdersUrl = 'https://api.cakto.com.br/public_api/orders/?customer=' + encodeURIComponent(emailClean) + '&status=paid&limit=100';
        try {
            dbgLog.push(`[orders_paid] fetching...`);
            const paidOrdersResp = await fetchWithTimeout(paidOrdersUrl, { method: 'GET', headers: authHeaders });
            dbgLog.push(`[orders_paid] status=${paidOrdersResp.status}`);
            if (paidOrdersResp.ok) {
                const paidData = await paidOrdersResp.json();
                dbgLog.push(`[orders_paid] count=${paidData.count} results=${paidData.results ? paidData.results.length : 0}`);
                if (paidData && Array.isArray(paidData.results) && paidData.results.length > 0) {
                    // Filtra apenas os pedidos que realmente pertencem a este email (segurança extra)
                    const filtered = paidData.results.filter(o => 
                        o.customer && o.customer.email && o.customer.email.toLowerCase().trim() === emailClean
                    );
                    orders = orders.concat(filtered);
                    dbgLog.push(`[orders_paid] filtered=${filtered.length}`);
                    console.log(`Orders paid (filtered by email): ${filtered.length} of ${paidData.results.length}`);
                }
            }
        } catch (ordersErr) {
            dbgLog.push(`[orders_paid] ERROR: ${ordersErr.message}`);
            console.warn('Erro ao buscar pedidos pagos:', ordersErr.message);
        }

        // 3. Busca geral de pedidos (para verificar estornos/chargebacks)
        const allOrdersUrl = 'https://api.cakto.com.br/public_api/orders/?customer=' + encodeURIComponent(emailClean) + '&limit=100';
        try {
            dbgLog.push(`[orders_all] fetching...`);
            const allOrdersResp = await fetchWithTimeout(allOrdersUrl, { method: 'GET', headers: authHeaders });
            dbgLog.push(`[orders_all] status=${allOrdersResp.status}`);
            if (allOrdersResp.ok) {
                const allData = await allOrdersResp.json();
                dbgLog.push(`[orders_all] count=${allData.count} results=${allData.results ? allData.results.length : 0}`);
                if (allData && Array.isArray(allData.results)) {
                    const existingIds = new Set(orders.map(o => o.id));
                    // Filtra apenas os pedidos que realmente pertencem a este email
                    allData.results.forEach(o => {
                        const orderEmail = o.customer && o.customer.email ? o.customer.email.toLowerCase().trim() : '';
                        if (!existingIds.has(o.id) && orderEmail === emailClean) {
                            orders.push(o);
                        }
                    });
                }
            }
        } catch (allOrdersErr) {
            dbgLog.push(`[orders_all] ERROR: ${allOrdersErr.message}`);
            console.warn('Erro ao buscar todos os pedidos:', allOrdersErr.message);
        }

        console.log(`Total orders found for ${emailClean}: ${orders.length}`);
        dbgLog.push(`[total] orders=${orders.length}`);

        // 4. Consulta assinaturas usando search= (que a Cakto filtra por nome/email)
        let userSubs = [];
        try {
            const subsUrl = 'https://api.cakto.com.br/public_api/subscriptions/?search=' + encodeURIComponent(emailClean) + '&limit=50';
            dbgLog.push(`[subs] fetching...`);
            const subsResp = await fetchWithTimeout(subsUrl, { method: 'GET', headers: authHeaders });
            dbgLog.push(`[subs] status=${subsResp.status}`);
            if (subsResp.ok) {
                const subsData = await subsResp.json();
                dbgLog.push(`[subs] count=${subsData.count} results=${subsData.results ? subsData.results.length : 0}`);
                if (subsData && Array.isArray(subsData.results)) {
                    // CORREÇÃO CRÍTICA: filtra apenas subscriptions cujo email do customer bate exatamente
                    userSubs = subsData.results.filter(s =>
                        s.customer && s.customer.email && s.customer.email.toLowerCase().trim() === emailClean
                    );
                    dbgLog.push(`[subs] filtered=${userSubs.length} statuses=${userSubs.map(s => s.status).join(',')}`);
                    console.log(`Subscriptions (filtered): ${userSubs.length} of ${subsData.results.length}`);
                }
            }
        } catch (subErr) {
            dbgLog.push(`[subs] ERROR: ${subErr.message}`);
            console.warn('Erro ao consultar assinaturas:', subErr.message);
        }

        // 5. Fallback: busca sub por ID extraído dos pedidos (caso a busca por search= retorne vazio)
        if (userSubs.length === 0 && orders.length > 0) {
            const subIds = [...new Set(orders.map(o => o.subscription).filter(s => !!s))];
            for (const subId of subIds.slice(0, 3)) {
                try {
                    const singleSubResp = await fetchWithTimeout(
                        `https://api.cakto.com.br/public_api/subscriptions/${subId}/`,
                        { method: 'GET', headers: authHeaders }
                    );
                    if (singleSubResp.ok) {
                        const singleSubData = await singleSubResp.json();
                        if (singleSubData && singleSubData.id) {
                            userSubs.push(singleSubData);
                            console.log(`Sub via ID ${subId}: status=${singleSubData.status}`);
                        }
                    }
                } catch (e) {
                    console.warn('Erro ao consultar assinatura individual:', e.message);
                }
            }
        }

        // 6. LÓGICA DE DECISÃO
        // Uma assinatura é considerada "ativa" se tem status active OU se tem pagamento recente dentro do período pago
        const hasActiveSubscription = userSubs.some(s => (s.status || '').toLowerCase() === 'active');
        const hasSubscriptions = userSubs.length > 0;

        // Analisa cancelamentos, estornos e encontra o pedido mais recente aprovado
        let customerName = 'Cliente FUSE';
        let latestPaidOrder = null;
        let hasRefundOrChargeback = false;

        orders.forEach(order => {
            const status = (order.status || '').toLowerCase();
            if (status === 'refunded' || status === 'chargedback') {
                hasRefundOrChargeback = true;
            }
            if (status === 'paid' || status === 'authorized' || status === 'processing') {
                const orderDate = new Date(order.paidAt || order.createdAt || 0);
                if (!latestPaidOrder || orderDate > new Date(latestPaidOrder.paidAt || latestPaidOrder.createdAt || 0)) {
                    latestPaidOrder = order;
                }
                if (order.customer && order.customer.name) {
                    customerName = order.customer.name;
                }
            }
        });

        console.log(`hasActiveSubscription: ${hasActiveSubscription}, hasSubscriptions: ${hasSubscriptions}, latestPaidOrder: ${latestPaidOrder ? latestPaidOrder.id : 'none'}, hasRefund: ${hasRefundOrChargeback}`);
        dbgLog.push(`[decision] hasActiveSub=${hasActiveSubscription} hasSubs=${hasSubscriptions} latestPaid=${latestPaidOrder ? latestPaidOrder.id : 'none'} refund=${hasRefundOrChargeback}`);

        // Calcula data de fim do período pago (ciclo mensal de 31 dias)
        let isCanceled = false;
        let cancelReason = '';
        let periodEndDate = null;

        if (latestPaidOrder) {
            const lastPaidDate = new Date(latestPaidOrder.paidAt || latestPaidOrder.createdAt);
            periodEndDate = new Date(lastPaidDate.getTime() + (31 * 24 * 60 * 60 * 1000));
        }

        // Sobrescreve período com data expressa se configurada para esta cliente
        if (VERIFIED_CUSTOMERS[emailClean] && VERIFIED_CUSTOMERS[emailClean].validUntil) {
            periodEndDate = new Date(VERIFIED_CUSTOMERS[emailClean].validUntil);
        }

        const now = new Date();

        // REGRAS DE REVOGAÇÃO:
        if (hasRefundOrChargeback && !hasActiveSubscription && !latestPaidOrder) {
            // Estorno ou chargeback sem qualquer pedido ativo: revoga
            isCanceled = true;
            cancelReason = 'O pagamento da sua assinatura foi estornado ou cancelado.';
        } else if (hasSubscriptions && !hasActiveSubscription) {
            // Tem assinatura(s) mas NENHUMA está ativa:
            // Mantém acesso se ainda estiver dentro do período pago (31 dias)
            if (latestPaidOrder && periodEndDate && now <= periodEndDate) {
                isCanceled = false; // Período pago ainda vigente
                console.log(`Subscription canceled but within paid period until ${periodEndDate.toISOString()}`);
            } else if (latestPaidOrder && (!periodEndDate || now > periodEndDate)) {
                isCanceled = true;
                cancelReason = 'O período da sua assinatura mensal expirou e não foi renovado na Cakto.';
            }
            // Se não tem latestPaidOrder mas tem sub cancelada, bloqueia
            else if (!latestPaidOrder) {
                isCanceled = true;
                cancelReason = 'Sua assinatura foi cancelada e não há pagamentos ativos registrados.';
            }
        }

        // Se revogado, retorna negativa
        if (isCanceled) {
            return res.status(200).json({
                success: false,
                isCanceled: true,
                message: cancelReason || 'Sua assinatura foi cancelada. Renove seu plano para continuar com acesso.',
                customerName: customerName,
                email: emailClean,
                purchasedProducts: []
            });
        }

        // APROVAÇÃO: Tem assinatura ativa OU tem pedido pago ainda vigente
        if (hasActiveSubscription || (latestPaidOrder && !isCanceled)) {
            return res.status(200).json({
                success: true,
                isCanceled: false,
                message: hasActiveSubscription ? 'Assinatura ativa encontrada!' : 'Pagamento ativo dentro do período vigente!',
                customerName: customerName,
                email: emailClean,
                status: 'paid',
                orderId: latestPaidOrder ? (latestPaidOrder.refId || latestPaidOrder.id) : 'sub_' + Date.now(),
                paidAt: latestPaidOrder ? (latestPaidOrder.paidAt || latestPaidOrder.createdAt) : new Date().toISOString(),
                validUntil: periodEndDate ? periodEndDate.toISOString() : undefined,
                purchasedProducts: ['FUSE', 'Desafio Core']
            });
        }

        // Fallback: catálogo de clientes verificadas manualmente
        const verified = VERIFIED_CUSTOMERS[emailClean];
        if (verified) {
            let customerActive = verified.status === 'active';
            if (verified.validUntil) {
                const expiry = new Date(verified.validUntil);
                if (new Date() > expiry) {
                    customerActive = false;
                }
            }

            if (!customerActive || verified.status === 'canceled' || verified.status === 'inactive') {
                return res.status(200).json({
                    success: false,
                    isCanceled: true,
                    message: 'Sua assinatura mensal foi cancelada ou expirou na Cakto.',
                    customerName: verified.name,
                    email: emailClean,
                    purchasedProducts: []
                });
            } else {
                return res.status(200).json({
                    success: true,
                    isCanceled: false,
                    message: 'Assinatura ativa encontrada!',
                    customerName: verified.name,
                    email: emailClean,
                    status: 'paid',
                    orderId: 'catalog_' + Date.now(),
                    paidAt: new Date().toISOString(),
                    validUntil: verified.validUntil,
                    purchasedProducts: ['FUSE', 'Desafio Core']
                });
            }
        }

        return res.status(200).json({
            success: false,
            isCanceled: false,
            message: 'Nenhum pagamento aprovado ou ativo foi encontrado para este e-mail no Cakto.',
            purchasedProducts: [],
            ...(isDebug ? { debug: dbgLog } : {})
        });

    } catch (error) {
        dbgLog.push(`[catch] ${error.message}`);
        console.error('Erro na verificação de compra:', error.message);

        // Fallback de contingência se a API externa da Cakto estiver indisponível
        const verified = VERIFIED_CUSTOMERS[emailClean];
        if (verified) {
            let customerActive = verified.status === 'active';
            if (verified.validUntil) {
                const expiry = new Date(verified.validUntil);
                if (new Date() > expiry) {
                    customerActive = false;
                }
            }

            if (!customerActive || verified.status === 'canceled' || verified.status === 'inactive') {
                return res.status(200).json({
                    success: false,
                    isCanceled: true,
                    message: 'Sua assinatura mensal foi cancelada ou expirou na Cakto.',
                    customerName: verified.name,
                    email: emailClean,
                    purchasedProducts: []
                });
            } else {
                return res.status(200).json({
                    success: true,
                    isCanceled: false,
                    message: 'Assinatura ativa encontrada (Modo Contingência)!',
                    customerName: verified.name,
                    email: emailClean,
                    status: 'paid',
                    orderId: 'offline_' + Date.now(),
                    paidAt: new Date().toISOString(),
                    validUntil: verified.validUntil,
                    purchasedProducts: ['FUSE', 'Desafio Core']
                });
            }
        }

        return res.status(500).json({ 
            success: false, 
            message: 'Erro interno ao processar a verificação da compra.',
            error: error.message,
            ...(isDebug ? { debug: dbgLog } : {})
        });
    }
}
