import { j as jsxRuntimeExports, a as reactExports, p as projects, S as SoundToggle, A as Arrow, r as runtime } from './index-Cu9ZWOIE.js';
import { g as gsapWithCSS } from './motion-DpMaEHIX.js';
import './three-C7fIRf5V.js';

const projectStories = {
  soc: {
    purpose: "把分散的安全日志整理成可查看的风险线索，帮助分析人员发现异常，再回到记录中核查。",
    imageSize: [1440, 1e3],
    workflow: [
      { title: "收集日志", description: "输入来自不同来源的安全记录，整理其中的行为信息。" },
      { title: "识别风险", description: "提取特征并进行分类。研究实验与比赛使用的模型路径分别保留。" },
      { title: "辅助研判", description: "用态势总览、日志研判和模型审计界面，呈现需要进一步检查的线索。" }
    ],
    architecture: {
      description: "整体工作由数据处理、模型实验和研判界面组成。论文研究与比赛工程分别保留自己的特征、模型和评估记录，界面负责让结果回到可检查的日志线索。",
      nodes: [
        { title: "日志输入", detail: "事件标识、时间、通信字段与日志文本" },
        { title: "特征处理", detail: "整理行为描述、统计信息或稀疏特征" },
        { title: "独立模型路径", detail: "研究实验与比赛分类分别训练、评估" },
        { title: "结果留存", detail: "保留预测标签、实验配置和审计材料" },
        { title: "可视化研判", detail: "从态势分布回到具体日志进行核查" }
      ]
    },
    technologies: [
      { name: "Python / 数据处理", responsibility: "组织日志清洗、特征转换、批量推理与结果导出，把模型输入和输出串成可复现流程。" },
      { name: "Transformer / 语义特征", responsibility: "在研究实验中，将结构化流量写成行为描述，再用预训练编码器提取语义表示。" },
      { name: "LoRA / 小样本适配", responsibility: "单独研究小规模异常分类微调，保留 adapter 和实验配置；与冻结编码器提取特征区分。" },
      { name: "Scikit-learn / 比赛工程", responsibility: "使用独立的稀疏特征分类路径，结合冻结策略、分批预测和文件校验生成可审计结果。" }
    ],
    implementation: [
      { title: "先建立可以检查的数据入口", description: "梳理日志字段与类别定义，区分输入记录、真实标签和预测标签。研究实验把网络流量转成行为描述；比赛工程则保留 event_id 等标识，确保预测可以对应回原始记录。", output: "字段约定、行为描述样例与可对应的事件标识" },
      { title: "把不同模型思路分开实现", description: "研究侧分别探索预训练 Transformer 特征与小样本 LoRA 分类，不把两者写成同一个实验。比赛侧沿用独立的稀疏特征与分类工程，避免用论文实验替代实际交付模型。", output: "各自独立的模型、配置、特征与实验材料" },
      { title: "在评估之前固定选择规则", description: "比赛流程将拟合、校准与封存评估分开：先在允许的数据上确定候选，再保留冻结清单和审计记录。推理按批处理，导出时检查标签枚举、事件覆盖和重复记录。", output: "冻结清单、评估报告与结构校验过的预测文件" },
      { title: "把模型结果转成研判入口", description: "在 SOC 演示中提供态势总览、日志研判和模型审计入口，帮助观看者先了解风险分布，再检查具体记录。界面中的预测分布用于说明模型输出，不代替真实标签或官方成绩。", output: "可视化总览、日志查看与模型审计界面" }
    ],
    decisions: [
      { question: "为什么先写行为描述，而不是直接把所有数字交给语言模型？", answer: "结构化流量字段与自然语言之间存在表达差异。把通信行为组织成文本，是为了让编码器接收有语义关联的输入，再与统计特征等信息进行实验对照。特征提取和 LoRA 分类的训练目标不同，因此需要分别记录与评估。" },
      { question: "如何避免“验证分数很好，但结论站不住脚”？", answer: "将用于拟合、选择策略和最终检查的数据职责分开，保留配置、分区与模型的绑定记录；封存评估不回流到调参。不同划分下的结果只说明对应实验条件，不直接推广到新的数据来源，也不当作竞赛平台成绩。" },
      { question: "为什么展示研判界面，还要保留模型与文件审计？", answer: "界面回答“哪里值得看”，审计回答“这个结果从哪里来”。预测文件需要确认事件是否漏掉、重复或出现非法标签；模型材料则说明输入、特征与策略。只有两者都能核查，展示才不会停留在一张分布图。" }
    ],
    verification: [
      { title: "研究材料", detail: "已有特征提取、小样本微调代码及实验报告，可检查输入描述、配置、模型产物与结论的对应关系。" },
      { title: "比赛工程", detail: "已有冻结推理包与提交校验程序，检查事件标识覆盖、重复、列名和标签范围；结构校验不等于预测正确。" },
      { title: "展示材料", detail: "既有 SOC 截图可查看态势分布、日志研判和模型审计入口，说明模型结果如何进入分析人员的查看流程。" }
    ],
    evidenceNote: "资料来自本地研究说明、比赛冻结推理包与既有演示。研究实验与比赛工程分别留存，可按各自配置核查。"
  },
  hemw: {
    purpose: "从一张人脸照片出发，调整眼睛、嘴角等位置，让静态面孔产生表情变化。",
    imageSize: [3360, 1122],
    workflow: [
      { title: "找到面部位置", description: "识别眼睛、嘴巴等关键点，确定照片中需要变化的区域。" },
      { title: "让表情动起来", description: "移动关键点，再用三角网格带动局部图像，尽量减少拉伸和接缝。" },
      { title: "预览与对照", description: "查看二维表情预览、视频，以及不同变化强度下的诊断图。" }
    ],
    architecture: {
      description: "把“计算面部位置”和“移动图像像素”拆开：关键点模块决定哪里变化，表情模块决定如何移动，网格渲染模块负责生成图像，最后复用到预览与视频。",
      nodes: [
        { title: "照片输入", detail: "读取图像并保留原始画面" },
        { title: "关键点定位", detail: "MediaPipe 检测 478 个面部点" },
        { title: "表情位移", detail: "按眼间距和强度计算目标位置" },
        { title: "网格变形", detail: "Delaunay 网格与分片仿射变换" },
        { title: "融合与输出", detail: "局部融合后预览，或逐帧写出视频" }
      ]
    },
    technologies: [
      { name: "MediaPipe Face Mesh", responsibility: "定位眼睑、嘴唇、眉毛等面部结构，为后续的几何变形提供统一关键点。" },
      { name: "NumPy / 表情几何", responsibility: "建立以双眼为基准的局部坐标系，用脸部尺度归一化位移，控制表情方向和强度。" },
      { name: "SciPy Delaunay", responsibility: "将原始关键点与图像边界点连成三角网格，同一张照片的动画复用连接关系。" },
      { name: "OpenCV / Flask", responsibility: "用局部仿射变换、加权融合和视频写出生成结果，通过本地接口连接交互页面。" }
    ],
    implementation: [
      { title: "从照片中建立稳定的面部参照", description: "读取图像，使用开启细化关键点的 Face Mesh 获取 478 个位置。以两侧眼角建立脸部坐标轴，并以眼间距作为尺度，让相同强度在不同大小的人脸上有相近的相对位移。", output: "原始关键点、脸部局部坐标与尺度" },
      { title: "为眼睛和嘴部编写独立变形规则", description: "将表情命令转换为局部位移。上下眼睑分别处理，眼角作为锚点；闭眼使用独立规则，避免直接反转睁眼动作造成交叉。微笑、悲伤等嘴部变化与强度参数共同决定目标关键点。", output: "指定表情和强度下的目标关键点" },
      { title: "让三角网格带动照片像素", description: "在中性关键点上建立一次 Delaunay 拓扑，再把每个源三角形仿射映射到目标三角形。只计算局部 ROI，并用像素权重累积重叠区域；最后通过羽化的人脸遮罩与原图融合，缓解接缝。", output: "经过局部变形与融合的二维表情图像" },
      { title: "把单帧算法接成预览与动画", description: "预览和视频共用表情强度与渲染逻辑。视频逐帧改变强度，复用同一份三角连接关系，再通过 OpenCV 写出。保留不同强度的诊断图和测试，用来检查眼睑、嘴角及零强度时的表现。", output: "交互预览、视频文件与强度对照材料" }
    ],
    decisions: [
      { question: "为什么先做关键点位移，再进行图像变形？", answer: "几何模块只回答“关键点应该去哪里”，渲染模块只回答“像素怎么跟过去”。拆开后可以单独检查眼睛是否闭合、嘴角方向是否正确，再排查网格接缝；修改表情规则时也不必重写整套像素处理。" },
      { question: "眼睛和嘴部容易变形失真，怎么处理？", answer: "眼睑采用上下轮廓与固定眼角，闭眼使用独立规则；嘴部按轮廓及脸部尺度控制位移。渲染阶段再用局部仿射、重叠权重归一化和人脸遮罩羽化减轻接缝。这些处理针对二维变形，不能补出照片中不存在的牙齿或被遮挡区域。" },
      { question: "为什么动画不在每一帧重新建立三角网格？", answer: "同一张照片的点之间保持固定连接关系，可以减少重复计算，也避免拓扑切换带来的画面变化。局部 ROI 进一步限制每个三角形的处理范围；零强度直接返回原图，避免无意义的插值。优化范围是计算与稳定性，不据此宣称所有设备都实时。" }
    ],
    verification: [
      { title: "几何检查", detail: "已有测试覆盖睁眼与闭眼方向、眼角锚定、位移随脸部尺度变化、强度限制和未知命令处理。" },
      { title: "渲染检查", detail: "已有测试检查拓扑复用、输出尺寸与数据类型、零位移一致性；诊断图用于观察不同强度下的局部形变。" },
      { title: "现有输出", detail: "保留本地交互预览与视频生成路径。上方图片展示 smile 强度对照，可放大检查嘴角与眼部变化。" }
    ],
    evidenceNote: "依据优化版源码、几何与渲染测试、表情诊断材料整理，覆盖从关键点到二维图像与视频的传统变形链路。"
  },
  codeedu: {
    purpose: "把需求文档、代码生成和构建验证连起来，让每一步都能回到原始材料检查依据。",
    imageSize: [1440, 916],
    workflow: [
      { title: "读入文档", description: "接收 PDF / DOCX 材料，保留原始文件和解析依据。" },
      { title: "整理需求", description: "形成可审查的需求与对应关系，明确每一项功能从哪里来。" },
      { title: "生成并验证", description: "匹配已支持的 CRUD 或 Java 实验模板，运行构建测试，再保留日志与工件。" }
    ],
    architecture: {
      description: "React 工作台承载操作，Spring Boot 后端管理解析、需求、设计、生成与验证。证据引用和追踪关系贯穿各阶段，生成器只在已支持的模板范围内工作。",
      nodes: [
        { title: "材料与证据", detail: "保留 PDF 页码或 DOCX 段落位置" },
        { title: "需求审查", detail: "整理候选需求、诊断与人工确认" },
        { title: "设计与追踪", detail: "建立需求、模块和工件之间的关系" },
        { title: "模板生成", detail: "匹配 Spring CRUD 或 Java 实验模板" },
        { title: "构建与验收", detail: "执行 Maven，导出报告、矩阵和 ZIP" }
      ]
    },
    technologies: [
      { name: "React / TypeScript", responsibility: "组织材料上传、需求审查、阶段状态、构建日志和下载入口，让过程可以在同一工作台查看。" },
      { name: "Java 21 / Spring Boot", responsibility: "实现各阶段接口、流程状态检查、数据持久化和任务调用，连接从输入到验收的后端链路。" },
      { name: "PDFBox / Apache POI", responsibility: "读取文本层 PDF 和普通 DOCX，保留页码或段落证据；扫描件 OCR 不在当前支持范围内。" },
      { name: "模板生成 / Maven", responsibility: "按已登记模板生成源码与文件清单，执行真实构建测试并记录退出状态，避免把“生成了文件”当成“已经运行”。" }
    ],
    implementation: [
      { title: "让文档解析保留原始依据", description: "上传材料后保留原文件，将文本拆成带位置的段落。PDF 使用页码定位，DOCX 使用段落定位，让需求提取能引用具体材料，而不是只留一段无法回查的汇总文字。", output: "原文件、解析片段与页码／段落证据" },
      { title: "把候选需求变成可审查条目", description: "记录需求标题、验收标准和来源引用，并输出覆盖诊断。通用抽取结果需要人工复核；结构覆盖充分只表示材料已被处理，不代表语义完全正确。确认后再形成设计模块与追踪关系。", output: "可审查需求、诊断结果和需求到设计的对应关系" },
      { title: "只在适用范围内生成代码", description: "先检查流程是否达到设计就绪状态，再匹配已登记生成器。现有实现包含 Spring CRUD 与 Java 实验模板；不适用的材料返回明确的“不支持”结果，不创建貌似完成的源码工作区。生成文件保留哈希与需求关联。", output: "模板版本、源码工作区与带关联信息的文件清单" },
      { title: "执行构建，再把证据串回需求", description: "调用本地 Maven 运行构建测试，保留命令、退出码和日志。将需求、设计、代码与验证记录组织为追踪关系，导出测试／验收报告、追踪矩阵和 ZIP，便于逐项检查产物及其依据。", output: "真实构建结果、追踪矩阵、报告与下载工件" }
    ],
    decisions: [
      { question: "怎样证明代码确实来自材料里的需求？", answer: "先让需求引用解析片段，再建立需求到设计、设计到代码、代码到验证的关系。生成文件清单记录路径、哈希和需求标识，追踪矩阵将这些关系组织起来。它帮助定位证据缺口，但不自动替代人工对需求含义的判断。" },
      { question: "遇到陌生材料，为什么选择拦截代码生成？", answer: "文档能解析，不代表生成器知道如何实现。系统将材料抽取与代码生成能力分开：陌生领域可以保留候选需求和证据，但在模板不匹配时返回 GENERATOR_PROFILE_UNSUPPORTED。这样不会把无关的 CRUD 骨架包装成该材料的完整实现。" },
      { question: "没有远程模型时，如何继续开发与验证？", answer: "本地 Mock／规则路径让解析、流程状态、模板生成、构建和下载可以独立验收；远程模型通过单独接口接入。本地通过只能证明该模式下的链路，不能替代真实远程模型、CodeArts 审查或云端部署的验证。" }
    ],
    verification: [
      { title: "真实材料链路", detail: "2026-08-27 本地验收记录包含 3 份文本层 PDF 与 1 份普通 DOCX，经真实浏览器与 Spring Boot API 检查解析、需求和诊断。" },
      { title: "构建与边界", detail: "同一记录中，支持的 Java 实验模板执行 Maven 测试并返回退出码 0；陌生材料被拦截，未创建源码工作区。" },
      { title: "导出与追踪", detail: "验收记录检查了验收报告、测试报告、追踪矩阵和 ZIP 的下载接口与格式签名，可查看各阶段保留的产物。" }
    ],
    evidenceNote: "验收描述来自项目既有的 2026-08-27 本地记录，本页面未重新运行 CodeEdu 服务。该记录使用本地 Mock／规则路径与 H2，不代表云端或真实用户验证。"
  }
};

