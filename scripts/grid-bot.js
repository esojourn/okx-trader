const fs = require('fs');
const path = require('path');
const OKXClient = require('../lib/okx-client');

/**
 * OKX Grid Bot Script (Standardized for AgentSkill)
 * Usage: node grid-bot.js [main|micro]
 */

const botType = process.argv[2] || 'main';

// 统一配置与数据路径处理
function getPaths() {
    // 默认 workspace 路径
    const workspaceRoot = path.resolve(__dirname, '../../../workspace');
    const skillRoot = path.resolve(__dirname, '..');
    
    return {
        auth: [
            path.resolve(process.cwd(), 'okx_config.json'),
            path.resolve(workspaceRoot, 'okx_data/config.json'),
            path.resolve(skillRoot, 'config.json')
        ],
        settings: [
            path.resolve(process.cwd(), 'grid_settings.json'),
            path.resolve(workspaceRoot, 'okx_data/grid_settings.json'),
            path.resolve(skillRoot, 'grid_settings.json')
        ],
        auditLog: path.resolve(workspaceRoot, 'okx_data/logs/rescale_audit.json')
    };
}

function loadJSON(paths) {
    for (const p of paths) {
        if (fs.existsSync(p)) return { data: JSON.parse(fs.readFileSync(p, 'utf8')), path: p };
    }
    return null;
}

async function main() {
    const paths = getPaths();
    const authCfg = loadJSON(paths.auth);
    const settingsCfg = loadJSON(paths.settings);

    if (!authCfg || !settingsCfg) {
        console.error('Missing config.json or grid_settings.json');
        process.exit(1);
    }

    const client = new OKXClient(authCfg.data);
    const settings = settingsCfg.data;
    const CONFIG = settings[botType];

    if (!CONFIG) {
        console.error(`Bot type ${botType} not found in settings`);
        process.exit(1);
    }

    let auditEntry = { status: 'success', info: '' };

    try {
        // 1. 获取行情与仓位
        const [ticker, posData] = await Promise.all([
            client.request('/market/ticker', 'GET', { instId: CONFIG.instId }),
            client.request('/account/positions', 'GET', { instId: CONFIG.instId })
        ]);

        const currentPrice = parseFloat(ticker[0].last);
        let currentPos = 0, avgPx = 0;
        if (posData && posData.length > 0) {
            currentPos = parseFloat(posData[0].pos);
            avgPx = parseFloat(posData[0].avgPx);
        }

        // 2. Trailing/Rescale 逻辑
        const range = CONFIG.maxPrice - CONFIG.minPrice;
        const threshold = range * (CONFIG.trailingPercent || 0.1);
        let needsRescale = false;

        if (currentPrice > CONFIG.maxPrice - threshold || currentPrice < CONFIG.minPrice + threshold) {
            needsRescale = true;
        }

        if (needsRescale) {
            console.log(`[${botType}] Rescaling... (Price: ${currentPrice})`);
            // 取消当前网格订单
            const orders = await client.request('/trade/orders-pending', 'GET', { instId: CONFIG.instId });
            const toCancel = orders
                .filter(o => Math.abs(parseFloat(o.sz) - CONFIG.sizePerGrid) < 0.000001)
                .map(o => ({ instId: CONFIG.instId, ordId: o.ordId }));
            
            for (const o of toCancel) {
                await client.request('/trade/cancel-order', 'POST', JSON.stringify(o));
            }

            const newMin = currentPrice - (range / 2);
            const newMax = currentPrice + (range / 2);
            
            // 更新设置
            settings[botType].minPrice = Math.round(newMin);
            settings[botType].maxPrice = Math.round(newMax);
            fs.writeFileSync(settingsCfg.path, JSON.stringify(settings, null, 4));
            
            CONFIG.minPrice = Math.round(newMin);
            CONFIG.maxPrice = Math.round(newMax);
            auditEntry.rescaled = true;
        }

        // 3. 网格下单与保护
        const step = (CONFIG.maxPrice - CONFIG.minPrice) / (CONFIG.gridCount - 1);
        const grids = [];
        for (let i = 0; i < CONFIG.gridCount; i++) {
            grids.push(CONFIG.minPrice + (i * step));
        }

        const pendingOrders = await client.request('/trade/orders-pending', 'GET', { instId: CONFIG.instId });
        const activeOrders = new Map();
        pendingOrders.forEach(o => {
            if (Math.abs(parseFloat(o.sz) - CONFIG.sizePerGrid) < 0.000001) {
                activeOrders.set(Math.floor(parseFloat(o.px)), o.ordId);
            }
        });

        let placedBuy = 0, placedSell = 0, protectedSell = 0;
        const buffer = botType === 'micro' ? 0.001 : 0.003;
        const isOverloaded = CONFIG.maxPosition && currentPos >= CONFIG.maxPosition;
        const minProfitPx = CONFIG.minProfitGap ? (avgPx * (1 + CONFIG.minProfitGap)) : 0;

        for (const price of grids) {
            const diff = (price - currentPrice) / currentPrice;
            let side = '';
            if (diff > buffer) side = 'sell';
            else if (diff < -buffer) side = 'buy';
            else continue;

            const priceKey = Math.floor(price);
            if (!activeOrders.has(priceKey)) {
                if (side === 'buy' && isOverloaded) continue;
                if (side === 'sell' && currentPos > 0 && price < minProfitPx) {
                    protectedSell++; continue;
                }

                await client.request('/trade/order', 'POST', JSON.stringify({
                    instId: CONFIG.instId,
                    tdMode: 'cash',
                    side: side,
                    ordType: 'limit',
                    px: price.toFixed(1),
                    sz: CONFIG.sizePerGrid.toString()
                }));
                if (side === 'buy') placedBuy++; else placedSell++;
                await new Promise(r => setTimeout(r, 100));
            }
        }

        auditEntry.info = `Pos:${currentPos}, Px:${currentPrice}, B:${placedBuy}, S:${placedSell}, Prot:${protectedSell}`;
        console.log(`[${botType}] ${auditEntry.info}`);

        // 记录审计日志
        try {
            let logs = fs.existsSync(paths.auditLog) ? JSON.parse(fs.readFileSync(paths.auditLog, 'utf8')) : [];
            logs.push({ ts: new Date().toISOString(), botType, ...auditEntry });
            fs.mkdirSync(path.dirname(paths.auditLog), { recursive: true });
            fs.writeFileSync(paths.auditLog, JSON.stringify(logs.slice(-100), null, 2));
        } catch (e) {}

    } catch (e) {
        console.error(`[${botType}] Error:`, e.message);
    }
}

main();
