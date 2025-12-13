// 全局变量
let map = null;
const markers = [];
let observatories = [];
let autoCheckInterval = null;
const AUTO_CHECK_INTERVAL = 300000; // 每 300 秒检查一次是否有新数据
let lastDataHash = null; // 用于检测数据是否改变

// 图层管理变量
let currentLayer = 'standard'; // 当前图层类型
let satelliteLayer = null; // 卫星图层
let roadNetLayer = null; // 路网图层

// 波特尔光害等级映射表
const BORTLE_LEVELS = {
    '1': '1级 / 极限星等 7.6~8.0',
    '2': '2级 / 极限星等 7.1~7.5',
    '3': '3级 / 极限星等 6.6~7.0',
    '4': '4级 / 极限星等 6.1~6.5',
    '5': '5级 / 极限星等 5.6~6.0',
    '6': '6级 / 极限星等 5.1~5.5',
    '7': '7级 / 极限星等 4.6~5.0',
    '8': '8级 / 极限星等 4.1~4.5',
    '9': '9级 / 极限星等 4.0'
};

// 中国暗夜环境等级映射表（包含颜色）
const STANDARD_LIGHT_LEVELS = {
    '1': { label: '1级 (优秀)', color: '#27ae60' },      // 绿色
    '2': { label: '2级 (良好)', color: '#27ae60' },      // 绿色
    '3': { label: '3级 (一般)', color: '#f39c12' },      // 黄色
    '4': { label: '4级 (较差)', color: '#e67e22' },      // 橙色
    '5': { label: '5级 (严重)', color: '#e74c3c' },      // 红色
    '5+': { label: '5级+ (极度严重)', color: '#e74c3c' } // 红色
};

// 生成数据的简单哈希值（用于检测数据变化）
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为 32 位整数
    }
    return hash.toString();
}

// 手动刷新数据（点击刷新按钮时调用）
function refreshObservatories() {
    console.log('手动刷新观星地数据...');
    if (map) {
        loadObservatories(AMap || window.AMapGlobal);
    }
}

// 启动自动检查 JSON 更新
function startAutoCheckForUpdates() {
    if (autoCheckInterval) {
        clearInterval(autoCheckInterval);
    }
    
    console.log(`启动自动检查（每 ${AUTO_CHECK_INTERVAL / 1000} 秒检查一次 JSON 更新）`);
    
    autoCheckInterval = setInterval(async () => {
        try {
            // 获取最新数据
            const timestamp = new Date().getTime();
            const response = await fetch(`public/data/observatories.json?t=${timestamp}`, {
                cache: 'no-store'
            });
            
            if (!response.ok) return;
            
            const data = await response.json();
            const observatoriesData = data.observatories || [];
            const newDataHash = simpleHash(JSON.stringify(observatoriesData));
            
            // 如果数据有变化，自动刷新地图
            if (lastDataHash && newDataHash !== lastDataHash) {
                console.log('检测到 JSON 数据更新，自动刷新地图...');
                loadObservatories(AMap || window.AMapGlobal);
            }
        } catch (error) {
            console.error('检查 JSON 更新失败:', error);
        }
    }, AUTO_CHECK_INTERVAL);
}

// 初始化安全配置
function setupAMapSecurity() {
    if (typeof CONFIG !== 'undefined' && CONFIG.AMAP_SECURITY_JS_CODE) {
        window._AMapSecurityConfig = {
            securityJsCode: CONFIG.AMAP_SECURITY_JS_CODE
        };
    }
}

// 初始化地图
function initMap(AMap) {
    try {
        // 创建地图实例
        map = new AMap.Map('map', {
            viewMode: '2D',  // 默认使用 2D 模式
            zoom: 5,         // 初始化地图级别
            center: [104.065540, 30.572815], // 中国中心坐标
            resizeEnable: true
        });

        // 初始化卫星图层和路网图层
        satelliteLayer = new AMap.TileLayer.Satellite();
        roadNetLayer = new AMap.TileLayer.RoadNet();

        // 设置图层控件事件
        setupLayerControl(AMap);

        // 等待地图加载完成
        map.on('complete', function() {
            console.log('地图加载完成');
            loadObservatories(AMap);
        });

    } catch (error) {
        console.error('创建地图失败:', error);
        document.getElementById('map').innerHTML = 
            `<div style="padding: 20px; color: red;">错误：创建地图失败 - ${error.message}</div>`;
    }
}

