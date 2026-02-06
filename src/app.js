// 全局变量
let map = null;
const markers = [];
let observatories = [];
let autoCheckInterval = null;
const AUTO_CHECK_INTERVAL = 300000; // 每 300 秒检查一次是否有新数据
let lastDataHash = null; // 用于检测数据是否改变
let currentObservatory = null; // 存储当前显示的观星地信息

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
    // 使用代理服务器方式，配置已在HTML中设置
    if (typeof CONFIG !== 'undefined' && CONFIG.AMAP_PROXY_URL) {
        window._AMapSecurityConfig = {
            serviceHost: CONFIG.AMAP_PROXY_URL
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
    // 进入新地点前先退出编辑模式
    toggleEditMode(false);
    
    // 保存当前观星地信息
    currentObservatory = observatory;
    
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
    
    // 处理附图（支持多张图片）
    const imageImg = document.getElementById('info-image');
    const imagePlaceholder = document.getElementById('info-image-placeholder');
    
    // 将图片转换为数组格式（向后兼容单张图片格式）
    let images = [];
    if (observatory.images && Array.isArray(observatory.images)) {
        images = observatory.images.filter(img => img && img.trim());
    } else if (observatory.image && observatory.image.trim()) {
        // 向后兼容旧数据格式
        images = [observatory.image];
    }
    
    if (images.length > 0) {
        // 显示第一张图片
        imageImg.src = images[0];
        imageImg.style.display = 'block';
        imagePlaceholder.style.display = 'none';
        
        // 处理图片加载错误
        imageImg.onerror = function() {
            imageImg.style.display = 'none';
            imagePlaceholder.style.display = 'flex';
            imagePlaceholder.textContent = '图片加载失败';
        };
        
        // 添加点击打开查看器功能
        imageImg.onclick = function() {
            openImageViewer(images, 0);
        };
        
        // 如果有多张图片，显示提示
        if (images.length > 1) {
            imagePlaceholder.textContent = `共 ${images.length} 张图片，点击查看`;
            imagePlaceholder.style.display = 'block';
            imagePlaceholder.style.position = 'absolute';
            imagePlaceholder.style.bottom = '5px';
            imagePlaceholder.style.right = '5px';
            imagePlaceholder.style.background = 'rgba(0, 0, 0, 0.7)';
            imagePlaceholder.style.color = 'white';
            imagePlaceholder.style.padding = '5px 10px';
            imagePlaceholder.style.borderRadius = '3px';
            imagePlaceholder.style.fontSize = '12px';
        }
    } else {
        // 无图片
        imageImg.style.display = 'none';
        imagePlaceholder.style.display = 'flex';
        imagePlaceholder.textContent = '暂无图片';
    }
    
    // 显示信息面板
    const infoPanel = document.getElementById('info-panel');
    infoPanel.classList.remove('hidden');
    
    // 初始化面板拖动和调整大小
    initPanelControls(infoPanel);
}

// 隐藏信息面板
function hideObservatoryInfo() {
    // 关闭详情时顺便退出编辑模式，避免残留的编辑状态影响下一个地点
    toggleEditMode(false);
    document.getElementById('info-panel').classList.add('hidden');
}

// 在高德地图中导航到观星地
function navigateToObservatory(observatory) {
    const lat = observatory.latitude;
    const lng = observatory.longitude;
    const name = observatory.name;
    
    // 获取当前设备类型
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(ua);
    
    // 使用高德地图官方 URI API
    // 参数说明：
    // - position: 经纬度坐标，格式为 lon,lat
    // - name: 自定义显示名称
    // - src: 来源信息，建议填写
    // - coordinate: 坐标系，gaode表示高德坐标（gcj02）
    // - callnative: 是否调起高德地图APP，移动端设为1，PC端设为0
    
    const position = `${lng},${lat}`;
    const callnative = isMobile ? 1 : 0;
    const url = `https://uri.amap.com/marker?position=${position}&name=${encodeURIComponent(name)}&src=BG2FOU&coordinate=gaode&callnative=1`;
    
    if (isMobile) {
        window.location.href = url;
    } else {
        window.open(url, '_blank');
    }
}

// ===================== 使用 Viewer.js 的图片查看器集成 =====================
let imageViewer = null; // 全局 Viewer 实例

function openImageViewer(images, startIndex = 0) {
    const container = document.getElementById('image-container');
    if (!container) return;
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建图片元素
    const imageArray = Array.isArray(images) ? images : [images];
    imageArray.forEach((url, index) => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = `观星地关联图片 ${index + 1}`;
        img.style.display = index === 0 ? 'block' : 'none';
        img.dataset.index = index;
        container.appendChild(img);
    });
    
    // 创建或更新 Viewer 实例
    if (imageViewer) {
        imageViewer.destroy();
    }
    
    imageViewer = new Viewer(container, {
        inline: false,
        viewed: true,
        navbar: true,
        toolbar: {
            zoomIn: true,
            zoomOut: true,
            oneToOne: true,
            reset: true,
            prev: true,
            play: false,
            next: true,
            rotateLeft: true,
            rotateRight: true,
            flipHorizontal: true,
            flipVertical: true,
            fullscreen: true,
            download: false
        },
        keyboard: {
            37: 'prev', // 左箭头
            39: 'next', // 右箭头
            107: 'zoomIn', // +
            109: 'zoomOut', // -
            48: 'reset', // 0
            49: 'oneToOne', // 1
            82: 'rotateRight', // R
            87: 'flipVertical', // W
            72: 'flipHorizontal', // H
            70: 'fullscreen', // F
            27: 'exit' // Esc
        },
        title: true,
        tooltip: true
    });
    
    // 显示指定索引的图片
    if (startIndex > 0 && startIndex < imageArray.length) {
        imageViewer.view(startIndex);
    } else {
        imageViewer.view(0);
    }
}

