#!/usr/bin/env python3
"""
处理 GitHub Issue 并自动更新 observatories.json
"""

import os
import json
import re
import sys
#import time
from pathlib import Path

# 从环境变量读取
ISSUE_BODY = os.getenv('ISSUE_BODY', '')
ISSUE_NUMBER = os.getenv('ISSUE_NUMBER', '')
ISSUE_TITLE = os.getenv('ISSUE_TITLE', '')

# JSON 文件路径
JSON_PATH = Path('public/data/observatories.json')

def parse_issue_body(body):
    """解析 Issue 正文，提取观星地数据（支持前端新增与前端更新JSON、模板两种格式）"""

    data = {}

    # 是否前端自动提交
    is_frontend_submit = '此 Issue 由前端自动提交系统生成' in body or '此 Issue 由自动提交系统生成' in body

    # 1) 优先：检测“更新后的完整条目（JSON）”块（用于前端编辑更新）
    json_block = re.search(r'更新后的完整条目（JSON）[\s\S]*?```json\n([\s\S]*?)\n```', body)
    if json_block:
        try:
            updated_obj = json.loads(json_block.group(1))
            if isinstance(updated_obj, dict):
                data.update(updated_obj)
                is_update = True
                is_add = False
                return data, is_update, is_add
        except Exception:
            # JSON 解析失败则继续其它规则
            pass

    # 2) 前端新增（无JSON块，纯 Markdown 字段）
    if is_frontend_submit:
        name_match = re.search(r'\*\*地点名称\*\*:\s*(.*?)(?:\n|$)', body)
        if name_match:
            data['name'] = name_match.group(1).strip()

        coord_match = re.search(r'\*\*坐标\*\*:\s*([\d.]+)°[NS],\s*([\d.]+)°[EW]', body)
        if coord_match:
            data['latitude'] = coord_match.group(1)
            data['longitude'] = coord_match.group(2)

        bortle_match = re.search(r'\*\*波特尔光害等级\*\*:\s*([\d]+)', body)
        if bortle_match:
            data['bortle'] = bortle_match.group(1)

        standard_match = re.search(r'\*\*中国暗夜环境等级\*\*:\s*([\d+]+)', body)
        if standard_match:
            data['standardLight'] = standard_match.group(1)

        sqm_match = re.search(r'\*\*SQM值\*\*:\s*([\d.]+)', body)
        if sqm_match:
            data['sqm'] = sqm_match.group(1)

        climate_match = re.search(r'### 气候情况\n(.*?)(?:\n###|\n---|\Z)', body, re.DOTALL)
        if climate_match:
            data['climate'] = climate_match.group(1).strip()

        accommodation_match = re.search(r'### 住宿情况\n(.*?)(?:\n###|\n---|\Z)', body, re.DOTALL)
        if accommodation_match:
            data['accommodation'] = accommodation_match.group(1).strip()

        notes_match = re.search(r'### 备注\n(.*?)(?:\n###|\n---|\Z)', body, re.DOTALL)
        if notes_match:
            data['notes'] = notes_match.group(1).strip()

        image_match = re.search(r'### 附图\n!\[.*?\]\((.*?)\)', body)
        if image_match:
            data['image'] = image_match.group(1)

        # 前端新增
        is_update = False
        is_add = True
        return data, is_update, is_add

    # 3) 模板（YAML样式）
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

    is_update = '更新现有观星地' in body or '- [x] 更新现有观星地' in body
    is_add = '添加新的观星地' in body or '- [x] 添加新的观星地' in body

    return data, is_update, is_add


def validate_data(data, is_update):
    """验证数据是否有效"""
    
    errors = []
    
    # 检查必填字段（前端提交可能缺少某些字段）
    required_fields = ['name', 'latitude', 'longitude']
    
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
    
    # 验证波特尔等级（可选）
    if 'bortle' in data and data['bortle'] and data['bortle'] != '-':
        if data['bortle'] not in ['1', '2', '3', '4', '5', '6', '7', '8', '9']:
            errors.append(f"波特尔光害等级必须是 1-9，当前值: {data['bortle']}")
    
    # 验证中国暗夜等级（可选）
    if 'standardLight' in data and data['standardLight'] and data['standardLight'] != '-':
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


def generate_id(issue_number):
    """根据 Issue 编号生成唯一 ID，格式：HIT3A_<issue#>"""
    #timestamp = int(time.time())
    issue_part = str(issue_number).strip() if issue_number else 'unknown'
    #return f"HIT3A_{issue_part}_{timestamp}"
    return f"HIT3A_{issue_part}"


def process_observatory(data, is_update, is_add):
    """处理观星地数据"""
    
    json_data = load_json()
    observatories = json_data.get('observatories', [])
    
    # 转换纬度和经度为数字类型
    if 'latitude' in data and data['latitude']:
        data['latitude'] = float(data['latitude'])
    if 'longitude' in data and data['longitude']:
        data['longitude'] = float(data['longitude'])
    
    # 生成坐标字符串
    if 'latitude' in data and 'longitude' in data:
        data['coordinates'] = f"{data['longitude']}°E,{data['latitude']}°N"
    
    # 确保有 ID
    if not data.get('id'):
        data['id'] = generate_id(ISSUE_NUMBER)
    
    # 设置默认值
    if 'bortle' not in data or not data['bortle']:
        data['bortle'] = '-'
    if 'standardLight' not in data or not data['standardLight']:
        data['standardLight'] = '-'
    if 'sqm' not in data or not data['sqm']:
        data['sqm'] = '-'
    if 'climate' not in data:
        data['climate'] = ''
    if 'accommodation' not in data:
        data['accommodation'] = ''
    if 'notes' not in data:
        data['notes'] = ''
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
        # 支持前端提交格式：📍 提交新观星地：xxx
        # 也支持模板格式：[观星地] 或 data-update
        is_observatory_issue = (
            '[观星地]' in ISSUE_TITLE or 
            'data-update' in ISSUE_TITLE.lower() or
            '提交新观星地' in ISSUE_TITLE or
            '📍' in ISSUE_TITLE or
            '修改观星地' in ISSUE_TITLE or
            '✏️' in ISSUE_TITLE or
            '此 Issue 由前端自动提交系统生成' in ISSUE_BODY
        )
        
        if not is_observatory_issue:
            print("::set-output name=success::false")
            print("::set-output name=error::这不是观星地更新 Issue")
            return
        
        # 解析 Issue 内容
        data, is_update, is_add = parse_issue_body(ISSUE_BODY)
        
        if not is_update and not is_add:
            # 如果解析不出来，可能是格式问题
            if not data:
                raise ValueError("无法解析 Issue 内容，请确保格式正确")
        
        # 验证数据
        is_valid, errors = validate_data(data, is_update)
        if not is_valid:
            print("::set-output name=success::false")
            error_msg = '\n'.join(errors)
            print(f"::set-output name=error::{error_msg}")
            return
        
        # 处理数据
        message = process_observatory(data, is_update, is_add)

        # 输出给工作流使用
        action_label = "修改" if is_update else "添加"
        obs_name = data.get('name', '')

        print("::set-output name=success::true")
        print(f"::set-output name=message::{message}")
        print(f"::set-output name=action::{action_label}")
        print(f"::set-output name=name::{obs_name}")
        
    except Exception as e:
        print("::set-output name=success::false")
        print(f"::set-output name=error::{str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
