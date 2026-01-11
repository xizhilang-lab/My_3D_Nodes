import { app } from "/scripts/app.js";

const SKELETON_HTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; overflow: hidden; background: #1a1a1a; font-family: "Microsoft YaHei", sans-serif; user-select: none; }
        #loading { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            color: #00FFD0; font-weight: bold; font-size: 16px; text-align: center;
            display: block; z-index: 2000;
        }
        #instruction { 
            position: absolute; bottom: 10px; left: 10px; color: #ccc; font-size: 12px; pointer-events: none; 
            background: rgba(0,0,0,0.8); padding: 8px 12px; border-radius: 4px; 
            border: 1px solid #444; z-index: 999; line-height: 1.6;
        }
        .btn {
            position: absolute; right: 10px;
            background: #444; color: white; border: 1px solid #666;
            padding: 6px 4px; cursor: pointer; border-radius: 4px; z-index: 100; font-size: 12px;
            transition: background 0.2s;
            width: 100px; text-align: center;
        }
        .btn:hover { background: #555; }
        .btn:active { background: #00FFD0; color: #000; }

        /* 动作面板样式 */
        #pose-container {
            position: absolute; 
            left: 10px;    
            top: 10px;     
            width: 155px; 
            z-index: 100;
            background: rgba(0, 0, 0, 0.7); 
            padding: 8px;
            border-radius: 6px;
            border: 1px solid #444;
        }
        
        #pose-header {
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;
        }
        #pose-label {
            color: #00FFD0; font-size: 12px; font-weight: bold;
        }
        #pose-count {
            color: #aaa; font-size: 10px;
        }
        .limit-reached { color: #ff4444 !important; font-weight: bold; }

        select {
            width: 100%; background: #333; color: white; border: 1px solid #666;
            padding: 4px; border-radius: 4px; font-size: 11px; margin-bottom: 5px; outline: none;
        }
        optgroup { color: #00FFD0; background: #222; font-style: normal; }
        option { color: white; background: #333; padding: 5px; }

        .panel-btn {
            width: 100%; margin-bottom: 4px; font-size: 11px; padding: 4px 0;
            cursor: pointer; border-radius: 3px; border: 1px solid #555;
            color: #ddd; background: #333;
        }
        .panel-btn:hover { background: #444; }
        
        #btn-apply-pose { background: #2a4a4a; border-color: #00FFD0; color: #fff; }
        #btn-save-pose { background: #2a3a5a; border-color: #4477aa; color: #fff; }
        #btn-delete-pose { background: #4a2a2a; border-color: #aa4444; color: #ffcccc; }

        /* 辅助线 */
        #guide-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; display: none; z-index: 50;
        }
        .guide-line { position: absolute; background: rgba(0, 255, 208, 0.3); }
        .gl-h1 { top: 33.3%; left: 0; width: 100%; height: 1px; }
        .gl-h2 { top: 66.6%; left: 0; width: 100%; height: 1px; }
        .gl-v1 { left: 33.3%; top: 0; height: 100%; width: 1px; }
        .gl-v2 { left: 66.6%; top: 0; height: 100%; width: 1px; }
        .gl-ch { top: 50%; left: 0; width: 100%; height: 1px; background: rgba(255, 100, 100, 0.4); }
        .gl-cv { left: 50%; top: 0; height: 100%; width: 1px; background: rgba(255, 100, 100, 0.4); }

    </style>
    
    <!-- 这里的 importmap 将由 JS 动态生成并注入 Blob URL -->
    <script type="importmap">
    {
        "imports": {
            "three": "##URL_THREE##",
            "three/addons/controls/OrbitControls.js": "##URL_ORBIT##",
            "three/addons/loaders/GLTFLoader.js": "##URL_GLTF##",
            "three/addons/controls/TransformControls.js": "##URL_TRANSFORM##"
        }
    }
    </script>
</head>
<body>
    <div id="loading">正在初始化组件...</div>

    <div id="instruction">
        1. <b>点击身体</b> 选中角色移动<br/>
        2. <b>点击关节球</b> 旋转骨骼<br/>
        3. <b>点击黄球(💡)</b> 移动灯光<br/>
        4. <b>R键</b>: 切换世界/本地坐标
    </div>

    <div id="guide-overlay">
        <div class="guide-line gl-h1"></div>
        <div class="guide-line gl-h2"></div>
        <div class="guide-line gl-v1"></div>
        <div class="guide-line gl-v2"></div>
        <div class="guide-line gl-ch"></div>
        <div class="guide-line gl-cv"></div>
    </div>

    <div id="pose-container">
        <div id="pose-header">
            <span id="pose-label">动作库 (File)</span>
            <span id="pose-count">(0/60)</span>
        </div>
        <select id="pose-select"></select>
        <button id="btn-apply-pose" class="panel-btn">应用动作 (Apply)</button>
        <button id="btn-save-pose" class="panel-btn">保存当前动作 (Save)</button>
        <button id="btn-delete-pose" class="panel-btn">删除选中动作 (Del)</button>
    </div>

    <button id="btn-add" class="btn" style="top: 10px; background: #2f4f2f; border-color: #4f7f4f;">+ 添加角色</button>
    <button id="btn-remove" class="btn" style="top: 45px; background: #4f2f2f; border-color: #7f4f4f;">- 移除角色</button>
    <button id="btn-move-body" class="btn" style="top: 90px; border-color: #00FFD0; color: #00FFD0;">整体移动</button>
    <button id="btn-rotate-body" class="btn" style="top: 125px; border-color: #00FFD0; color: #00FFD0;">整体旋转</button>
    <button id="btn-land" class="btn" style="top: 160px; border-color: #FFFF00; color: #FFFF00;">一键落地</button>
    <button id="btn-reset-light" class="btn" style="top: 195px; border-color: #FFAA00; color: #FFAA00;">💡 重置灯光</button>
    <button id="btn-guides" class="btn" style="top: 230px;">辅助参考线</button>
    <button id="btn-reset" class="btn" style="top: 265px;">重置T-Pose</button>

    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { TransformControls } from 'three/addons/controls/TransformControls.js';

        let scene, camera, renderer, orbit, transformControl, grid;
        let characters = []; 
        let activeCharIndex = -1; 
        let hoveredSelector = null;
        let isBodySelected = false; 
        
        // 灯光相关变量
        let lightGroup, lightMesh, mainLight;
        
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();

        // 这里的占位符会被 JS 替换成 Blob URL
        const MODEL_URL = '##URL_MODEL##';
        const CHAR_COLORS = [0xFFFFFF, 0xFF6666, 0x66FF66, 0x6666FF, 0xFFFF66, 0xFF66FF];
        const MAX_SAVED_POSES = 60; 

        const SYSTEM_PRESETS = {
            "--- 系统 ---": { "T-Pose (重置)": {} }
        };

        function init() {
            document.getElementById('loading').innerText = "加载场景...";
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x1a1a1a);
            
            // 场景基础配置
            grid = new THREE.GridHelper(20, 40, 0x333333, 0x111111);
            // grid.receiveShadow = true; 
            scene.add(grid);

            // 添加一个透明的地面用来接收阴影
            const planeGeometry = new THREE.PlaneGeometry(20, 20);
            const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5, color: 0x000000 }); // 增加阴影不透明度
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;
            scene.add(plane);

            // 环境光 (大幅调暗，制造高对比度，让主光源更明显)
            const ambient = new THREE.AmbientLight(0xffffff, 0.2); 
            scene.add(ambient);

            // 之前固定的方向光，现在大幅减弱作为补光，避免喧宾夺主
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
            dirLight.position.set(0, 10, 0);
            scene.add(dirLight);

            setupControllableLight();

            // 渲染器配置 (开启阴影)
            renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true; 
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.capabilities.logarithmicDepthBuffer = true; 
            document.body.appendChild(renderer.domElement);

            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
            camera.position.set(0, 1.5, 4.0); 
            
            orbit = new OrbitControls(camera, renderer.domElement);
            orbit.enableDamping = true;
            orbit.dampingFactor = 0.05;
            orbit.target.set(0, 0.8, 0); 
            orbit.listenToKeyEvents(window);
            orbit.addEventListener('end', () => forceSnapshot());

            transformControl = new TransformControls(camera, renderer.domElement);
            transformControl.setMode('rotate'); 
            transformControl.space = 'local'; 
            transformControl.size = 1.0; 
            transformControl.addEventListener('dragging-changed', function (event) {
                orbit.enabled = !event.value;
                if(!event.value) { savePose(); forceSnapshot(); }
            });
            scene.add(transformControl);

            renderer.domElement.addEventListener('pointerup', () => setTimeout(forceSnapshot, 1));
            renderer.domElement.addEventListener('wheel', () => {
                if(window.wheelTimer) clearTimeout(window.wheelTimer);
                window.wheelTimer = setTimeout(forceSnapshot, 100);
            });
            const resizeObserver = new ResizeObserver(() => { onWindowResize(); forceSnapshot(); });
            resizeObserver.observe(document.body);
            window.addEventListener('keydown', (e) => {
                if(e.key === 'Escape') deselectAll();
                if(e.key.toLowerCase() === 'r') transformControl.space = transformControl.space === 'local' ? 'world' : 'local';
                if(e.key.toLowerCase() === 't') transformControl.setMode(transformControl.getMode() === 'translate' ? 'rotate' : 'translate');
            });

            document.getElementById('btn-add').addEventListener('click', () => addCharacter());
            document.getElementById('btn-remove').addEventListener('click', removeLastCharacter);
            document.getElementById('btn-move-body').addEventListener('click', () => selectBody('translate'));
            document.getElementById('btn-rotate-body').addEventListener('click', () => selectBody('rotate'));
            document.getElementById('btn-land').addEventListener('click', landToFloor);
            document.getElementById('btn-guides').addEventListener('click', toggleGuides);
            document.getElementById('btn-reset').addEventListener('click', () => { resetPose(); forceSnapshot(); });
            document.getElementById('btn-reset-light').addEventListener('click', resetLight);

            initPoseUI();
            renderer.domElement.addEventListener('pointerdown', onPointerDown);
            renderer.domElement.addEventListener('pointermove', onPointerMove);
            setTimeout(() => { if(characters.length === 0) addCharacter(); }, 100);
            animate();
        }

        function setupControllableLight() {
            // 创建一个组来包含灯光和可视化的球体
            lightGroup = new THREE.Group();
            lightGroup.position.set(2, 3, 3); // 默认位置

            // 可视化球体 (黄色灯泡)
            const sphereGeo = new THREE.SphereGeometry(0.15, 16, 16);
            const sphereMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 }); // 金色
            lightMesh = new THREE.Mesh(sphereGeo, sphereMat);
            lightMesh.userData = { isLightHelper: true };
            lightGroup.add(lightMesh);

            // 实际光源 - 增强亮度
            // intensity 从 1.5 提升到 5.0，distance 增加到 100
            mainLight = new THREE.PointLight(0xffffff, 5.0, 100);
            mainLight.castShadow = true;
            mainLight.shadow.mapSize.width = 2048;
            mainLight.shadow.mapSize.height = 2048;
            mainLight.shadow.bias = -0.0001;
            lightGroup.add(mainLight);

            scene.add(lightGroup);
        }

        function resetLight() {
            lightGroup.position.set(2, 3, 3);
            if(transformControl.object === lightGroup) transformControl.detach();
            savePose();
            forceSnapshot();
        }

        function initPoseUI() {
            document.getElementById('btn-apply-pose').addEventListener('click', applySelectedPose);
            document.getElementById('btn-save-pose').addEventListener('click', saveCurrentPoseToLibrary);
            document.getElementById('btn-delete-pose').addEventListener('click', deleteCurrentPoseFromLibrary);
            refreshPoseList();
        }

        async function refreshPoseList() {
            const select = document.getElementById('pose-select');
            const countLabel = document.getElementById('pose-count');
            select.innerHTML = "";
            for(let groupName in SYSTEM_PRESETS) {
                const groupEl = document.createElement('optgroup');
                groupEl.label = groupName;
                const poses = SYSTEM_PRESETS[groupName];
                for(let poseName in poses) {
                    const opt = document.createElement('option');
                    opt.value = JSON.stringify(poses[poseName]); 
                    opt.innerText = poseName;
                    opt.dataset.isSystem = "true";
                    groupEl.appendChild(opt);
                }
                select.appendChild(groupEl);
            }
            try {
                const apiUrl = window.parent.location.origin + "/my_3d_pose/get_poses";
                const res = await fetch(apiUrl);
                if(res.ok) {
                    const userPoses = await res.json();
                    const count = Object.keys(userPoses).length;
                    countLabel.innerText = \`(\${count}/\${MAX_SAVED_POSES})\`;
                    if (count >= MAX_SAVED_POSES) countLabel.classList.add('limit-reached');
                    else countLabel.classList.remove('limit-reached');

                    if(count > 0) {
                        const groupEl = document.createElement('optgroup');
                        groupEl.label = "--- 我的动作库 ---";
                        for(let name in userPoses) {
                            const opt = document.createElement('option');
                            opt.value = JSON.stringify(userPoses[name]);
                            opt.innerText = name;
                            opt.dataset.isSystem = "false";
                            opt.dataset.name = name; 
                            groupEl.appendChild(opt);
                        }
                        select.appendChild(groupEl);
                    }
                }
            } catch(e) { console.error("加载动作库失败", e); }
        }

        function applySelectedPose() {
            const select = document.getElementById('pose-select');
            const poseDataStr = select.value;
            if(activeCharIndex === -1) { alert("请先选中一个角色 (点击角色身体)"); return; }
            if(poseDataStr) { applyPresetPose(activeCharIndex, JSON.parse(poseDataStr)); }
        }

        async function saveCurrentPoseToLibrary() {
            if(activeCharIndex === -1) { alert("请先选中一个角色"); return; }
            const name = prompt("请输入动作名称：");
            if(!name) return;
            const char = characters[activeCharIndex];
            const data = {};
            char.mesh.skeleton.bones.forEach(b => {
                const q = b.quaternion;
                if(Math.abs(q.x) > 0.001 || Math.abs(q.y) > 0.001 || Math.abs(q.z) > 0.001 || Math.abs(q.w - 1) > 0.001) {
                    data[b.name] = [ parseFloat(q.x.toFixed(4)), parseFloat(q.y.toFixed(4)), parseFloat(q.z.toFixed(4)), parseFloat(q.w.toFixed(4)) ];
                }
            });
            try {
                const apiUrl = window.parent.location.origin + "/my_3d_pose/save_pose";
                const resp = await fetch(apiUrl, { method: "POST", body: JSON.stringify({ name: name, data: data }) });
                if(resp.status === 403) { alert(\`保存失败！\\n动作库已满 (\${MAX_SAVED_POSES}个)。\\n请先删除无用的动作。\`); return; }
                if(resp.ok) {
                    await refreshPoseList();
                    const select = document.getElementById('pose-select');
                    for(let i=0; i<select.options.length; i++) {
                         if(select.options[i].innerText === name) { select.selectedIndex = i; break; }
                    }
                } else { alert("保存失败"); }
            } catch(e) { alert("保存出错: " + e.message); }
        }

        async function deleteCurrentPoseFromLibrary() {
            const select = document.getElementById('pose-select');
            const option = select.options[select.selectedIndex];
            if(!option || option.dataset.isSystem === "true") { alert("系统预设(T-Pose)无法删除"); return; }
            const name = option.dataset.name;
            if(!confirm("确定要删除动作: " + name + " 吗？")) return;
            try {
                const apiUrl = window.parent.location.origin + "/my_3d_pose/delete_pose";
                const resp = await fetch(apiUrl, { method: "POST", body: JSON.stringify({ name: name }) });
                if(resp.ok) await refreshPoseList(); else alert("删除失败");
            } catch(e) { console.error(e); }
        }

        function applyPresetPose(charIndex, poseData) {
            if(!characters[charIndex] || !characters[charIndex].mesh) return;
            const char = characters[charIndex];
            const bones = char.mesh.skeleton.bones;
            bones.forEach(b => b.quaternion.set(0,0,0,1));
            for(let boneName in poseData) {
                const bone = bones.find(b => b.name.includes(boneName));
                if(bone) bone.quaternion.fromArray(poseData[boneName]);
            }
            char.mesh.updateMatrixWorld(true);
            savePose(); forceSnapshot();
        }

        function landToFloor() {
            if(activeCharIndex === -1 || !characters[activeCharIndex]) return;
            const char = characters[activeCharIndex];
            char.model.position.y = 0;
            if(transformControl.object === char.model) transformControl.attach(char.model);
            savePose(); forceSnapshot();
        }

        function toggleGuides() {
            const el = document.getElementById('guide-overlay');
            el.style.display = el.style.display === 'block' ? 'none' : 'block';
        }

        function addCharacter(existingData = null) {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('loading').innerText = "正在加载模型数据...";
            const loader = new GLTFLoader();
            loader.load(MODEL_URL, function (gltf) {
                document.getElementById('loading').style.display = 'none';
                const model = gltf.scene;
                
                // 开启模型的阴影投射
                model.traverse(function (object) {
                    if (object.isMesh) {
                        object.castShadow = true;
                        object.receiveShadow = true;
                    }
                });

                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                model.position.set(0,0,0);
                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 0) model.scale.setScalar(2.0 / maxDim);
                const charIndex = characters.length;
                const color = CHAR_COLORS[charIndex % CHAR_COLORS.length];
                let mesh = null;
                const charSelectors = [];
                model.traverse(function (object) {
                    if (object.isMesh) {
                        if(object.material) { object.material = object.material.clone(); object.material.color.setHex(color); }
                        object.userData.isBodyMesh = true; object.userData.charId = charIndex;
                    }
                    if (object.isSkinnedMesh && object.skeleton) {
                        mesh = object; object.frustumCulled = false;
                        createControlSpheres(object.skeleton, charSelectors, charIndex);
                    }
                });
                if(!existingData) model.position.x = charIndex * 0.8;
                else { if(existingData.pos) model.position.fromArray(existingData.pos); if(existingData.rot) model.quaternion.fromArray(existingData.rot); }
                scene.add(model);
                const newChar = { id: charIndex, model: model, mesh: mesh, selectors: charSelectors };
                characters.push(newChar);
                activeCharIndex = charIndex; 
                if(existingData && existingData.bones && mesh) {
                     for(let name in existingData.bones) {
                        const bone = mesh.skeleton.bones.find(b => b.name === name);
                        if(bone) bone.quaternion.fromArray(existingData.bones[name]);
                    }
                    mesh.updateMatrixWorld(true);
                }
                savePose(); forceSnapshot();
            }, undefined, function (error) { 
                console.error("模型加载错误详情:", error); 
                document.getElementById('loading').innerText = "加载失败: " + (error.message || "未知错误"); 
            });
        }

        function removeLastCharacter() {
            if(characters.length === 0) return;
            const char = characters.pop();
            scene.remove(char.model);
            if(transformControl.object && (transformControl.object === char.model || char.selectors.includes(transformControl.object.children[0]))) deselectAll();
            activeCharIndex = characters.length > 0 ? characters.length - 1 : -1;
            savePose(); forceSnapshot();
        }

        function createControlSpheres(skeleton, targetSelectorArray, charId) {
            const radius = 0.5;  
            const geo = new THREE.SphereGeometry(radius, 16, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00FFD0, transparent: true, opacity: 0.3, depthTest: false, depthWrite: false });
            skeleton.bones.forEach(bone => {
                if(bone.name.toLowerCase().includes("end")) return;
                const sphere = new THREE.Mesh(geo, mat.clone());
                sphere.userData = { isSelector: true, bone: bone, charId: charId };
                bone.add(sphere); targetSelectorArray.push(sphere);
            });
        }

        function selectBody(mode) {
            if(activeCharIndex === -1 && characters.length > 0) activeCharIndex = 0;
            if(activeCharIndex === -1 || !characters[activeCharIndex]) return;
            const char = characters[activeCharIndex];
            transformControl.attach(char.model); transformControl.setMode(mode);
            isBodySelected = true; resetAllSphereColors(); forceSnapshot();
        }

        function resetPose() {
            if(activeCharIndex === -1 || !characters[activeCharIndex]) return;
            const char = characters[activeCharIndex];
            char.mesh.skeleton.bones.forEach(bone => { bone.quaternion.set(0, 0, 0, 1); });
            char.model.position.set(char.id * 0.8, 0, 0); char.model.rotation.set(0, 0, 0);
            deselectAll(); savePose(); orbit.update();
        }

        function deselectAll() {
            transformControl.detach(); resetAllSphereColors();
            if(lightMesh) lightMesh.material.color.setHex(0xFFD700); // 重置灯光颜色
            hoveredSelector = null; isBodySelected = false; forceSnapshot(); 
        }

        function getAllSelectors() { let all = []; characters.forEach(c => all = all.concat(c.selectors)); return all; }
        function getAllMeshes() { let all = []; characters.forEach(c => { if(c.mesh) all.push(c.mesh); }); return all; }
        function resetAllSphereColors() { characters.forEach(c => { c.selectors.forEach(s => { s.material.color.setHex(0x00FFD0); s.material.opacity = 0.3; }); }); }

        function onPointerMove(event) {
            if (transformControl.dragging) return;
            updateMouse(event); raycaster.setFromCamera(mouse, camera);
            
            // 检测灯光
            const lightIntersects = raycaster.intersectObject(lightMesh);
            if(lightIntersects.length > 0) {
                 document.body.style.cursor = 'pointer';
                 if(transformControl.object !== lightGroup) lightMesh.material.color.setHex(0xFFFFFF);
                 return;
            } else {
                 if(transformControl.object !== lightGroup) lightMesh.material.color.setHex(0xFFD700);
            }

            const allSelectors = getAllSelectors();
            const intersects = raycaster.intersectObjects(allSelectors, false);
            if (intersects.length > 0) {
                const hitObj = intersects[0].object;
                if (hoveredSelector !== hitObj) {
                    if (hoveredSelector) {
                        const currentGizmoObj = transformControl.object;
                        if (currentGizmoObj && currentGizmoObj.children.includes(hoveredSelector)) hoveredSelector.material.color.setHex(0xFF0000);
                        else hoveredSelector.material.color.setHex(0x00FFD0);
                    }
                    hoveredSelector = hitObj;
                    const currentGizmoObj = transformControl.object;
                    if (!currentGizmoObj || !currentGizmoObj.children.includes(hitObj)) hoveredSelector.material.color.setHex(0xFFFF00);
                    document.body.style.cursor = 'pointer';
                }
            } else {
                if (hoveredSelector) {
                    const currentGizmoObj = transformControl.object;
                    if (currentGizmoObj && currentGizmoObj.children.includes(hoveredSelector)) hoveredSelector.material.color.setHex(0xFF0000); 
                    else hoveredSelector.material.color.setHex(0x00FFD0); 
                    hoveredSelector = null; document.body.style.cursor = 'default';
                }
            }
        }

        function onPointerDown(event) {
            if (transformControl.dragging || transformControl.axis !== null) return;
            updateMouse(event); raycaster.setFromCamera(mouse, camera);
            
            // 1. 优先检测灯光
            const lightIntersects = raycaster.intersectObject(lightMesh);
            if(lightIntersects.length > 0 && event.button === 0) {
                transformControl.attach(lightGroup);
                transformControl.setMode('translate');
                resetAllSphereColors();
                lightMesh.material.color.setHex(0xFFFFFF); // 选中时变白
                return;
            }

            // 2. 检测关节
            const allSelectors = getAllSelectors();
            const sphereIntersects = raycaster.intersectObjects(allSelectors, false);
            if (sphereIntersects.length > 0) {
                if(event.button === 0) {
                    const hitSphere = sphereIntersects[0].object;
                    const bone = hitSphere.userData.bone;
                    const charId = hitSphere.userData.charId;
                    if(bone) {
                        activeCharIndex = charId;
                        transformControl.attach(bone); transformControl.setMode('rotate'); isBodySelected = false;
                        resetAllSphereColors(); hitSphere.material.color.setHex(0xFF0000); hitSphere.material.opacity = 0.6; 
                        if(lightMesh) lightMesh.material.color.setHex(0xFFD700);
                        setTimeout(forceSnapshot, 0);
                    }
                }
                return; 
            }

            // 3. 检测身体
            const allMeshes = getAllMeshes();
            const meshIntersects = raycaster.intersectObjects(allMeshes, true);
            if (meshIntersects.length > 0) {
                 if(event.button === 0) {
                     let hitMesh = meshIntersects[0].object;
                     while(hitMesh && hitMesh.userData.charId === undefined && hitMesh.parent) hitMesh = hitMesh.parent;
                     if(hitMesh && hitMesh.userData.charId !== undefined) { 
                         activeCharIndex = hitMesh.userData.charId; 
                         selectBody('translate');
                         if(lightMesh) lightMesh.material.color.setHex(0xFFD700);
                         return; 
                     }
                 }
            }
            if(event.button === 0) deselectAll();
        }

        function updateMouse(event) {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        }

        function forceSnapshot() {
            const gizmoVisible = transformControl.visible;
            const gridVisible = grid.visible;
            // 截图前隐藏 gizmo、网格和灯光辅助球
            transformControl.visible = false; 
            grid.visible = false;
            if(lightMesh) lightMesh.visible = false;

            const allSelectors = getAllSelectors(); allSelectors.forEach(s => s.visible = false);
            
            renderer.render(scene, camera);
            const url = renderer.domElement.toDataURL("image/jpeg", 0.95);
            window.parent.postMessage({ type: 'UPDATE_IMAGE', img: url }, '*');
            
            // 恢复可见性
            transformControl.visible = gizmoVisible; 
            grid.visible = gridVisible;
            if(lightMesh) lightMesh.visible = true;
            allSelectors.forEach(s => s.visible = true);
            renderer.render(scene, camera);
        }

        function savePose() {
            const charData = characters.map(c => {
                const bones = {};
                c.mesh.skeleton.bones.forEach(bone => { bones[bone.name] = bone.quaternion.toArray(); });
                return { pos: c.model.position.toArray(), rot: c.model.quaternion.toArray(), bones: bones };
            });

            // 新的数据结构，包含灯光信息
            const saveData = {
                version: 2,
                light: lightGroup ? lightGroup.position.toArray() : [2,3,3],
                chars: charData
            };

            window.parent.postMessage({ type: 'UPDATE_POSE', pose: JSON.stringify(saveData) }, '*');
        }

        function loadPoseFromState(jsonString) {
            if(!jsonString || jsonString === "{}") return;
            try {
                let parsed = JSON.parse(jsonString);
                let charDataArray = [];

                // 兼容旧版本 (旧版本直接是数组)
                if(Array.isArray(parsed)) {
                    charDataArray = parsed;
                } else if (parsed.chars) {
                    // 新版本
                    charDataArray = parsed.chars;
                    if(parsed.light && lightGroup) {
                        lightGroup.position.fromArray(parsed.light);
                    }
                } else {
                    // 处理单个对象的旧旧版本
                    const single = { bones: {}, pos: [0,0,0], rot: [0,0,0,1] };
                    for(let k in parsed) {
                         if(k === '__root_position__') single.pos = parsed[k];
                         else if(k === '__root_rotation__') single.rot = parsed[k];
                         else single.bones[k] = parsed[k];
                    }
                    charDataArray = [single];
                }

                // 加载角色
                const data = charDataArray;
                while(characters.length > data.length) removeLastCharacter();
                for(let i=0; i<characters.length; i++) {
                    const char = characters[i]; const d = data[i];
                    char.model.position.fromArray(d.pos); char.model.quaternion.fromArray(d.rot);
                    for(let bName in d.bones) {
                         const bone = char.mesh.skeleton.bones.find(b => b.name === bName);
                         if(bone) bone.quaternion.fromArray(d.bones[bName]);
                    }
                    char.mesh.updateMatrixWorld(true);
                }
                const loadNext = (index) => {
                    if(index >= data.length) { savePose(); forceSnapshot(); return; }
                    addCharacter(data[index]); setTimeout(() => loadNext(index + 1), 50); 
                };
                if(characters.length < data.length) loadNext(characters.length); else forceSnapshot();
            } catch(e) { console.error("Load pose error", e); }
        }

        function onWindowResize() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }

        function animate() {
            requestAnimationFrame(animate);
            orbit.update();
            renderer.render(scene, camera);
        }

        window.addEventListener('message', (e) => {
            if(e.data.type === 'INIT_POSE') loadPoseFromState(e.data.pose);
        });

        init();
    </script>
</body>
</html>
`;

app.registerExtension({
    name: "Comfy.ThreeD_Bone_Pose",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "ThreeD_Bone_Pose") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                const node = this;
                node.setSize([500, 600]);

                const createHidden = (name) => {
                    let w = node.widgets.find(w => w.name === name);
                    if (!w) {
                        w = node.addWidget("text", name, "", () => {}, {});
                        w.computeSize = () => [0, -4];
                        if (w.inputEl) w.inputEl.style.display = "none";
                    }
                    return w;
                };

                const snapshotWidget = createHidden("snapshot");
                const poseDataWidget = createHidden("pose_data");

                // 获取基础文件 URL
                const urlModelRaw = new URL("./Xbot.glb", import.meta.url).href;
                const urlThreeRaw = new URL("./three.module.js", import.meta.url).href;
                const urlOrbitRaw = new URL("./OrbitControls.js", import.meta.url).href;
                const urlGLTFRaw = new URL("./GLTFLoader.js", import.meta.url).href;
                const urlTransformRaw = new URL("./TransformControls.js", import.meta.url).href;
                const urlBufferRaw = new URL("./BufferGeometryUtils.js", import.meta.url).href;

                // 辅助函数：拉取文件文本内容
                const fetchText = async (url) => {
                    const resp = await fetch(url);
                    if (!resp.ok) throw new Error(`Failed to load ${url}`);
                    return await resp.text();
                };

                // 辅助函数：创建 Text Blob URL
                const createBlobUrl = (content, type = 'application/javascript') => {
                    return URL.createObjectURL(new Blob([content], { type: type }));
                };

                // 创建 iframe 容器
                const iframe = document.createElement("iframe");
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.border = "none";

                // ★★★ 核心修复逻辑：动态加载并重写所有 JS 依赖 ★★★
                (async () => {
                    try {
                        // 1. 加载 three.module.js
                        const threeContent = await fetchText(urlThreeRaw);
                        const threeBlobUrl = createBlobUrl(threeContent);

                        // 2. 加载并重写 BufferGeometryUtils.js (依赖 three)
                        let bufferContent = await fetchText(urlBufferRaw);
                        bufferContent = bufferContent.replace(/from\s+['"]three['"]/g, `from '${threeBlobUrl}'`);
                        const bufferBlobUrl = createBlobUrl(bufferContent);

                        // 3. 加载并重写 GLTFLoader.js
                        let gltfContent = await fetchText(urlGLTFRaw);
                        gltfContent = gltfContent.replace(/from\s+['"]three['"]/g, `from '${threeBlobUrl}'`);
                        gltfContent = gltfContent.replace(/from\s+['"].*\/BufferGeometryUtils\.js['"]/g, `from '${bufferBlobUrl}'`);
                        const gltfBlobUrl = createBlobUrl(gltfContent);

                        // 4. 加载并重写 Controls
                        let orbitContent = await fetchText(urlOrbitRaw);
                        orbitContent = orbitContent.replace(/from\s+['"]three['"]/g, `from '${threeBlobUrl}'`);
                        const orbitBlobUrl = createBlobUrl(orbitContent);

                        let transformContent = await fetchText(urlTransformRaw);
                        transformContent = transformContent.replace(/from\s+['"]three['"]/g, `from '${threeBlobUrl}'`);
                        const transformBlobUrl = createBlobUrl(transformContent);

                        // 5. 加载模型 Blob
                        let modelBlobUrl = urlModelRaw;
                        try {
                            const modelResp = await fetch(urlModelRaw);
                            if(modelResp.ok) {
                                const blob = await modelResp.blob();
                                modelBlobUrl = URL.createObjectURL(blob);
                            }
                        } catch(e) { console.warn("Model fetch failed, using raw url"); }

                        // 6. 组装 HTML
                        let finalHtml = SKELETON_HTML;
                        finalHtml = finalHtml.replace("##URL_MODEL##", modelBlobUrl);
                        finalHtml = finalHtml.replace("##URL_THREE##", threeBlobUrl);
                        finalHtml = finalHtml.replace("##URL_ORBIT##", orbitBlobUrl);
                        finalHtml = finalHtml.replace("##URL_GLTF##", gltfBlobUrl);
                        finalHtml = finalHtml.replace("##URL_TRANSFORM##", transformBlobUrl);

                        // 设置 iframe 内容
                        iframe.src = URL.createObjectURL(new Blob([finalHtml], {type: "text/html"}));
                        
                        iframe.onload = () => {
                            setTimeout(() => {
                                iframe.contentWindow.postMessage({ type: 'INIT_POSE', pose: poseDataWidget.value }, '*');
                            }, 100);
                        };

                    } catch (err) {
                        console.error("[3D Pose] Critical Error initializing components:", err);
                        const errHtml = `<div style="color:red; padding:20px;">Component Load Error: ${err.message}<br/>Check console for details.</div>`;
                        iframe.src = URL.createObjectURL(new Blob([errHtml], {type: "text/html"}));
                    }
                })();

                const widget = node.addDOMWidget("3d_editor", "editor", iframe, {
                    getValue() { return "" }, setValue(v) {}
                });
                widget.computeSize = (w) => [w, 520]; 

                window.addEventListener('message', (e) => {
                    if(iframe.contentWindow && e.source === iframe.contentWindow) {
                        if(e.data.type === 'UPDATE_POSE') poseDataWidget.value = e.data.pose;
                        if(e.data.type === 'UPDATE_IMAGE') snapshotWidget.value = e.data.img;
                    }
                });

                return r;
            };
        }
    }
});