// ===================== 多图片表单处理函数 =====================

// 更新图片预览
function updateImagesPreview(textareaId, previewId) {
    const textarea = document.getElementById(textareaId);
    const preview = document.getElementById(previewId);
    
    if (!textarea || !preview) return;
    
    const urls = textarea.value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    
    preview.innerHTML = '';
    
    urls.forEach((url, index) => {
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML = `
            <img src="${url}" alt="Preview ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22monospace%22 font-size=%2212%22 fill=%22%23999%22%3E加载失败%3C/text%3E%3C/svg%3E'">
            <button type="button" class="delete-btn" title="删除">×</button>
        `;
        
        // 删除按钮事件
        item.querySelector('.delete-btn').addEventListener('click', () => {
            urls.splice(index, 1);
            textarea.value = urls.join('\n');
            updateImagesPreview(textareaId, previewId);
        });
        
        preview.appendChild(item);
    });
}

// 初始化多图片表单
function initMultiImageForms() {
    const formImagesTextarea = document.getElementById('form-images');
    const editImagesTextarea = document.getElementById('edit-images');
    
    if (formImagesTextarea) {
        formImagesTextarea.addEventListener('input', () => {
            updateImagesPreview('form-images', 'form-images-preview');
        });
    }
    
    if (editImagesTextarea) {
        editImagesTextarea.addEventListener('input', () => {
            updateImagesPreview('edit-images', 'edit-images-preview');
        });
    }
}

// 从图片URL文本获取数组
function parseImageUrls(text) {
    return text
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
}

// 将图片数组转换为文本格式
function imagesToText(images) {
    if (Array.isArray(images)) {
        return images.filter(img => img && img.trim()).join('\n');
    } else if (images && images.trim()) {
        return images;
    }
    return '';
}

// 初始化全局图片查看器
function initImageViewer() {
    imageViewerInstance = new ImageViewer();
}

// 打开图片查看器（支持多张图片）- 已通过 openImageViewer 函数实现

// 显示图片放大预览
function showImageOverlay(imageSrc) {
    // 如果是数组，使用 viewerjs；否则使用单张图片
    if (Array.isArray(imageSrc)) {
        openImageViewer(imageSrc, 0);
    } else {
        openImageViewer([imageSrc], 0);
    }
}

// 隐藏图片放大预览
function hideImageOverlay() {
    if (imageViewer) {
        imageViewer.destroy();
        imageViewer = null;
    }
}