// 设置图层控件
function setupLayerControl(AMap) {
    const radioButtons = document.querySelectorAll('input[name="layer"]');
    const roadnetCheckbox = document.getElementById('roadnet-toggle');

    // 图层单选按钮事件
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'standard') {
                switchToStandardLayer();
            } else if (this.value === 'satellite') {
                switchToSatelliteLayer();
            }
        });
    });

    // 路网复选框事件
    roadnetCheckbox.addEventListener('change', function() {
        if (currentLayer === 'satellite') {
            if (this.checked) {
                roadNetLayer.setMap(map);
                console.log('已开启路网');
            } else {
                roadNetLayer.setMap(null);
                console.log('已关闭路网');
            }
        }
    });
}

// 切换到标准图层
function switchToStandardLayer() {
    if (currentLayer === 'standard') return;
    
    // 隐藏卫星图层和路网
    satelliteLayer.setMap(null);
    roadNetLayer.setMap(null);
    
    // 恢复默认图层（标准图层自动存在）
    currentLayer = 'standard';
    
    // 重置路网复选框
    document.getElementById('roadnet-toggle').checked = false;
    document.getElementById('roadnet-toggle').disabled = true;
    
    console.log('已切换到标准图层');
}

// 切换到卫星图层
function switchToSatelliteLayer() {
    if (currentLayer === 'satellite') return;
    
    // 显示卫星图层
    satelliteLayer.setMap(map);
    
    currentLayer = 'satellite';
    
    // 启用路网复选框
    document.getElementById('roadnet-toggle').disabled = false;
    
    // 如果路网复选框被勾选，也显示路网
    if (document.getElementById('roadnet-toggle').checked) {
        roadNetLayer.setMap(map);
    }
    
    console.log('已切换到卫星图层');
}

