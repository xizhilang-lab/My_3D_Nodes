import torch
import numpy as np
from PIL import Image
import base64
import io
import json
import os
import server
from aiohttp import web

# ==============================================================================
# 路径配置：动作文件将保存在当前节点目录下
# ==============================================================================
POSES_FILE = os.path.join(os.path.dirname(__file__), "saved_poses.json")
MAX_POSES = 60  # 限制最大数量

def load_poses_file():
    if not os.path.exists(POSES_FILE):
        return {}
    try:
        with open(POSES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

def save_poses_file(data):
    with open(POSES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# ==============================================================================
# API 路由：处理前端发来的保存/删除请求
# ==============================================================================
@server.PromptServer.instance.routes.get("/my_3d_pose/get_poses")
async def get_poses(request):
    """获取所有动作"""
    poses = load_poses_file()
    return web.json_response(poses)

@server.PromptServer.instance.routes.post("/my_3d_pose/save_pose")
async def save_pose(request):
    """保存动作"""
    try:
        req_data = await request.json()
        name = req_data.get("name")
        pose_data = req_data.get("data")
        
        if not name or not pose_data:
            return web.Response(status=400, text="Missing name or data")
            
        current_poses = load_poses_file()
        
        # 检查数量限制 (如果是更新同名动作则不检查)
        if name not in current_poses and len(current_poses) >= MAX_POSES:
            return web.json_response({"status": "error", "message": "Limit reached"}, status=403)

        current_poses[name] = pose_data
        save_poses_file(current_poses)
        
        return web.json_response({"status": "success"})
    except Exception as e:
        print(f"[3D Pose] Save error: {e}")
        return web.Response(status=500)

@server.PromptServer.instance.routes.post("/my_3d_pose/delete_pose")
async def delete_pose(request):
    """删除动作"""
    try:
        req_data = await request.json()
        name = req_data.get("name")
        
        current_poses = load_poses_file()
        if name in current_poses:
            del current_poses[name]
            save_poses_file(current_poses)
            
        return web.json_response({"status": "success"})
    except Exception as e:
        print(f"[3D Pose] Delete error: {e}")
        return web.Response(status=500)

# ==============================================================================
# 节点 1: 3D Cinematic Pose
# ==============================================================================
class ThreeD_Human_Pose:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "horizontal_angle": ("INT", {"default": 0, "min": -3600, "max": 3600, "step": 1}),
                "vertical_angle": ("INT", {"default": 0, "min": -90, "max": 90, "step": 1}),
                "zoom": ("FLOAT", {"default": 5.0, "min": 0.5, "max": 100.0, "step": 0.1}),
            },
            "hidden": {
                "snapshot": ("STRING", {"default": ""}), 
                "prompt_output": ("STRING", {"default": ""}),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("image", "prompt")
    FUNCTION = "process"
    CATEGORY = "3D Pose"

    def get_calc_prompt(self, h, v, z):
        h = h % 360
        if h < 0: h += 360
        
        if h < 22.5 or h >= 337.5: h_str = "front view"
        elif h < 67.5: h_str = "front-right three-quarter view"
        elif h < 112.5: h_str = "right side profile"
        elif h < 157.5: h_str = "back-right view"
        elif h < 202.5: h_str = "back view"
        elif h < 247.5: h_str = "back-left view"
        elif h < 292.5: h_str = "left side profile"
        else: h_str = "front-left three-quarter view"

        if v > 70: v_str = "overhead shot, bird's-eye view"
        elif v > 35: v_str = "high angle shot"
        elif v > 15: v_str = "slightly high angle"
        elif v > -15: v_str = "eye level shot"
        elif v > -50: v_str = "low angle shot"
        else: v_str = "worm's-eye view"

        if z < 2.0: z_str = "extreme close-up"
        elif z < 4.0: z_str = "close-up"
        elif z < 6.5: z_str = "medium shot"
        elif z < 12.0: z_str = "full body shot"
        else: z_str = "wide shot"

        return f"{h_str}, {v_str}, {z_str}"

    def process(self, horizontal_angle, vertical_angle, zoom, snapshot=None, prompt_output=None):
        img_tensor = torch.zeros((1, 512, 512, 3))
        if snapshot and isinstance(snapshot, str) and snapshot.startswith("data:image"):
            try:
                header, encoded = snapshot.split(",", 1)
                data = base64.b64decode(encoded)
                img = Image.open(io.BytesIO(data))
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img = np.array(img).astype(np.float32) / 255.0
                img_tensor = torch.from_numpy(img)[None,]
            except Exception as e:
                print(f"[3D Pose Error] Image decode failed: {e}")
                pass
        
        final_prompt = self.get_calc_prompt(horizontal_angle, vertical_angle, zoom)
        return (img_tensor, final_prompt)


# ==============================================================================
# 节点 2: 3D Skeleton Posing
# ==============================================================================
class ThreeD_Bone_Pose:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "mode": (["Pose Edit", "View Only"],), 
            },
            "optional": {
                "snapshot": ("STRING", {"default": "", "multiline": False}), 
                "pose_data": ("STRING", {"default": "{}", "multiline": False}), 
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("image", "pose_json")
    FUNCTION = "process"
    CATEGORY = "3D Pose"

    def process(self, mode, snapshot="", pose_data="{}"):
        img_tensor = torch.zeros((1, 512, 512, 3))
        
        if snapshot and isinstance(snapshot, str) and snapshot.startswith("data:image"):
            try:
                header, encoded = snapshot.split(",", 1)
                data = base64.b64decode(encoded)
                img = Image.open(io.BytesIO(data))
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img = np.array(img).astype(np.float32) / 255.0
                img_tensor = torch.from_numpy(img)[None,]
            except Exception as e:
                print(f"[3D Bone Error] Image decode failed: {e}")

        if not pose_data:
            pose_data = "{}"
            
        return (img_tensor, pose_data)

# ==============================================================================
# 注册映射
# ==============================================================================
NODE_CLASS_MAPPINGS = { 
    "ThreeD_Human_Pose": ThreeD_Human_Pose,
    "ThreeD_Bone_Pose": ThreeD_Bone_Pose 
}

NODE_DISPLAY_NAME_MAPPINGS = { 
    "ThreeD_Human_Pose": "3D Cinematic Pose",
    "ThreeD_Bone_Pose": "3D Skeleton Posing"
}

WEB_DIRECTORY = "./web"
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]