// 初始化面板拖动和调整大小功能
function initPanelControls(panel) {
    const header = panel.querySelector('.panel-header');
    let isMoving = false;
    let isResizing = false;
    let startX, startY;
    let startLeft, startTop;
    let startWidth, startHeight;
    
    // 拖动功能
    header.addEventListener('mousedown', (e) => {
        if (e.target.id === 'close-btn') return;
        isMoving = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = panel.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
    });
    
    // 调整大小功能
    panel.addEventListener('mousedown', (e) => {
        // 检查是否点击在右下角调整大小区域
        const rect = panel.getBoundingClientRect();
        const isNearRight = e.clientX > rect.right - 20;
        const isNearBottom = e.clientY > rect.bottom - 20;
        
        if (isNearRight && isNearBottom) {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = rect.width;
            startHeight = rect.height;
            e.preventDefault();
        }
    });
    
    // 鼠标移动
    document.addEventListener('mousemove', (e) => {
        if (isMoving) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // 计算新位置，限制在视口内
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            const rect = panel.getBoundingClientRect();
            const minLeft = 10;
            const minTop = 10;
            const maxLeft = window.innerWidth - rect.width - 10;
            const maxTop = window.innerHeight - rect.height - 10;
            
            newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
            newTop = Math.max(minTop, Math.min(maxTop, newTop));
            
            // 转换为固定定位的坐标
            panel.style.position = 'fixed';
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
            panel.style.transform = 'none';
        }
        
        if (isResizing) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newWidth = startWidth + deltaX;
            let newHeight = startHeight + deltaY;
            
            // 限制最小尺寸
            newWidth = Math.max(280, newWidth);
            newHeight = Math.max(200, newHeight);
            
            // 限制最大尺寸
            const rect = panel.getBoundingClientRect();
            const maxWidth = window.innerWidth - rect.left - 10;
            const maxHeight = window.innerHeight - rect.top - 10;
            
            newWidth = Math.min(maxWidth, newWidth);
            newHeight = Math.min(maxHeight, newHeight);
            
            panel.style.width = newWidth + 'px';
            panel.style.height = newHeight + 'px';
        }
    });
    
    // 鼠标抬起
    document.addEventListener('mouseup', () => {
        isMoving = false;
        isResizing = false;
    });
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
    
    // 初始化多图片表单
    initMultiImageForms();
    
    // 关闭按钮
    document.getElementById('close-btn').addEventListener('click', hideObservatoryInfo);
    
    // 高德地图导航按钮
    const amapNavBtn = document.getElementById('amap-nav-btn');
    if (amapNavBtn) {
        amapNavBtn.addEventListener('click', () => {
            if (currentObservatory) {
                navigateToObservatory(currentObservatory);
            }
        });
    }

    // 图片放大预览关闭
    const imageOverlay = document.getElementById('image-overlay');
    if (imageOverlay) {
        imageOverlay.addEventListener('click', hideImageOverlay);
    }

    // 详情编辑按钮与编辑表单
    const editBtn = document.getElementById('edit-btn');
    const editCancel = document.getElementById('edit-cancel');
    const editForm = document.getElementById('edit-form');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (!currentObservatory) return;
            prefillEditForm(currentObservatory);
            toggleEditMode(true);
        });
    }
    if (editCancel) {
        editCancel.addEventListener('click', () => {
            toggleEditMode(false);
        });
    }
    if (editForm) {
        editForm.addEventListener('submit', submitObservatoryUpdate);
    }

    // 提交按钮
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', showSubmitPanel);
        /*
        submitBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = 'https://github.com/BG2FOU/astro-view/issues';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
    });
    */    
    }

    // 提交面板关闭按钮
    const submitCloseBtn = document.getElementById('submit-close-btn');
    if (submitCloseBtn) {
        submitCloseBtn.addEventListener('click', hideSubmitPanel);
    }

    // 表单提交
    const observatoryForm = document.getElementById('observatory-form');
    if (observatoryForm) {
        observatoryForm.addEventListener('submit', submitObservatory);
    }

    // 手动刷新按钮
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshObservatories);
    }

    // 顶部信息按钮与弹窗
    const infoBtn = document.getElementById('info-btn');
    const aboutDialog = document.getElementById('about-dialog');
    const aboutClose = document.getElementById('about-close');
    if (infoBtn && aboutDialog) {
        infoBtn.addEventListener('click', () => {
            aboutDialog.classList.remove('hidden');
        });
    }
    if (aboutClose && aboutDialog) {
        aboutClose.addEventListener('click', () => {
            aboutDialog.classList.add('hidden');
        });
    }
    // 点击遮罩层空白处关闭
    if (aboutDialog) {
        aboutDialog.addEventListener('click', (e) => {
            if (e.target === aboutDialog) {
                aboutDialog.classList.add('hidden');
            }
        });
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

// 打开/关闭编辑模式
function toggleEditMode(show) {
    const editContainer = document.getElementById('edit-container');
    if (!editContainer) return;
    if (show) {
        editContainer.classList.remove('hidden');
    } else {
        editContainer.classList.add('hidden');
        const statusEl = document.getElementById('edit-status');
        if (statusEl) {
            statusEl.classList.remove('show', 'success', 'error', 'loading', 'warning');
            statusEl.textContent = '';
        }
        const editForm = document.getElementById('edit-form');
        if (editForm) editForm.reset();
    }
}

// 预填充编辑表单
function prefillEditForm(obs) {
    const get = (id) => document.getElementById(id);
    get('edit-name').value = obs.name || '';
    get('edit-latitude').value = (obs.latitude ?? '').toString();
    get('edit-longitude').value = (obs.longitude ?? '').toString();
    get('edit-bortle').value = obs.bortle || '';
    get('edit-sqm').value = obs.sqm || '';
    get('edit-standard').value = obs.standardLight || '';
    get('edit-climate').value = obs.climate || '';
    get('edit-accommodation').value = obs.accommodation || '';
    get('edit-notes').value = obs.notes || '';
    
    // 处理图片：优先显示 images 数组，否则显示单个 image
    const imagesEl = get('edit-images');
    if (imagesEl) {
        const imageText = imagesToText(obs.images || obs.image || '');
        imagesEl.value = imageText;
        updateImagesPreview('edit-images', 'edit-images-preview');
    }
    
    // 保留向后兼容
    const imgEl = get('edit-image');
    if (imgEl) imgEl.value = obs.image || '';
}

// 构建修改Issue内容（本地或失败时备用）
function buildUpdateIssueBody(changes, original, updated) {
    let body = `### 目标观星地\n`;
    body += `- 名称: ${original.name}\n`;
    if (original.id) body += `- ID: ${original.id}\n`;
    body += `- 坐标: ${original.latitude}°N, ${original.longitude}°E\n\n`;

    body += `### 修改项\n`;
    if (!changes.length) {
        body += `无变更\n\n`;
    } else {
        changes.forEach(c => {
            body += `- ${c.field}: \`${c.before ?? '-'}\` → \`${c.after ?? '-'}\`\n`;
        });
        body += `\n`;
    }

    body += `### 更新后的完整条目（JSON）\n`;
    body += '```json\n' + JSON.stringify(updated, null, 2) + '\n```\n\n';
    body += `---\n*此 Issue 由前端自动提交系统生成*`;
    return body;
}

// 提交详情修改
async function submitObservatoryUpdate(e) {
    e.preventDefault();
    if (!currentObservatory) return;

    const statusEl = document.getElementById('edit-status');
    const submitBtn = document.querySelector('#edit-form .btn-submit');

    try {
        // 收集表单
        const form = document.getElementById('edit-form');
        const formData = new FormData(form);
        const lat = parseFloat(formData.get('latitude'));
        const lon = parseFloat(formData.get('longitude'));
        const latitude = Math.round(lat * 1000000) / 1000000;
        const longitude = Math.round(lon * 1000000) / 1000000;

        // 处理图片：优先使用新的 images 字段（多张），回退到 image 字段（单张）
        let images = parseImageUrls(formData.get('images') || '');
        if (images.length === 0) {
            const oldImage = formData.get('image');
            if (oldImage && oldImage.trim()) {
                images = [oldImage];
            }
        }
        
        const updated = {
            id: currentObservatory.id || '',
            name: formData.get('name'),
            latitude: latitude,
            longitude: longitude,
            coordinates: `${longitude}°E,${latitude}°N`,
            bortle: formData.get('bortle') || '-',
            standardLight: formData.get('standard') || '-',
            sqm: formData.get('sqm') || '-',
            climate: formData.get('climate') || '',
            accommodation: formData.get('accommodation') || '',
            notes: formData.get('notes') || '',
            images: images,
            image: images.length > 0 ? images[0] : ''
        };

        // 基本验证
        if (!updated.name || isNaN(updated.latitude) || isNaN(updated.longitude)) {
            throw new Error('请正确填写名称与坐标');
        }
        if (updated.latitude < -90 || updated.latitude > 90 || updated.longitude < -180 || updated.longitude > 180) {
            throw new Error('坐标范围不正确：纬度 [-90, 90]，经度 [-180, 180]');
        }

        // 计算变更
        const fields = ['name','latitude','longitude','bortle','standardLight','sqm','climate','accommodation','notes','image'];
        const changes = [];
        const original = { ...currentObservatory };
        fields.forEach(f => {
            const before = original[f] ?? '';
            const after = updated[f] ?? '';
            // 数值比较处理
            const isChanged = (typeof before === 'number' || typeof after === 'number')
                ? Number(before) !== Number(after)
                : String(before) !== String(after);
            if (isChanged) {
                changes.push({ field: f, before, after });
            }
        });

        if (changes.length === 0) {
            statusEl.textContent = 'ℹ️ 未检测到任何修改';
            statusEl.classList.add('show', 'warning');
            statusEl.classList.remove('success','error','loading');
            return;
        }

        // 显示加载状态
        statusEl.textContent = '📤 正在提交修改...';
        statusEl.classList.add('show', 'loading');
        statusEl.classList.remove('success','error','warning');
        if (submitBtn) submitBtn.disabled = true;

        const isLocalFile = window.location.protocol === 'file:';
        const issueTitle = `✏️ 修改观星地：${original.name}${original.id ? ' ('+original.id+')' : ''}`;
        const issueBody = buildUpdateIssueBody(changes, original, updated);

        if (isLocalFile) {
            const issueUrl = `https://github.com/BG2FOU/astro-view/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}&labels=${encodeURIComponent('信息修改')}`;
            statusEl.innerHTML = `🔗 本地环境无法直接提交<br>请点击 <a href="${issueUrl}" target="_blank" style="color: #3498db; text-decoration: underline; font-weight: bold;">此链接</a> 前往 GitHub 提交（需登录）`;
            statusEl.classList.remove('loading');
            statusEl.classList.add('warning');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        // 在线环境，调用 API
        const response = await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: original.id || '',
                original,
                updated,
                changes
            })
        });
        const result = await response.json();

        if (!response.ok || result.error) {
            const fallbackUrl = `https://github.com/BG2FOU/astro-view/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}&labels=${encodeURIComponent('信息修改')}`;
            statusEl.innerHTML = `⚠️ 自动提交失败（${result.message}）<br>请点击 <a href="${fallbackUrl}" target="_blank" style="color: #3498db; text-decoration: underline; font-weight: bold;">此链接</a> 前往 GitHub 手动提交`;
            statusEl.classList.remove('loading');
            statusEl.classList.add('warning');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        statusEl.innerHTML = `✅ 修改提交成功！已创建 <a href="${result.issueUrl}" target="_blank" style="color: #27ae60; text-decoration: underline;">GitHub Issue #${result.issueNumber}</a>`;
        statusEl.classList.remove('loading');
        statusEl.classList.add('success');

        // 可选：关闭编辑
        setTimeout(() => { toggleEditMode(false); }, 4000);

    } catch (err) {
        console.error('修改提交失败:', err);
        statusEl.textContent = `❌ 错误：${err.message}`;
        statusEl.classList.remove('loading');
        statusEl.classList.add('error');
    } finally {
        const submitBtn2 = document.querySelector('#edit-form .btn-submit');
        if (submitBtn2) submitBtn2.disabled = false;
    }
}

