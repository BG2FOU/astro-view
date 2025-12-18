/**
 * 从金山文档同步观星地数据到 observatories.json
 * 数据源：https://www.kdocs.cn/l/cnxtcbkOwWMM
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 金山文档导出为CSV的URL（需要转换为导出链接）
const KDOCS_EXPORT_URL = 'https://www.kdocs.cn/l/cnxtcbkOwWMM';

/**
 * 从金山文档获取数据
 * 注意：金山文档可能需要特殊的API或导出URL
 * 这里提供基本框架，可能需要根据实际情况调整
 */
async function fetchKdocsData() {
  // 金山文档可以通过在URL后添加 ?export=xlsx 或其他参数来导出
  // 或者需要使用金山文档的API
  // 这里先提供一个基础实现
  
  console.log('正在从金山文档获取数据...');
  
  return new Promise((resolve, reject) => {
    https.get(KDOCS_EXPORT_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // 这里需要根据实际返回的数据格式进行解析
          // 如果是CSV格式，需要解析CSV
          // 如果是JSON格式，可以直接解析
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 解析CSV数据
 * @param {string} csvData - CSV格式的数据
 * @returns {Array} 解析后的数组
 */
function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const result = [];
  
  // 跳过第一行（表头）
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // 解析CSV行，处理引号内的逗号
    const columns = parseCSVLine(line);
    
    // D列到N列分别对应索引 3-13
    // D: 观星地ID, E: 观星地名称, F: 观星地纬度, G: 观星地经度
    // H: 波特尔光害等级, I: 中国暗夜环境等级, J: SQM值, K: 气候情况
    // L: 住宿情况, M: 备注, N: 观星地附图
    
    if (columns.length < 14) continue; // 确保有足够的列
    
    const observatory = {
      id: columns[3] || '',
      name: columns[4] || '',
      latitude: parseFloat(columns[5]) || 0,
      longitude: parseFloat(columns[6]) || 0,
      coordinates: `${columns[6]}°E,${columns[5]}°N`,
      bortle: columns[7] || '',
      standardLight: columns[8] || '',
      sqm: columns[9] || '',
      climate: columns[10] || '',
      accommodation: columns[11] || '',
      notes: columns[12] || '',
      image: columns[13] || ''
    };
    
    // 只添加有ID和名称的观星地
    if (observatory.id && observatory.name) {
      result.push(observatory);
    }
  }
  
  return result;
}

/**
 * 解析CSV行，处理引号内的逗号
 * @param {string} line - CSV行
 * @returns {Array} 列数组
 */
function parseCSVLine(line) {
  const columns = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  columns.push(current.trim());
  return columns;
}

/**
 * 使用xlsx库解析Excel数据（备选方案）
 * 需要安装 npm install xlsx
 */
async function fetchAndParseWithXLSX() {
  try {
    const XLSX = require('xlsx');
    
    // 尝试直接下载Excel文件
    // 金山文档可能支持 ?export=xlsx 参数
    const exportUrl = `${KDOCS_EXPORT_URL}?export=xlsx`;
    
    console.log(`正在下载Excel文件: ${exportUrl}`);
    
    return new Promise((resolve, reject) => {
      https.get(exportUrl, (res) => {
        const chunks = [];
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // 解析数据（从第二行开始，第一行是表头）
            const observatories = [];
            for (let i = 1; i < data.length; i++) {
              const row = data[i];
              if (!row || row.length < 14) continue;
              
              const observatory = {
                id: String(row[3] || ''),
                name: String(row[4] || ''),
                latitude: parseFloat(row[5]) || 0,
                longitude: parseFloat(row[6]) || 0,
                coordinates: `${row[6]}°E,${row[5]}°N`,
                bortle: String(row[7] || ''),
                standardLight: String(row[8] || ''),
                sqm: String(row[9] || ''),
                climate: String(row[10] || ''),
                accommodation: String(row[11] || ''),
                notes: String(row[12] || ''),
                image: String(row[13] || '')
              };
              
              if (observatory.id && observatory.name) {
                observatories.push(observatory);
              }
            }
            
            resolve(observatories);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('XLSX库未安装或加载失败，请运行: npm install xlsx');
    throw error;
  }
}

/**
 * 更新observatories.json文件
 * @param {Array} observatories - 观星地数据数组
 */
function updateObservatoriesJSON(observatories) {
  const filePath = path.join(__dirname, '../public/data/observatories.json');
  
  const data = {
    observatories: observatories,
    lastUpdated: new Date().toISOString(),
    source: '金山文档 | WPS云文档'
  };
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ 成功更新 ${observatories.length} 个观星地数据`);
  console.log(`✓ 文件已保存到: ${filePath}`);
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('===== 开始同步观星地数据 =====');
    console.log(`数据源: ${KDOCS_EXPORT_URL}`);
    console.log();
    
    // 尝试使用XLSX方式获取数据
    let observatories;
    try {
      observatories = await fetchAndParseWithXLSX();
    } catch (error) {
      console.log('XLSX方式失败，尝试CSV方式...');
      // 如果XLSX失败，尝试CSV方式
      const csvData = await fetchKdocsData();
      observatories = parseCSV(csvData);
    }
    
    if (!observatories || observatories.length === 0) {
      console.error('❌ 未获取到任何数据');
      process.exit(1);
    }
    
    console.log(`✓ 成功获取 ${observatories.length} 条数据`);
    
    // 更新JSON文件
    updateObservatoriesJSON(observatories);
    
    console.log();
    console.log('===== 同步完成 =====');
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main, fetchAndParseWithXLSX, parseCSV };
