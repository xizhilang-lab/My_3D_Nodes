My_3D_Nodes (ComfyUI 3D Pose Editor)
一个用于 ComfyUI 的完全离线 3D 人物姿态编辑节点。 集成了本地动作库管理功能，支持将满意的动作永久保存到节点目录下的 JSON 文件中。

Cover Offline

✨ 主要特色 (Features)
完全离线 (Fully Offline)：内置 Three.js 引擎及模型文件，无需联网，无需 CDN，内网环境可用。
本地动作库 (Local Storage)：
动作数据直接保存到节点目录下的 saved_poses.json 文件中。
重启 ComfyUI 不会丢失数据。
支持保存、应用和删除动作。
智能限制：动作库限制最大保存 60 个动作，满额后会提示清理，保持轻量。
多角色支持：支持在同一场景中添加多个角色。
ControlNet 友好：输出图像可直接连接 OpenPose 或 Depth 预处理器。
📂 安装 (Installation)
打开终端 (CMD) 并进入你的 ComfyUI 插件目录：
cd ComfyUI/custom_nodes/
克隆本仓库： code Bash git clone https://github.com/xizhilang-lab/My_3D_Nodes.git 重启 ComfyUI。 依赖说明：本插件不需要安装任何额外的 Python 库 (No pip install needed)。 🎮 使用指南 (Usage)

基础操作 旋转视角：鼠标左键 (Left Click) 拖动背景。 平移视角：鼠标右键 (Right Click) 拖动背景。 缩放视角：鼠标滚轮 (Scroll)。 调整姿态：点击人物身上的关节球，使用旋转轴调整。 移动人物：点击右侧“整体移动”按钮，或点击人物身体非关节部位。
动作库管理 (Pose Library) 面板位于左上角，显示当前存储数量 (N/60)。数据保存在 saved_poses.json 中。 保存 (Save)：点击保存，输入名称。 应用 (Apply)：从下拉列表选择动作，点击应用。 删除 (Del)：选中不需要的动作，点击删除以释放空间。
工具栏功能
添加角色：增加新角色。
移除角色：删除当前选中的角色。 一键落地：自动计算并修正人物位置，使其双脚贴地。 辅助参考线：切换显示网格和中心线。 重置 T-Pose：一键恢复初始姿态。 ⚠️ 文件说明 (Files) 请确保 web 文件夹内的以下文件完整，否则无法加载 3D 界面： Xbot.glb (3D 模型) three.module.js 等 JS 依赖文件