// 显示提交面板
function showSubmitPanel() {
    document.getElementById('submit-panel').classList.remove('hidden');
    // 清空表单状态
    document.getElementById('submit-status').classList.remove('show', 'success', 'error', 'loading');
}

// 隐藏提交面板
function hideSubmitPanel() {
    document.getElementById('submit-panel').classList.add('hidden');
}

// 构建 GitHub Issue 内容
function buildIssueBody(data) {
    let body = `## 观星地信息\n\n`;
    
    body += `**地点名称**: ${data.name}\n`;
    body += `**坐标**: ${data.latitude}°N, ${data.longitude}°E\n`;
    
    if (data.bortle && data.bortle !== '-') {
        body += `**波特尔光害等级**: ${data.bortle}\n`;
    }
    
    if (data.standardLight && data.standardLight !== '-') {
        body += `**中国暗夜环境等级**: ${data.standardLight}\n`;
    }
    
    if (data.sqm && data.sqm !== '-') {
        body += `**SQM值**: ${data.sqm} mag/arcsec²\n`;
    }
    
    body += `\n`;
    
    if (data.climate) {
        body += `### 气候情况\n${data.climate}\n\n`;
    }
    
    if (data.accommodation) {
        body += `### 住宿情况\n${data.accommodation}\n\n`;
    }
    
    if (data.notes) {
        body += `### 备注\n${data.notes}\n\n`;
    }
    
    // 支持多张图片
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        body += `### 附图\n`;
        data.images.forEach((imgUrl, index) => {
            body += `![观星地图片${index + 1}](${imgUrl})\n`;
        });
        body += `\n`;
    } else if (data.image) {
        body += `### 附图\n![观星地图片](${data.image})\n\n`;
    }
    
    body += `---\n`;
    body += `*此 Issue 由前端自动提交系统生成*\n`;
    
    return body;
}