const projectPresentation = {
  soc: {
    idea: "从一条日志，到一条可以核查的风险线索。",
    stages: ["定义输入", "分开建模", "冻结与验证", "回到日志"],
    takeaway: "研究实验与比赛模型各自保留配置和评估，预测结果继续对应原始事件，便于回查。",
    result: "已有本地 SOC 演示、研究代码与比赛推理材料。"
  },
  hemw: {
    idea: "先移动面部位置，再让照片中的像素跟上。",
    stages: ["定位面孔", "计算位移", "网格变形", "生成动画"],
    takeaway: "用眼间距控制相对位移，并复用固定三角网格，让不同照片和逐帧变形采用一致的几何规则。",
    result: "已有二维表情预览、视频生成与强度对照材料。"
  },
  codeedu: {
    idea: "让每一段生成代码，都能回到需求的出处。",
    stages: ["解析材料", "审查需求", "约束生成", "构建验收"],
    takeaway: "需求保留页码或段落证据，生成文件关联需求，再通过真实构建保留验证结果。",
    result: "已有本地工作台、支持的生成模板与构建验收记录。"
  }
};

function Face({ smile = false }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M55 25C23 25 16 58 25 88C31 112 42 125 55 127C70 123 81 107 86 85C92 52 83 25 55 25Z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M34 65Q42 59 49 65M63 65Q71 59 78 65M55 68L51 87L60 87" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: smile ? "M40 98Q55 115 73 97" : "M42 102Q55 107 70 102" })
  ] });
}
function Document({ code = false }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M30 24H105L125 44V136H30ZM105 24V44H125" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: code ? "M61 65L47 79L61 93M92 65L106 79L92 93M85 59L72 100" : "M46 58H102M46 73H102M46 88H86M46 111H68" })
  ] });
}
function Scene({ id, index }) {
  if (id === "hemw") {
    if (index === 0) return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "17", y: "12", width: "125", height: "140", rx: "3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform: "translate(24 5)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Face, {}) })
    ] });
    if (index === 1) return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(25 5)", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Face, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("g", { className: "process-dots", children: [[55, 25], [34, 65], [49, 65], [63, 65], [78, 65], [51, 87], [40, 98], [55, 107], [73, 97], [55, 127], [25, 88], [86, 85]].map(([x, y]) => /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: x, cy: y, r: "3" }, `${x}-${y}`)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "process-fine", d: "M55 25L34 65L25 88L40 98L55 127L73 97L86 85L78 65L55 25M34 65L49 65L51 87L40 98L55 107L73 97L60 87L63 65L78 65M49 65L55 25L63 65M40 98L73 97" })
    ] });
    if (index === 2) return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M25 30L75 19L130 36L140 87L112 133L61 139L21 111ZM25 30L70 63L75 19L112 75L130 36M21 111L70 63L61 139L112 75L112 133M70 63L112 75L140 87M21 111L61 139M25 30L21 111" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "70", cy: "63", r: "5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "process-fine", d: "M70 63L80 52M76 53L80 52L79 57" })
    ] });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "5", y: "35", width: "152", height: "92", rx: "2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 46H157M5 116H157M55 46V116M106 46V116" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform: "translate(10 45) scale(.36)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Face, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform: "translate(61 45) scale(.36)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Face, { smile: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform: "translate(111 45) scale(.36)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Face, { smile: true }) })
    ] });
  }
  if (id === "soc") {
    if (index === 0) return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 27H142V139H20ZM20 50H142" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M34 38H37M44 38H47M54 38H57M35 69H47M58 69H123M35 87H47M58 87H106M35 105H47M58 105H123M35 123H47M58 123H112" })
    ] });
    if (index === 1) return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "30", cy: "83", r: "15" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M45 83H69V42H99M69 83V124H99" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "99", y: "22", width: "59", height: "40", rx: "2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "99", y: "104", width: "59", height: "40", rx: "2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "128", y: "47", children: "研究" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "128", y: "129", children: "比赛" })
    ] });
    if (index === 2) return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "30", y: "61", width: "98", height: "80", rx: "4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M48 61V43C48 4 111 4 111 43V61M52 91L68 106L104 79" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "process-fine", d: "M45 126H112" })
    ] });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "13", y: "22", width: "137", height: "120", rx: "3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M13 43H150M28 59H66M28 71H54M28 123H135M40 122V102H54V122M77 122V84H91V122M113 122V65H127V122" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "123", cy: "32", r: "3" })
    ] });
  }
  if (index === 0) return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform: "translate(-9 9)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Document, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "process-fine", d: "M41 16H120L140 36V126" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "76", y: "145", children: "PDF / DOCX" })
  ] });
  if (index === 1) return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "16", y: "24", width: "55", height: "37", rx: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "92", y: "65", width: "55", height: "37", rx: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "16", y: "108", width: "55", height: "37", rx: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M71 42H81V84H92M71 127H81V84" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "43", y: "48", children: "需求" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "119", y: "89", children: "设计" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "43", y: "132", children: "证据" })
  ] });
  if (index === 2) return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Document, { code: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "78", y: "122", children: "JAVA / CRUD" })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "13", y: "26", width: "138", height: "113", rx: "3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M13 48H151M29 66L38 73L29 80M47 79H69M32 102H121M32 118H97" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "83", y: "41", children: "BUILD" })
  ] });
}
function ProjectProcessArt({ id, active, onSelect }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "case-process-art", viewBox: "0 0 900 180", role: "img", "aria-label": `${id === "hemw" ? "面部关键点、网格与动画" : id === "soc" ? "日志、独立模型与研判" : "文档、证据关系与构建"}处理流程示意`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("marker", { id: "process-arrow", markerWidth: "7", markerHeight: "7", refX: "5", refY: "3.5", orient: "auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M0 0L6 3.5L0 7", fill: "none", stroke: "currentColor" }) }) }),
    [0, 1, 2, 3].map((index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: `translate(${17 + index * 230} 3)`, className: active === index ? "process-scene is-active" : "process-scene", "data-process-scene": index, onClick: () => onSelect(index), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { className: "process-hit", x: "0", y: "0", width: "175", height: "170", fill: "transparent", stroke: "none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scene, { id, index }),
      index < 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "process-connector", d: "M175 84H204", markerEnd: "url(#process-arrow)" })
    ] }, index))
  ] });
}

