# 第三方来源与署名

[English](CREDITS.md) · [返回 README](../README.zh-CN.md)

AFTERHOURS 将第三方软件、改编视觉组件、下载材质和带署名的音频，与本网站的场景构建、交互及工程集成结合起来。技术说明讲解的是网站如何实现，不代表所有算法、效果与素材都由本项目首次创造。

## 直接改编：React Bits / Hyperspeed

**上游作者与项目：** **David Haz / React Bits** 的 [Hyperspeed](https://github.com/DavidHDev/react-bits/blob/e12c22192ac7b4b452c5e2feb9b586d74765d696/src/content/Backgrounds/Hyperspeed/Hyperspeed.jsx)。项目记录的上游提交为 `e12c22192ac7b4b452c5e2feb9b586d74765d696`。

**使用位置：** 开场道路、光轨及相关视觉组件。这部分基于上游实现修改，不应描述为本网站从零原创的特效。

**本地改动与集成：** 加入就绪回调、像素比上限、可配置加速与释放响应、路线驱动的弯曲和道路对齐、暂停与后台处理、配色插值及到达接力。当前组件还接入主站共享渲染器与帧调度。这些改动不会改变道路特效的上游来源。

**许可：** 所用提交的许可为 **MIT + Commons Clause License Condition v1.0**，不是普通 MIT。须保留版权与许可文本；其中包含针对组件本身再分发的限制，具体以[保留的完整许可](../licenses/react-bits.md)和[上游对应提交的许可](https://github.com/DavidHDev/react-bits/blob/e12c22192ac7b4b452c5e2feb9b586d74765d696/LICENSE.md)为准。

[上游文件、提交与改动记录](../licenses/react-bits-source.json)

## 基础软件依赖

| 软件与作者 | 本项目使用位置 | 许可与保留声明 |
| --- | --- | --- |
| [React / React DOM](https://github.com/facebook/react)，React 贡献者 | 页面组织与状态 | [React MIT](../licenses/react.txt)、[React DOM MIT](../licenses/react-dom.txt)、[Scheduler MIT](../licenses/scheduler.txt) |
| [Three.js](https://github.com/mrdoob/three.js)，Three.js 作者 | 主站建筑与 Lab、失重作品、微缩场景 | [MIT](../licenses/three.txt) |
| [GSAP](https://gsap.com/)，GreenSock / Webflow | 动画时间线、相机和过渡协调 | [Standard no-charge license](https://gsap.com/community/standard-license/)，不是 MIT；发行代码保留原声明 |
| [Lenis](https://github.com/darkroomengineering/lenis)，darkroom.engineering | 平滑滚动与滚动协调 | [MIT](../licenses/lenis.txt) |
| [Rapier](https://rapier.rs/)，Dimforge 与贡献者 | GRAVITY OFF 刚体仿真和碰撞 | [Apache-2.0](../licenses/gravity-off-Rapier-Apache-2.0.txt) |
| [Vite](https://vite.dev/) / [TypeScript](https://www.typescriptlang.org/) | 本地开发和构建工具 | 开发工具依赖；当前仓库未发布完整开发工程 |

调用基础库与直接改编某个演示不同，因此 Hyperspeed 单独说明。双缓冲渲染目标、粒子插值、射线命中等通用技术本身，也不能作为复制某个具体实现的证据；确认直接改编时，应补上可核对的来源。

## 下载的建筑材质

这些贴图来自第三方素材，并非全部由本网站从零绘制。[ambientCG](https://docs.ambientcg.com/license/) 与 [Poly Haven](https://polyhaven.com/license) 对下列素材采用 CC0，即使署名并非强制，也保留创作者信息。

| 素材 | 创作者与提供方 | 使用与处理 |
| --- | --- | --- |
| [Marble016](https://ambientcg.com/view?id=Marble016) | ambientCG | 深色大理石柱，保持原始 2K 尺寸本地编码 JPEG |
| [Granite002A](https://ambientcg.com/view?id=Granite002A) | ambientCG | 台面和墙石，漫反射去偏色并降低对比度 |
| [Granite Tile](https://polyhaven.com/a/granite_tile) | Charlotte Baglioni / Poly Haven | 地面，原始 1K 贴图 |
| [Japanese Cedar Planks](https://polyhaven.com/a/japanese_cedar_planks) | Charlotte Baglioni、Rico Cilliers / Poly Haven | 微缩建筑木材，原始 1K 贴图 |
| [Grey Cartago 03](https://polyhaven.com/a/grey_cartago_03) | Lucas Sánchez Ros / Poly Haven | 保留的早期对比文件，当前材质配置不加载 |

[材质来源与处理记录](../materials/atelier/README.md) · [逐文件来源与哈希](../materials/atelier/sources.json)

## 字体

- **Barlow Condensed**：The Barlow Project Authors，[SIL Open Font License 1.1](../licenses/barlow-condensed.txt)。
- **IBM Plex Mono**：IBM Corp.，[SIL Open Font License 1.1](../licenses/ibm-plex-mono.txt)。

## 音乐、录音与音效

| 素材与作者 | 使用与改动 | 署名和许可 |
| --- | --- | --- |
| **Meanwhile — Scott Buckley** | 主站背景音乐，裁去开头静音，网站控制音量、淡入淡出和循环 | CC BY 4.0；[曲目、来源与处理说明](../audio/credits.html) |
| **Perseus Cluster Sonification — NASA/CXC/SAO/K.Arcand, SYSTEM Sounds (M. Russo, A. Santaguida)** | 奇点：滤波、循环处理，与合成低频氛围层混合 | [完整署名和官方素材使用链接](../sites/blackhole/audio/credits.html)；不是黑洞附近的现场录音，也不代表官方背书 |
| **Interface Sounds / Impact Sounds — Kenney** | GRAVITY OFF 界面与碰撞音效 | CC0；[界面音效声明](../licenses/gravity-off-kenney-interface-sounds.txt)、[碰撞音效声明](../licenses/gravity-off-kenney-impact-sounds.txt) |
| **HTS Voice Mei — MMDAgent Project Team / 名古屋工业大学** | 小间欢迎语，通过 Open JTalk 合成并调整音高与速度 | 声音模型 CC BY 3.0；[发行音频署名](../sites/xiaojian/audio/credits.txt) |
| **Gingasen whistle — Cassiopeia sweet** | 小间列车鸣笛，剪辑、滤波、延长并编码 | CC BY-SA 3.0；原始来源、处理与改编录音许可见同一音频署名文件 |
| **European Herring Gull — Sonothèque ADVL** | 小间海鸥叫声，截取、滤波、增益与淡入淡出 | CC0；来源和改动见同一音频署名文件 |
| **Flowing-water-100019 — Fg2** | 随小间发行的流水录音 | 公共领域；来源见同一音频署名文件 |
| **Water drops dripping — ZooFari** | 小间触水提示，分离并处理瞬态 | CC BY-SA 3.0；改编录音保留该许可，来源和改动见同一音频署名文件 |

## 视觉参考与本项目工作边界

奇点把 [NASA 黑洞可视化](https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/)列为视觉参考。这与直接使用声化录音不同，也不表示本网站的着色器代码由 NASA 编写。

本网站的工作包括场景搭建、交互状态、镜头与滚动和 DOM 的协调、就绪管理与渲染器集成、实验控件，以及独立世界的展示组织。集成这些内容不会转移上述依赖和素材的作者权利。本清单依据当前来源记录与发行声明整理；后续确认新的借用内容时，应补上上游链接、版本、使用位置与改动。

当前未声明覆盖整站的统一许可证。讨论复用时应保留第三方声明并遵守各素材条款；将来为本地编写的代码选定许可，也不会自动改变上游作品的授权。