// 提交观星地表单
async function submitObservatory(e) {
    e.preventDefault();
    
    const statusEl = document.getElementById('submit-status');
    const submitBtn = document.querySelector('.btn-submit');
    
    try {
        // 收集表单数据
        const formData = new FormData(document.getElementById('observatory-form'));
        const lat = parseFloat(formData.get('latitude'));
        const lon = parseFloat(formData.get('longitude'));
        // 保留6位小数精度
        const latitude = Math.round(lat * 1000000) / 1000000;
        const longitude = Math.round(lon * 1000000) / 1000000;
        
        // 处理图片：优先使用新的 images 字段（多张），回退到 image 字段（单张）
        let images = parseImageUrls(formData.get('images') || '');
        if (images.length === 0) {
            const oldImage = formData.get('image');
            if (oldImage && oldImage.trim()) {
                images = [oldImage];
            }
        }
        
        const data = {
            name: formData.get('name'),
            latitude: latitude,
            longitude: longitude,
            coordinates: `${longitude}°E,${latitude}°N`,
            bortle: formData.get('bortle') || '-',
            standardLight: formData.get('standard') || '-',
            sqm: formData.get('sqm') || '-',
            climate: formData.get('climate') || '',
            accommodation: formData.get('accommodation') || '',
            notes: formData.get('notes') || '',
            images: images,
            image: images.length > 0 ? images[0] : ''
        };

        // 基本验证
        if (!data.name || !data.latitude || !data.longitude) {
            throw new Error('请填写地点名称和坐标信息');
        }

        if (isNaN(data.latitude) || isNaN(data.longitude)) {
            throw new Error('坐标必须为有效的数字');
        }

        if (data.latitude < -90 || data.latitude > 90 || data.longitude < -180 || data.longitude > 180) {
            throw new Error('坐标范围不正确：纬度 [-90, 90]，经度 [-180, 180]');
        }

        // 显示加载状态
        statusEl.textContent = '📤 正在提交...';
        statusEl.classList.add('show', 'loading');
        statusEl.classList.remove('success', 'error', 'warning');
        submitBtn.disabled = true;

        // 检测是否在本地文件环境（file:// 协议）
        const isLocalFile = window.location.protocol === 'file:';
        
        if (isLocalFile) {
            // 本地环境：生成 GitHub Issue URL 供用户手动提交
            const issueTitle = `📍 提交新观星地：${data.name}`;
            const issueBody = buildIssueBody(data);
            const issueUrl = `https://github.com/BG2FOU/astro-view/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}&labels=新地点提交`;
            
            statusEl.innerHTML = `🔗 本地环境无法直接提交<br>请点击 <a href="${issueUrl}" target="_blank" style="color: #3498db; text-decoration: underline; font-weight: bold;">此链接</a> 前往 GitHub 提交（需登录）`;
            statusEl.classList.remove('loading');
            statusEl.classList.add('warning');
            submitBtn.disabled = false;
            return;
        }

        // 在线环境：调用 Cloudflare Pages Function API
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            // 如果服务端失败，提供手动提交链接
            const issueTitle = `📍 提交新观星地：${data.name}`;
            const issueBody = buildIssueBody(data);
            const issueUrl = `https://github.com/BG2FOU/astro-view/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}&labels=新地点提交`;
            
            statusEl.innerHTML = `⚠️ 自动提交失败（${result.message}）<br>请点击 <a href="${issueUrl}" target="_blank" style="color: #3498db; text-decoration: underline; font-weight: bold;">此链接</a> 前往 GitHub 手动提交`;
            statusEl.classList.remove('loading');
            statusEl.classList.add('warning');
            submitBtn.disabled = false;
            return;
        }

        // 成功
        statusEl.innerHTML = `✅ 提交成功！已创建 <a href="${result.issueUrl}" target="_blank" style="color: #27ae60; text-decoration: underline;">GitHub Issue #${result.issueNumber}</a>，系统将自动审核并更新`;
        statusEl.classList.remove('loading');
        statusEl.classList.add('success');
        
        // 清空表单
        document.getElementById('observatory-form').reset();

        // 5秒后自动关闭面板
        setTimeout(() => {
            hideSubmitPanel();
        }, 5000);

    } catch (error) {
        console.error('提交失败:', error);
        statusEl.textContent = `❌ 错误：${error.message}`;
        statusEl.classList.remove('loading');
        statusEl.classList.add('error');
    } finally {
        submitBtn.disabled = false;
    }
}


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