function TechnicalNotes({ project, story, trigger, onClose }) {
  const ref = reactExports.useRef(null);
  reactExports.useLayoutEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [trigger]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("dialog", { ref, className: "case-notes-viewer", "aria-labelledby": "case-notes-title", "data-lenis-prevent": true, onCancel: (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "case-notes-nav", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mono", children: "TECHNICAL NOTES" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { id: "case-notes-title", children: [
          project.title,
          " · 技术说明"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: onClose, "aria-label": "关闭技术说明，返回项目", children: [
        "返回项目 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "×" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "case-notes-body", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "目标与技术分工" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: project.challenge }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: story.architecture.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { children: story.technologies.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { children: item.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { children: item.responsibility })
        ] }, item.name)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "实现中的关键判断" }),
        story.decisions.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { open: index === 0, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { children: [
            item.question,
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "+" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.answer })
        ] }, item.question))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "成果与验证依据" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { children: story.verification.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { children: item.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { children: item.detail })
        ] }, item.title)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "case-notes-scope", children: story.evidenceNote })
      ] })
    ] })
  ] });
}
function ProjectTechnicalStory({ story, project }) {
  const [step, setStep] = reactExports.useState(0), [notes, setNotes] = reactExports.useState(null);
  const presentation = projectPresentation[project.id], implementation = story.implementation[step];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "case-process", "aria-labelledby": "case-process-title", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "case-process-heading", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mono", children: "02 / THE MAKING" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { id: "case-process-title", tabIndex: -1, children: presentation.idea })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "case-notes-trigger", "aria-haspopup": "dialog", onClick: (event) => setNotes(event.currentTarget), children: [
          "技术说明 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "↗" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "case-process-figure", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectProcessArt, { id: project.id, active: step, onSelect: setStep }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { id: "case-contents", className: "case-process-stages", role: "group", "aria-label": "实现过程", tabIndex: -1, children: presentation.stages.map((title, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { "aria-pressed": step === index, "aria-controls": "case-stage-story", "aria-label": `第 ${index + 1} 步：${title}`, onClick: () => setStep(index), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mono", children: String(index + 1).padStart(2, "0") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "case-stage-mark", "aria-hidden": "true", children: "↗" })
        ] }, title)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "case-diagram-caption", children: "实现流程示意 · 选择节点查看这一阶段" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "case-making-story", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { id: "case-stage-story", className: "case-focused-story", "aria-live": "polite", "aria-atomic": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mono", children: [
            "STEP ",
            String(step + 1).padStart(2, "0"),
            " / ",
            String(story.implementation.length).padStart(2, "0")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: implementation.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: implementation.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "case-step-output", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "阶段产物" }),
            implementation.output
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "case-key-decision", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mono", children: "THE KEY DECISION" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "关键取舍" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: presentation.takeaway }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { "aria-label": "主要技术", children: project.stack.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: item }, item)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "case-result", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mono", children: "THE OUTCOME" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: presentation.result })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: project.boundary })
      ] })
    ] }),
    notes && /* @__PURE__ */ jsxRuntimeExports.jsx(TechnicalNotes, { project, story, trigger: notes, onClose: () => setNotes(null) })
  ] });
}

