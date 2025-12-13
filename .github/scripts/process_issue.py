#!/usr/bin/env python3
"""
处理 GitHub Issue 并自动更新 observatories.json
"""

import os
import json
import re
import sys
from pathlib import Path

# 从环境变量读取
ISSUE_BODY = os.getenv('ISSUE_BODY', '')
ISSUE_NUMBER = os.getenv('ISSUE_NUMBER', '')
ISSUE_TITLE = os.getenv('ISSUE_TITLE', '')

# JSON 文件路径
JSON_PATH = Path('public/data/observatories.json')

def parse_issue_body(body):
    """解析 Issue 正文，提取观星地数据"""
    
    data = {}
    
    # 使用正则表达式提取字段
    patterns = {
        'id': r'(?:id|ID):\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
        'name': r'name:\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
        'latitude': r'latitude:\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
        'longitude': r'longitude:\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
        'bortle': r'bortle:\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
        'standardLight': r'standardLight:\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
        'sqm': r'sqm:\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
        'climate': r'climate:\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
        'accommodation': r'accommodation:\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
        'notes': r'notes:\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
        'image': r'image:\s*(?:\n```\n)?(.*?)(?:\n```)?(?:\n|$)',
    }
    
    for field, pattern in patterns.items():
        match = re.search(pattern, body, re.DOTALL | re.IGNORECASE)
        if match:
            value = match.group(1).strip()
            data[field] = value
    
    # 检查是否是更新模式
    is_update = '更新现有观星地' in body or '- [x] 更新现有观星地' in body
    is_add = '添加新的观星地' in body or '- [x] 添加新的观星地' in body
    
    return data, is_update, is_add


def validate_data(data, is_update):
    """验证数据是否有效"""
    
    errors = []
    
    # 检查必填字段
    required_fields = ['name', 'latitude', 'longitude', 'bortle', 'standardLight', 'sqm', 'climate', 'accommodation', 'notes']
    
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f"缺少必填字段: {field}")
    
    # 如果是更新，检查 ID
    if is_update:
        if 'id' not in data or not data['id']:
            errors.append("更新操作需要提供观星地 ID")
    
    # 验证纬度和经度
    try:
        if 'latitude' in data and data['latitude']:
            lat = float(data['latitude'])
            if not (-90 <= lat <= 90):
                errors.append(f"纬度必须在 -90 到 90 之间，当前值: {lat}")
    except ValueError:
        errors.append(f"纬度必须是有效的数字，当前值: {data.get('latitude')}")
    
    try:
        if 'longitude' in data and data['longitude']:
            lon = float(data['longitude'])
            if not (-180 <= lon <= 180):
                errors.append(f"经度必须在 -180 到 180 之间，当前值: {lon}")
    except ValueError:
        errors.append(f"经度必须是有效的数字，当前值: {data.get('longitude')}")
    
    # 验证波特尔等级
    if 'bortle' in data and data['bortle']:
        if data['bortle'] not in ['1', '2', '3', '4', '5', '6', '7', '8', '9']:
            errors.append(f"波特尔光害等级必须是 1-9，当前值: {data['bortle']}")
    
    # 验证中国暗夜等级
    if 'standardLight' in data and data['standardLight']:
        valid_levels = ['1', '2', '3', '4', '5', '5+']
        if data['standardLight'] not in valid_levels:
            errors.append(f"中国暗夜环境等级必须是 1-5 或 5+，当前值: {data['standardLight']}")
    
    return len(errors) == 0, errors


def load_json():
    """加载当前 JSON 文件"""
    if JSON_PATH.exists():
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        return {'observatories': []}


def save_json(data):
    """保存 JSON 文件"""
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def generate_id(name):
    """根据名称生成唯一 ID"""
    # 将中文名称转换为拼音或英文表示
    base_id = name.lower().replace(' ', '-')
    # 移除特殊字符
    base_id = re.sub(r'[^a-z0-9\-]', '', base_id)
    return base_id


def process_observatory(data, is_update, is_add):
    """处理观星地数据"""
    
    json_data = load_json()
    observatories = json_data.get('observatories', [])
    
    # 生成坐标字符串
    if 'latitude' in data and 'longitude' in data:
        data['coordinates'] = f"{data['longitude']}°E,{data['latitude']}°N"
    
    # 确保有 ID
    if not data.get('id'):
        data['id'] = generate_id(data.get('name', f'observatory_{ISSUE_NUMBER}'))
    
    # 如果 image 字段为空，确保它是空字符串
    if 'image' not in data:
        data['image'] = ''
    
    # 检查是否已存在（用于更新）
    existing_index = -1
    for idx, obs in enumerate(observatories):
        if obs.get('id') == data['id']:
            existing_index = idx
            break
    
    message = ""
    
    if is_update:
        if existing_index >= 0:
            # 更新现有数据
            for key in ['name', 'latitude', 'longitude', 'coordinates', 'bortle', 'standardLight', 'sqm', 'climate', 'accommodation', 'notes', 'image']:
                if key in data:
                    observatories[existing_index][key] = data[key]
            message = f"✅ 已更新观星地: **{data.get('name')}**\n- ID: `{data.get('id')}`"
        else:
            raise ValueError(f"找不到要更新的观星地，ID: {data.get('id')}")
    else:
        # 添加新数据
        if existing_index >= 0:
            raise ValueError(f"观星地 ID '{data['id']}' 已存在，请使用不同的 ID 或选择更新现有观星地")
        
        observatories.append(data)
        message = f"✅ 已添加新观星地: **{data.get('name')}**\n- ID: `{data.get('id')}`\n- 坐标: {data.get('coordinates')}"
    
    json_data['observatories'] = observatories
    save_json(json_data)
    
    return message


def main():
    """主函数"""
    
    try:
        # 检查是否是观星地相关的 Issue
        if '[观星地]' not in ISSUE_TITLE and 'data-update' not in ISSUE_TITLE.lower():
            print("::set-output name=success::false")
            print("::set-output name=error::这不是观星地更新 Issue")
            return
        
        # 解析 Issue 内容
        data, is_update, is_add = parse_issue_body(ISSUE_BODY)
        
        if not is_update and not is_add:
            raise ValueError("请明确选择是添加新的观星地还是更新现有观星地")
        
        # 验证数据
        is_valid, errors = validate_data(data, is_update)
        if not is_valid:
            print("::set-output name=success::false")
            error_msg = '\n'.join(errors)
            print(f"::set-output name=error::{error_msg}")
            return
        
        # 处理数据
        message = process_observatory(data, is_update, is_add)
        
        print("::set-output name=success::true")
        print(f"::set-output name=message::{message}")
        
    except Exception as e:
        print("::set-output name=success::false")
        print(f"::set-output name=error::{str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