// 加载观星地数据
async function loadObservatories(AMap) {
    try {
        // 保存 AMap 对象供刷新函数使用
        window.AMapGlobal = AMap;
        
        // 添加时间戳参数强制刷新缓存（cache busting）
        const timestamp = new Date().getTime();
        const response = await fetch(`public/data/observatories.json?t=${timestamp}`, {
            cache: 'no-store'  // 禁用缓存
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        observatories = data.observatories || [];
        
        // 检测数据是否改变
        const newDataHash = simpleHash(JSON.stringify(observatories));
        if (lastDataHash !== newDataHash) {
            console.log('观星地数据已更新，刷新地图');
            lastDataHash = newDataHash;
            addMarkers(AMap);
        }
        
        // 更新最后更新时间
        updateLastModifiedTime();
        console.log(`已加载 ${observatories.length} 个观星地`);
        
        // 启动自动检查（仅在首次加载时启动）
        if (!autoCheckInterval) {
            startAutoCheckForUpdates();
        }
    } catch (error) {
        console.error('加载观星地数据失败:', error);
        document.getElementById('map').innerHTML += 
            `<div style="padding: 20px; color: #ff6b6b;">加载数据失败: ${error.message}</div>`;
    }
}

// 添加标记到地图
function addMarkers(AMap) {
    // 清除现有标记
    if (markers.length > 0) {
        map.remove(markers);
        markers.length = 0;
    }

    observatories.forEach((observatory) => {
        // 创建自定义标记内容
        const markerContent = document.createElement('div');
        markerContent.innerHTML = `
            <svg width="32" height="40" viewBox="0 0 32 40" style="display: block; cursor: pointer;">
                <path d="M 16 0 C 8.268 0 2 6.268 2 14 C 2 24 16 40 16 40 C 16 40 30 24 30 14 C 30 6.268 23.732 0 16 0 Z" 
                      fill="#FF6B6B" stroke="#fff" stroke-width="2"/>
                <circle cx="16" cy="14" r="6" fill="#fff"/>
            </svg>
        `;

        // 创建标记实例
        const marker = new AMap.Marker({
            position: new AMap.LngLat(observatory.longitude, observatory.latitude),
            content: markerContent,
            title: observatory.name,
            anchor: 'bottom-center',  // 锚点位置
            offset: new AMap.Pixel(0, 0)
        });

        // 绑定点击事件
        marker.on('click', function() {
            showObservatoryInfo(observatory);
        });

        // 添加到地图
        map.add(marker);
        markers.push(marker);
    });

    // 自动调整地图视野以显示所有标记
    if (markers.length > 0) {
        map.setFitView(markers, false, [50, 50, 50, 50]);
    }
}

// 显示观星地详细信息
function showObservatoryInfo(observatory) {
    document.getElementById('info-name').textContent = observatory.name;
    document.getElementById('info-coordinates').textContent = 
        `${observatory.latitude.toFixed(4)}°N, ${observatory.longitude.toFixed(4)}°E`;
    
    // 波特尔光害等级转换
    const bortleLevel = String(observatory.bortle || '-');
    const bortleLabel = BORTLE_LEVELS[bortleLevel] || `${bortleLevel} 级`;
    document.getElementById('info-bortle').textContent = bortleLabel;
    
    // 中国暗夜环境等级转换（带颜色）
    const standardLevel = String(observatory.standardLight || '-');
    const standardLevelInfo = STANDARD_LIGHT_LEVELS[standardLevel];
    const standardContainer = document.getElementById('info-standard');
    
    if (standardLevelInfo) {
        standardContainer.innerHTML = `<span class="level-badge" style="background-color: ${standardLevelInfo.color}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">${standardLevelInfo.label}</span>`;
    } else {
        standardContainer.textContent = `${standardLevel} 级`;
    }
    
    document.getElementById('info-sqm').textContent = 
        `${observatory.sqm || '-'} mag/arcsec²`;
    document.getElementById('info-climate').textContent = 
        observatory.climate || '未记录';
    document.getElementById('info-accommodation').textContent = 
        observatory.accommodation || '未记录';
    document.getElementById('info-notes').textContent = 
        observatory.notes || '暂无备注';
    
    // 处理附图
    const imageImg = document.getElementById('info-image');
    const imagePlaceholder = document.getElementById('info-image-placeholder');
    
    if (observatory.image && observatory.image.trim()) {
        // 有图片链接
        imageImg.src = observatory.image;
        imageImg.style.display = 'block';
        imagePlaceholder.style.display = 'none';
        
        // 处理图片加载错误
        imageImg.onerror = function() {
            imageImg.style.display = 'none';
            imagePlaceholder.style.display = 'block';
            imagePlaceholder.textContent = '图片加载失败';
        };
    } else {
        // 无图片
        imageImg.style.display = 'none';
        imagePlaceholder.style.display = 'block';
        imagePlaceholder.textContent = '暂无图片';
    }
    
    // 显示信息面板
    document.getElementById('info-panel').classList.remove('hidden');
}

// 隐藏信息面板
function hideObservatoryInfo() {
    document.getElementById('info-panel').classList.add('hidden');
}

// 更新最后更新时间
function updateLastModifiedTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('update-time').textContent = timeStr;
}

// 事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 初始化路网复选框为禁用状态（因为默认是标准图层）
    document.getElementById('roadnet-toggle').disabled = true;
    
    // 关闭按钮
    document.getElementById('close-btn').addEventListener('click', hideObservatoryInfo);
    
    // 点击面板外部关闭
    document.getElementById('info-panel').addEventListener('click', function(e) {
        if (e.target.id === 'info-panel') {
            hideObservatoryInfo();
        }
    });

    // 手动刷新按钮
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshObservatories);
    }

    // 检查 AMapLoader 是否已加载
    if (typeof AMapLoader !== 'undefined') {
        loadAMapWithLoader();
    } else {
        console.error('AMapLoader 未定义，请检查 loader.js 是否正确加载');
        document.getElementById('map').innerHTML = 
            '<div style="padding: 20px; color: red;">错误：AMapLoader 加载失败</div>';
    }
});

// 使用 AMapLoader 加载地图 SDK（官方推荐方式）
function loadAMapWithLoader() {
    // 设置安全密钥（必须在加载 SDK 之前）
    setupAMapSecurity();

    // 使用 AMapLoader 加载 SDK
    AMapLoader.load({
        key: CONFIG.AMAP_API_KEY,  // 申请好的 Web 端开发 Key
        version: "2.0",             // 指定要加载的 JSAPI 的版本
        plugins: []                 // 如需要可添加插件
    })
    .then((AMap) => {
        console.log('高德地图 SDK 加载成功');
        initMap(AMap);
    })
    .catch((e) => {
        console.error('高德地图 SDK 加载失败:', e);
        document.getElementById('map').innerHTML = 
            `<div style="padding: 20px; color: red;">错误：地图加载失败，请检查 API Key 配置和网络连接 - ${e.message}</div>`;
    });
}