const number = (index) => String(index + 1).padStart(2, "0");
function ProjectImage({ image, onOpen }) {
  const [state, setState] = reactExports.useState("loading");
  const [attempt, setAttempt] = reactExports.useState(0);
  const src = attempt ? `${image.src}?retry=${attempt}` : image.src;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("figure", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "case-image-frame", "data-image-state": state, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "case-image-trigger", disabled: state === "error", "aria-label": `查看大图：${image.caption}`, "aria-busy": state === "loading", onClick: (event) => onOpen(image, event.currentTarget), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, width: image.width, height: image.height, alt: image.caption, loading: "eager", decoding: "async", onLoad: () => setState("ready"), onError: () => setState("error") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "case-image-hint mono", "aria-hidden": "true", children: [
          "查看大图 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Arrow, { diagonal: true })
        ] })
      ] }),
      state === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "case-image-error", role: "status", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "图片暂时无法加载" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setState("loading");
          setAttempt((value) => value + 1);
        }, children: "重新加载 ↗" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("figcaption", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: image.caption.replace(/^已有项目截图 \/ /, "").replace(/^已有诊断图 \/ /, "") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "case-preview-note", children: "局部预览 · 可查看完整原图" })
    ] })
  ] });
}
function ImageViewer({ image, trigger, onClose }) {
  const ref = reactExports.useRef(null);
  const stage = reactExports.useRef(null);
  const [fullSize, setFullSize] = reactExports.useState(false);
  reactExports.useLayoutEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [trigger]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("dialog", { ref, className: "case-image-viewer", "aria-labelledby": "case-image-title", "data-lenis-prevent": true, onCancel: (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "case-viewer-nav", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: "case-image-title", children: image.caption.replace(/^已有项目截图 \/ /, "").replace(/^已有诊断图 \/ /, "") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": fullSize ? "适应屏幕" : "查看原始尺寸", "aria-pressed": fullSize, onClick: () => {
          setFullSize((value) => !value);
          stage.current?.scrollTo(0, 0);
        }, children: fullSize ? "适应屏幕" : "原始尺寸" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "case-viewer-close", onClick: onClose, "aria-label": "关闭大图，返回详情", children: [
          "返回详情 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "×" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: stage, className: "case-viewer-stage", "data-full-size": fullSize, children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: image.src, width: image.width, height: image.height, alt: image.caption }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "case-viewer-note", children: fullSize ? "可滚动查看图片细节" : "点击返回详情，或按 Esc 关闭大图" })
  ] });
}
function ProjectDetail({ index, onClose, onNext, sound }) {
  const ref = reactExports.useRef(null), content = reactExports.useRef(null), heading = reactExports.useRef(null);
  const [preview, setPreview] = reactExports.useState(null);
  const closePreview = reactExports.useCallback(() => setPreview(null), []);
  const project = projects[index], story = projectStories[project.id], next = projects[(index + 1) % projects.length];
  const jumpTo = (id) => {
    const target = ref.current?.querySelector(`#${id}`);
    target?.scrollIntoView({ behavior: runtime.reduced ? "instant" : "smooth", block: "start" });
    (target?.querySelector("[aria-pressed=true]") ?? target)?.focus({ preventScroll: true });
  };
  reactExports.useLayoutEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const tween = gsapWithCSS.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: runtime.reduced ? 0 : 0.3 });
    const cancel = (event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", cancel);
    return () => {
      tween.kill();
      dialog.removeEventListener("cancel", cancel);
      dialog.close();
    };
  }, [onClose]);
  reactExports.useLayoutEffect(() => {
    ref.current.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
    const tween = gsapWithCSS.fromTo(content.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: runtime.reduced ? 0 : 0.25, clearProps: "transform" });
    return () => {
      tween.kill();
    };
  }, [index]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("dialog", { className: "project-detail case-study case-editorial", ref, "aria-labelledby": "detail-title", "data-lenis-prevent": true, "data-project-id": project.id, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-nav case-nav", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mono", children: [
        "SELECTED WORK ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "case-count", children: [
          number(index),
          " / ",
          number(projects.length - 1)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "case-nav-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "case-contents-top", "aria-label": "查看实现过程", onClick: () => jumpTo("case-process-title"), children: "过程 ↓" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SoundToggle, { ...sound, onToggle: () => void sound.toggle() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "case-next-top mono", onClick: onNext, "aria-label": `下一个项目：${next.title}`, children: [
          "NEXT ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Arrow, {})
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "close-detail mono", onClick: onClose, "aria-label": "关闭详情，返回作品", children: [
          "返回作品 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "×" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "case-content", ref: content, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "case-intro", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "case-category mono", children: project.category }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "detail-title", ref: heading, tabIndex: -1, children: project.title })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "case-intro-aside", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "detail-purpose", children: story.purpose }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "case-project-meta", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: project.role }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mono", children: project.year })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "case-gallery", children: project.gallery.map((image) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectImage, { image: { ...image, width: story.imageSize[0], height: story.imageSize[1] }, onOpen: (image2, trigger) => setPreview({ image: image2, trigger }) }, image.src)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectTechnicalStory, { story, project }, project.id),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "next-project case-next", onClick: onNext, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mono", children: [
          "下一个项目 / ",
          number((index + 1) % projects.length)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: next.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Arrow, { diagonal: true })
      ] })
    ] }),
    preview && /* @__PURE__ */ jsxRuntimeExports.jsx(ImageViewer, { ...preview, onClose: closePreview })
  ] });
}

export { ProjectDetail as default };
