# Git 数据管理工作流

## 工作流说明

### 添加观星地

1. 编辑 `public/data/observatories.json`
2. 添加新观星地对象到 `observatories` 数组
3. 提交并推送

```bash
git add public/data/observatories.json
git commit -m "Add: 新增观星地 - 泰山观测点"
git push origin main
```

### 修改观星地信息

```bash
git add public/data/observatories.json
git commit -m "Update: 修改观星地信息 - 峨眉山观测点"
git push origin main
```

### 删除观星地

从 JSON 中删除对应对象即可：

```bash
git add public/data/observatories.json
git commit -m "Delete: 删除观星地 - 华山观测点"
git push origin main
```

## 注意事项

1. **保证 JSON 格式有效**
   - 使用在线 JSON 验证器检查
   - 或在浏览器控制台测试：`JSON.parse(data)`

2. **字段必填项**
   - `id`：唯一标识，使用英文小写 + 下划线
   - `name`：观星地名称
   - `latitude`：纬度（-90 ~ 90）
   - `longitude`：经度（-180 ~ 180）

3. **可选字段如果为空，使用空字符串或 null**
   ```json
   "notes": "",
   "accommodation": null
   ```

## 自动部署配置

### GitHub Actions 配置（.github/workflows/deploy.yml）

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Inject API Key
        run: sed -i "s/__AMAP_API_KEY__/${{ secrets.AMAP_API_KEY }}/g" index.html
      - name: Deploy to Pages
        uses: actions/upload-artifact@v3
        with:
          name: site
          path: .
```

## 数据验证脚本（可选）

创建 `scripts/validate.js`：

```javascript
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('public/data/observatories.json', 'utf8'));

data.observatories.forEach((obs, i) => {
    if (!obs.id || !obs.name || typeof obs.latitude !== 'number' || typeof obs.longitude !== 'number') {
        throw new Error(`Invalid observatory at index ${i}: ${JSON.stringify(obs)}`);
    }
    if (obs.latitude < -90 || obs.latitude > 90 || obs.longitude < -180 || obs.longitude > 180) {
        throw new Error(`Invalid coordinates at index ${i}: ${obs.latitude}, ${obs.longitude}`);
    }
});

console.log('✓ 数据验证通过，共', data.observatories.length, '个观星地');
```

使用：
```bash
node scripts/validate.js
```

## 协作建议

1. 每次修改一个观星地的多个字段
2. 提交信息清晰：`Add/Update/Delete: 具体描述`
3. 定期检查 JSON 文件完整性
4. 使用 `.gitignore` 忽略本地测试配置
