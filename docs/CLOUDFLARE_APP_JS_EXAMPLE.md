// 这个文件展示了如何修改 src/app.js 以支持 Cloudflare Workers
// 只需要修改顶部的配置加载部分

/**
 * ============ 修改部分 ============
 * 这些修改应该添加到 src/app.js 的最上面
 */

// 全局配置对象（从 Worker 动态加载）
let CONFIG = {
    AMAP_API_KEY: '',
    AMAP_SECURITY_JS_CODE: ''
};

// 是否在本地开发模式（使用 src/config.js）
const isLocalDevelopment = !window.location.hostname.includes('cloudflare');

/**
 * 从 Cloudflare Worker 加载配置
 * 在生产环境（Cloudflare Pages）中使用
 */
async function loadConfigFromWorker() {
    try {
        console.log('[CONFIG] Loading from Cloudflare Worker...');
        
        // 方式 1：一次性获取两个配置
        const response = await fetch('/api/amap-config', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            CONFIG.AMAP_API_KEY = data.key;
            CONFIG.AMAP_SECURITY_JS_CODE = data.code;
            console.log('[CONFIG] Loaded from Worker successfully');
            return true;
        } else {
            throw new Error('Worker returned error: ' + data.error);
        }
    } catch (error) {
        console.error('[CONFIG] Failed to load from Worker:', error);
        
        // 降级方案：尝试逐个加载
        try {
            await loadApiKeyFromWorker();
            await loadSecurityCodeFromWorker();
            return true;
        } catch (fallbackError) {
            console.error('[CONFIG] Fallback failed too:', fallbackError);
            return false;
        }
    }
}

/**
 * 加载 API Key（逐个加载，更稳定）
 */
async function loadApiKeyFromWorker() {
    const response = await fetch('/api/amap-key');
    const data = await response.json();
    CONFIG.AMAP_API_KEY = data.key;
    console.log('[CONFIG] API Key loaded');
}

/**
 * 加载 Security Code（逐个加载，更稳定）
 */
async function loadSecurityCodeFromWorker() {
    const response = await fetch('/api/amap-security');
    const data = await response.json();
    CONFIG.AMAP_SECURITY_JS_CODE = data.code;
    console.log('[CONFIG] Security Code loaded');
}

/**
 * 使用本地配置（仅限开发环境）
 * 该文件应在 .gitignore 中
 */
async function loadConfigLocal() {
    try {
        console.log('[CONFIG] Loading from local config.js...');
        // src/config.js 中定义的全局 CONFIG 对象
        if (typeof window.CONFIG !== 'undefined') {
            CONFIG = window.CONFIG;
            console.log('[CONFIG] Loaded from local config.js');
            return true;
        }
        return false;
    } catch (error) {
        console.error('[CONFIG] Failed to load local config:', error);
        return false;
    }
}

/**
 * 初始化配置（在 DOMContentLoaded 前调用）
 */
async function initializeConfig() {
    console.log('[CONFIG] Starting initialization...');
    
    // 在本地开发模式下使用本地配置
    if (isLocalDevelopment || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('[CONFIG] Local development mode detected');
        const localLoaded = await loadConfigLocal();
        if (localLoaded) {
            return true;
        }
    }
    
    // 在生产环境（Cloudflare）下从 Worker 加载
    console.log('[CONFIG] Production mode, loading from Worker');
    const workerLoaded = await loadConfigFromWorker();
    
    if (!workerLoaded) {
        console.error('[CONFIG] Failed to load configuration from any source!');
        return false;
    }
    
    return true;
}

/**
 * ============ setupAMapSecurity 函数修改 ============
 * 在原来的 setupAMapSecurity 函数中，无需改动
 * 只需确保 CONFIG 已初始化即可
 */
function setupAMapSecurity() {
    if (!CONFIG.AMAP_SECURITY_JS_CODE) {
        console.error('Security code not loaded!');
        return;
    }
    
    window._AMapSecurityConfig = {
        securityJsCode: CONFIG.AMAP_SECURITY_JS_CODE,
        securityJsUrl: 'https://webapi.amap.com/maps/js/sec/amap_sec_z.js'
    };
    
    console.log('[AMAP] Security config set');
}

/**
 * ============ loadAMapWithLoader 函数修改 ============
 * 修改 API Key 的来源
 */
function loadAMapWithLoader() {
    if (!CONFIG.AMAP_API_KEY) {
        console.error('API Key not loaded!');
        return;
    }
    
    return new Promise((resolve, reject) => {
        AMapLoader.load({
            key: CONFIG.AMAP_API_KEY,  // 使用动态加载的 Key
            version: '2.0',
            plugins: ['AMap.PolylineEditor']
        }).then((AMap) => {
            console.log('[AMAP] AMapLoader loaded successfully');
            initMap(AMap);
            loadObservatories(AMap);
            resolve(AMap);
        }).catch((error) => {
            console.error('[AMAP] AMapLoader failed:', error);
            reject(error);
        });
    });
}

/**
 * ============ DOMContentLoaded 事件监听器 ============
 * 修改初始化顺序
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[APP] DOMContentLoaded fired');
    
    try {
        // 第一步：初始化配置
        console.log('[APP] Step 1: Initializing configuration...');
        const configReady = await initializeConfig();
        
        if (!configReady) {
            console.error('[APP] Configuration initialization failed');
            alert('Failed to load configuration. Please refresh the page.');
            return;
        }
        
        console.log('[APP] Configuration loaded successfully');
        
        // 第二步：设置高德地图安全配置
        console.log('[APP] Step 2: Setting up AMap security...');
        setupAMapSecurity();
        
        // 第三步：加载高德地图
        console.log('[APP] Step 3: Loading AMap...');
        const AMap = await loadAMapWithLoader();
        
        // 第四步：初始化事件监听器
        console.log('[APP] Step 4: Setting up event listeners...');
        document.getElementById('refreshBtn').addEventListener('click', refreshObservatories);
        document.getElementById('closePanelBtn').addEventListener('click', hideObservatoryInfo);
        
        document.getElementById('infoPanel').addEventListener('click', (e) => {
            if (e.target === document.getElementById('infoPanel')) {
                hideObservatoryInfo();
            }
        });
        
        // 第五步：启动自动更新
        console.log('[APP] Step 5: Starting auto-refresh...');
        startAutoCheckForUpdates();
        
        console.log('[APP] Initialization complete!');
    } catch (error) {
        console.error('[APP] Initialization error:', error);
        alert('Application initialization failed. Check console for details.');
    }
});

/**
 * ============ 开发调试函数 ============
 * 用于测试配置加载
 */
window.debugConfig = function() {
    console.log('=== CONFIG Debug Info ===');
    console.log('API Key:', CONFIG.AMAP_API_KEY ? 'Loaded ✓' : 'Not loaded ✗');
    console.log('Security Code:', CONFIG.AMAP_SECURITY_JS_CODE ? 'Loaded ✓' : 'Not loaded ✗');
    console.log('Is Local Dev:', isLocalDevelopment);
    console.log('Hostname:', window.location.hostname);
    console.log('Full CONFIG:', CONFIG);
    console.log('=========================');
};

// 在控制台可以运行 debugConfig() 来检查配置
