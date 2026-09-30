import {handleApi} from './api.mjs';
// ═══════════════════════════════════════════════
// Cloudflare Worker — 出海简历定制工具
// 部署方法：粘贴到 Workers 编辑器，添加环境变量
//   DASHSCOPE_API_KEY = 你的 API Key
// ═══════════════════════════════════════════════

const HTML = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>中文经历重构英文简历工具</title>
<!-- html2pdf removed, using Word export instead -->
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #ffffff; --bg2: #f7f7f5; --bg3: #eeede9;
  --text: #1a1a1a; --text2: #5a5a5a; --text3: #999;
  --border: rgba(0,0,0,0.09); --border2: rgba(0,0,0,0.18);
  --radius: 8px; --radius-lg: 14px;
  --green-bg: #eaf5ee; --green-text: #2a7a4f; --green-bd: #b0dfc0;
  --blue-bg: #edf4fc;  --blue-text: #1f5fa6;  --blue-bd: #b0cff0;
  --amber-bg: #fff8e6; --amber-text: #9a6800; --amber-bd: #f0d090;
  --purple-bg: #f3effe;--purple-text: #5c3db0;--purple-bd: #cbb8f0;
  --danger-bg: #fdf0f0;--danger-text: #c0392b;
}
body { font-family: -apple-system,'PingFang SC','Helvetica Neue',sans-serif; background:var(--bg); color:var(--text); }
.container { max-width:720px; margin:0 auto; padding:40px 24px 80px; }
.header { margin-bottom:2.5rem; }
.header h1 { font-size:22px; font-weight:600; margin-bottom:6px; }
.header p { font-size:14px; color:var(--text2); line-height:1.65; }

.step-bar { display:flex; align-items:center; margin-bottom:2.5rem; }
.step-item { display:flex; align-items:center; gap:7px; font-size:13px; color:var(--text3); }
.step-item.active { color:var(--text); font-weight:500; }
.step-item.done { color:var(--green-text); }
.step-dot { width:24px; height:24px; border-radius:50%; border:1px solid var(--border2); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; background:var(--bg); flex-shrink:0; }
.step-item.active .step-dot { background:var(--text); color:#fff; border-color:var(--text); }
.step-item.done .step-dot { background:var(--green-bg); color:var(--green-text); border-color:var(--green-bd); }
.step-line { flex:1; height:1px; background:var(--border); margin:0 8px; }

.step-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--text3); margin-bottom:5px; }
.section-title { font-size:20px; font-weight:600; margin-bottom:5px; }
.section-sub { font-size:14px; color:var(--text2); line-height:1.65; margin-bottom:1.5rem; }
.value-strip { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:18px 0 18px; }
.value-item { border:1px solid var(--border); border-radius:var(--radius); padding:12px 13px; background:var(--bg2); }
.value-item b { display:block; font-size:13px; margin-bottom:4px; }
.value-item span { display:block; font-size:12px; color:var(--text2); line-height:1.55; }
.info-panel { border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px; margin:16px 0; background:var(--bg2); }
.panel-title { font-size:13px; font-weight:600; margin-bottom:10px; }
.audience-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.audience-list { list-style:none; display:flex; flex-direction:column; gap:8px; font-size:13px; color:var(--text2); line-height:1.55; }
.audience-list li { position:relative; padding-left:16px; }
.audience-list li::before { content:""; width:6px; height:6px; border-radius:50%; background:var(--text); position:absolute; left:0; top:.65em; }
.audience-list.muted li::before { background:var(--text3); }
.ba-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.ba-cell { border:1px solid var(--border); border-radius:var(--radius); padding:12px; background:var(--bg); }
.ba-label { font-size:11px; color:var(--text3); font-weight:600; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; }
.ba-text { font-size:13px; color:var(--text2); line-height:1.65; }
.privacy-note { border:1px solid var(--amber-bd); background:var(--amber-bg); color:#5a3d00; border-radius:var(--radius); padding:12px 14px; font-size:13px; line-height:1.65; margin:14px 0 18px; }
.field-label { font-size:13px; font-weight:500; color:var(--text2); margin-bottom:6px; display:flex; align-items:center; gap:6px; }
.opt-tag { font-size:11px; background:var(--bg3); color:var(--text3); padding:2px 7px; border-radius:20px; font-weight:400; }
textarea { width:100%; border-radius:var(--radius); border:1px solid var(--border2); padding:12px 14px; font-size:14px; font-family:inherit; resize:vertical; background:var(--bg); color:var(--text); line-height:1.65; transition:border-color .15s; }
textarea:focus { outline:none; border-color:var(--text); }
textarea::placeholder { color:var(--text3); }
.gap { height:16px; }

.btn { padding:10px 22px; border-radius:var(--radius); font-size:14px; font-weight:500; cursor:pointer; border:none; display:inline-flex; align-items:center; gap:6px; transition:opacity .15s,background .15s; }
.btn-primary { background:var(--text); color:#fff; }
.btn-primary:hover { opacity:.82; }
.btn-outline { background:transparent; color:var(--text); border:1px solid var(--border2); }
.btn-outline:hover { background:var(--bg2); }
.row { display:flex; gap:10px; align-items:center; margin-top:14px; flex-wrap:wrap; }

.loading { display:flex; align-items:center; gap:12px; padding:2rem 0; color:var(--text2); font-size:14px; }
.spinner { width:18px; height:18px; border:2px solid var(--border2); border-top-color:var(--text); border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
@keyframes spin { to { transform:rotate(360deg); } }
.error { font-size:13px; color:var(--danger-text); background:var(--danger-bg); padding:10px 14px; border-radius:var(--radius); margin-top:12px; line-height:1.5; }
.divider { height:1px; background:var(--border); margin:1.75rem 0; }

.report { display:flex; flex-direction:column; gap:16px; }
.report-block { border-radius:var(--radius-lg); padding:18px 20px; }
.rb-green  { background:var(--green-bg);  border:1px solid var(--green-bd);  }
.rb-blue   { background:var(--blue-bg);   border:1px solid var(--blue-bd);   }
.rb-amber  { background:var(--amber-bg);  border:1px solid var(--amber-bd);  }
.rb-purple { background:var(--purple-bg); border:1px solid var(--purple-bd); }
.rb-icon-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.rb-icon { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.rb-icon svg { width:14px; height:14px; fill:#fff; }
.ic-green  { background:var(--green-text);  }
.ic-blue   { background:var(--blue-text);   }
.ic-amber  { background:var(--amber-text);  }
.ic-purple { background:var(--purple-text); }
.rb-title { font-size:14px; font-weight:600; }
.rb-green  .rb-title { color:var(--green-text);  }
.rb-blue   .rb-title { color:var(--blue-text);   }
.rb-amber  .rb-title { color:var(--amber-text);  }
.rb-purple .rb-title { color:var(--purple-text); }
.rb-body { font-size:14px; line-height:1.8; white-space:pre-wrap; }
.rb-green  .rb-body { color:#1a4a30; }
.rb-blue   .rb-body { color:#163d6e; }
.rb-amber  .rb-body { color:#5a3d00; }
.rb-purple .rb-body { color:#3a2570; }

.path-section-title { font-size:14px; font-weight:600; margin-bottom:10px; }
.path-cards { display:flex; flex-direction:column; gap:10px; }
.path-card { background:var(--bg); border:1px solid var(--border2); border-radius:var(--radius-lg); padding:14px 16px; cursor:pointer; transition:border-color .15s; }
.path-card:hover { border-color:var(--text2); }
.path-card.selected { border:2px solid var(--text); }
.pc-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:7px; }
.pc-title { font-size:15px; font-weight:600; }
.pc-zh { font-size:12px; color:var(--text2); margin-top:2px; }
.pc-badge { font-size:11px; padding:3px 9px; border-radius:20px; font-weight:500; white-space:nowrap; flex-shrink:0; margin-left:8px; margin-top:2px; }
.badge-now    { background:var(--green-bg);  color:var(--green-text);  }
.badge-next   { background:var(--blue-bg);   color:var(--blue-text);   }
.badge-target { background:var(--purple-bg); color:var(--purple-text); }
.pc-desc { font-size:13px; color:var(--text2); line-height:1.65; margin-bottom:8px; }
.pc-tags { display:flex; flex-wrap:wrap; gap:6px; }
.pc-tag { font-size:11px; background:var(--bg2); color:var(--text2); padding:3px 9px; border-radius:20px; }

/* ===== Language Tab Bar ===== */
.lang-tabs {
  display: flex; gap: 0; margin-bottom: 12px; border-radius: var(--radius);
  overflow: hidden; border: 1px solid var(--border2);
}
.lang-tab {
  flex: 1; padding: 10px 20px; font-size: 14px; font-weight: 500;
  text-align: center; cursor: pointer; background: var(--bg2); color: var(--text2);
  border: none; transition: background .15s, color .15s; position: relative;
}
.lang-tab:hover { background: var(--bg3); }
.lang-tab.active { background: var(--text); color: #fff; font-weight: 600; }
.lang-tab .tab-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 10px; margin-left: 6px;
  vertical-align: middle; font-weight: 400;
}
.lang-tab.active .tab-badge { background: rgba(255,255,255,0.25); color: #fff; }
.lang-tab:not(.active) .tab-badge { background: var(--bg3); color: var(--text3); }

/* ===== Resume Preview Styles ===== */
.resume-wrapper {
  margin-top: 0;
  display: flex; flex-direction: column; gap: 16px;
}
.resume-preview {
  background: #fff; border: 1px solid var(--border2);
  border-radius: var(--radius-lg); box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  overflow: hidden;
}
.resume-page {
  padding: 48px 52px 40px;
  font-family: Arial, 'PingFang SC', 'Helvetica Neue', sans-serif;
  color: #595959; font-size: 10.5pt; line-height: 1.55;
}
.resume-page .r-name {
  font-size: 26pt; font-weight: 700; text-align: center;
  margin-bottom: 4px; letter-spacing: -0.02em;
}
.resume-page .r-contact {
  text-align: center; font-size: 9pt; color: #595959; margin-bottom: 4px;
}
.resume-page .r-headline {
  text-align: center; font-size: 10pt; font-weight: 700;
  margin-bottom: 16px; letter-spacing: 0;
}
.resume-page .r-section-head {
  font-size: 11pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; padding-bottom: 3px;
  margin-top: 14px; margin-bottom: 7px;
}
.resume-page .r-summary { font-size: 10pt; line-height: 1.6; color: #595959; }
.resume-page .r-skill-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0; margin: 2px 0 10px;
}
.resume-page .r-skill-grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.resume-page .r-skill {
  text-align: center; font-size: 9pt; line-height: 1.35;
  padding: 7px 8px; min-height: 28px;
  display: flex; align-items: center; justify-content: center;
}
.resume-page .r-skill.top {
  font-weight: 700;
}
.resume-page .r-exp-block { margin-bottom: 12px; }
.resume-page .r-exp-header {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 1px;
}
.resume-page .r-exp-title { font-size: 11pt; font-weight: 700; }
.resume-page .r-exp-company { font-size: 10pt; color: #595959; }
.resume-page .r-exp-date { font-size: 9pt; color: #888; white-space: nowrap; }
.resume-page .r-exp-subtitle { font-size: 9pt; color: #888; margin-bottom: 4px; font-style: italic; }
.resume-page .r-exp-bullets { padding-left: 16px; margin: 0; }
.resume-page .r-exp-bullets li {
  font-size: 10pt; color: #595959; line-height: 1.55;
  margin-bottom: 3px; page-break-inside: avoid;
}
.resume-page .r-edu-block { margin-bottom: 6px; }
.resume-page .r-edu-header {
  display: flex; justify-content: space-between; align-items: baseline;
}
.resume-page .r-edu-degree { font-size: 10.5pt; font-weight: 700; }
.resume-page .r-edu-school { font-size: 10pt; color: #595959; }
.resume-page .r-edu-date { font-size: 9pt; color: #888; white-space: nowrap; }
.resume-page .r-edu-notes { padding-left: 16px; margin: 2px 0 0; }
.resume-page .r-edu-notes li { font-size: 9.5pt; color: #595959; line-height: 1.5; }

/* Chinese resume specific */
.resume-page.zh-page .r-name { letter-spacing: 0.08em; }
.resume-page.zh-page .r-section-head { letter-spacing: 0.12em; }

/* Color theme indicators for path card */
.theme-dot {
  width: 12px; height: 12px; border-radius: 50%; display: inline-block;
  margin-right: 4px; vertical-align: middle; border: 1px solid rgba(0,0,0,0.12);
}

/* Download & action buttons */
.result-actions {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12px; flex-wrap: wrap; gap: 8px;
}
.action-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.copy-btn {
  background: var(--bg2); border: 1px solid var(--border2); color: var(--text);
  padding: 9px 18px; border-radius: var(--radius); font-size: 13px;
  cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;
  transition: background .15s;
}
.copy-btn:hover { background: var(--bg3); }
.download-btn {
  background: #1a1a1a; color: #fff; border: none;
  padding: 10px 22px; border-radius: var(--radius); font-size: 14px;
  cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;
  transition: opacity .15s;
}
.download-btn:hover { opacity: .82; }
.download-btn svg { width:16px; height:16px; fill:#fff; }

/* Color theme picker */
.theme-picker { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.theme-picker-label { font-size: 12px; color: var(--text2); font-weight: 500; white-space: nowrap; }
#themeSwatches { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.theme-swatch {
  width: 22px; height: 22px; border-radius: 50%; cursor: pointer; flex-shrink: 0;
  border: 2px solid transparent; transition: border-color .15s, transform .15s;
}
.theme-swatch:hover { transform: scale(1.15); }
.theme-swatch.active { border-color: var(--text); }

/* Loading progress bar */
.gen-progress {
  margin-top: 8px; padding: 10px 16px; background: var(--bg2);
  border-radius: var(--radius); font-size: 13px; color: var(--text2);
}
.gen-progress-step { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.gen-progress-step .check { color: var(--green-text); font-weight: 600; }
.gen-progress-step .arrow { color: var(--text3); }
.gen-progress-step.current { color: var(--text); font-weight: 500; }

/* Responsive */
@media (max-width: 600px) {
  .value-strip, .audience-grid, .ba-grid { grid-template-columns: 1fr; }
  .resume-page { padding: 28px 24px 24px; }
  .resume-page .r-name { font-size: 20pt; }
  .lang-tab { padding: 8px 12px; font-size: 13px; }
}
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <h1>把中文经历，重构成海外雇主看得懂的英文简历</h1>
    <p>输入中文简历、职业偏好和目标岗位，AI 会先诊断经历价值、岗位匹配度和表达问题，再生成可下载的中英文简历。</p>
  </div>

  <div class="value-strip">
    <div class="value-item"><b>先诊断</b><span>先看职业定位、优势和差距，不直接套模板翻译。</span></div>
    <div class="value-item"><b>再重构</b><span>把执行描述改成海外招聘更熟悉的价值表达。</span></div>
    <div class="value-item"><b>可下载</b><span>生成中英双语版本，可复制文本，也可下载 Word 文件。</span></div>
  </div>

  <div class="step-bar">
    <div class="step-item active" id="si1"><div class="step-dot">1</div>输入信息</div>
    <div class="step-line"></div>
    <div class="step-item" id="si2"><div class="step-dot">2</div>职业诊断</div>
    <div class="step-line"></div>
    <div class="step-item" id="si3"><div class="step-dot">3</div>定制简历</div>
  </div>

  <!-- STEP 1 -->
  <div id="step1">
    <div class="step-label">第一步</div>
    <div class="section-title">告诉 AI 你的全貌</div>
    <div class="section-sub">三件事同时输入：你的真实性格偏好、中文简历、以及目标岗位 JD（如有）。AI 会综合三者进行深度诊断。</div>

    <div class="info-panel">
      <div class="panel-title">适合谁 / 不适合谁</div>
      <div class="audience-grid">
        <ul class="audience-list">
          <li>想申请海外岗位、远程岗位或外企岗位</li>
          <li>有中文经历，但不知道如何转成英文职业表达</li>
          <li>已经有目标 JD，希望知道真实匹配度和改写方向</li>
        </ul>
        <ul class="audience-list muted">
          <li>只想逐字翻译简历，不需要诊断</li>
          <li>期待工具虚构经历、数据或职位级别</li>
          <li>没有任何可分析的经历材料</li>
        </ul>
      </div>
    </div>

    <div class="info-panel">
      <div class="panel-title">Before / After 示例</div>
      <div class="ba-grid">
        <div class="ba-cell">
          <div class="ba-label">Before</div>
          <div class="ba-text">负责客户资料整理，协助完成签证材料审核。</div>
        </div>
        <div class="ba-cell">
          <div class="ba-label">After</div>
          <div class="ba-text">Reviewed and structured client documentation for visa applications, improving case clarity, consistency, and readiness for submission.</div>
        </div>
      </div>
    </div>

    <div class="privacy-note">隐私提醒：本工具不会主动保存你的简历内容；输入内容会发送至模型服务用于生成结果。建议提交前删除身份证号、家庭住址、完整电话等敏感信息。</div>

    <div class="field-label">你的性格与工作偏好</div>
    <textarea id="prefs" rows="4" placeholder="用你自己的话说，例如：&#10;我不喜欢管团队、不擅长拓展人脉，消耗很大。喜欢深度专业做事，喜欢重要的事情。偏好出海AI公司、外企，考核指标要清晰，不喜欢模糊的KPI..."></textarea>

    <div class="gap"></div>
    <div class="field-label">你的中文简历</div>
    <textarea id="resumeZh" rows="12" placeholder="直接粘贴简历文字内容，包含工作经历、项目成果、教育背景等..."></textarea>

    <div class="gap"></div>
    <div class="field-label">目标岗位 JD <span class="opt-tag">可选</span></div>
    <textarea id="jdInput" rows="5" placeholder="粘贴你感兴趣的职位描述（英文或中文均可）。&#10;有 JD 时 AI 会直接分析与目标岗位的真实匹配度、差距，以及如何一步步接近它。&#10;没有也可以，AI 会根据偏好推荐最匹配方向。"></textarea>

    <div class="row">
      <button class="btn btn-primary" onclick="runAnalysis()">开始职业诊断 →</button>
    </div>
    <div id="err1" class="error" style="display:none"></div>
  </div>

  <!-- STEP 2 -->
  <div id="step2" style="display:none">
    <div class="step-label">第二步</div>
    <div class="section-title">你的职业诊断报告</div>
    <div class="section-sub">基于你的性格、经历和目标方向的完整分析。选择一条路径后生成定制英文简历。</div>

    <div id="loadingAnalysis" class="loading"><div class="spinner"></div>正在深度分析你的性格、经历和目标方向，请稍候...</div>
    <div id="reportArea" style="display:none">
      <div class="report" id="reportBlocks"></div>
      <div class="divider"></div>
      <div class="path-section-title">选择你要生成简历的路径</div>
      <div class="path-cards" id="pathCards"></div>
      <div id="err2" class="error" style="display:none"></div>
      <div class="row" style="margin-top:1.25rem">
        <button class="btn btn-outline" onclick="setStep(1)">← 重新填写</button>
        <button class="btn btn-primary" onclick="generateResume()">生成定制简历（中英双语） →</button>
      </div>
    </div>
  </div>

  <!-- STEP 3 -->
  <div id="step3" style="display:none">
    <div class="step-label">第三步</div>
    <div class="section-title">你的定制简历</div>
    <div class="section-sub">已针对所选路径完成叙事重构——将"执行语言"升级为"战略思维语言"，同时生成中英双语版本。</div>

    <div id="loadingResume" class="loading">
      <div class="spinner"></div>
      <div>
        <div>正在生成你的定制简历...</div>
        <div class="gen-progress" id="genProgress"></div>
      </div>
    </div>
    <div id="resumeResult" style="display:none">
      <!-- Language Tabs -->
      <div class="lang-tabs">
        <button class="lang-tab active" data-lang="en" onclick="switchLang('en')">
          English <span class="tab-badge">EN</span>
        </button>
        <button class="lang-tab" data-lang="zh" onclick="switchLang('zh')">
          中文版 <span class="tab-badge">CN</span>
        </button>
      </div>

      <div class="theme-picker">
        <span class="theme-picker-label">主题配色：</span>
        <div id="themeSwatches"></div>
      </div>

      <div class="resume-wrapper">
        <!-- English Resume -->
        <div class="resume-preview" id="resumePreviewEn">
          <div class="resume-page" id="resumePageEn"></div>
        </div>
        <!-- Chinese Resume -->
        <div class="resume-preview" id="resumePreviewZh" style="display:none">
          <div class="resume-page zh-page" id="resumePageZh"></div>
        </div>
      </div>

      <div class="result-actions">
        <button class="btn btn-outline" onclick="setStep(2)">← 换条路径</button>
        <div class="action-btns">
          <button class="copy-btn" onclick="copyResumeText()">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2zm2 10v2h8V6h-2v4a2 2 0 0 1-2 2H6zM2 4v6h8V4H2z"/></svg>
            <span>复制纯文本</span>
          </button>
          <button class="download-btn" onclick="downloadDOCX()">
            <svg viewBox="0 0 16 16"><path d="M8 1a1 1 0 0 1 1 1v5.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L7 7.586V2a1 1 0 0 1 1-1zM2 11a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1z"/></svg>
            <span>下载 Word</span>
          </button>
        </div>
      </div>
    </div>
    <div id="err3" class="error" style="display:none"></div>
  </div>

</div>
<script>
let analysisData = null;
let selectedPath = null;
let resumeJSON_en = null;
let resumeJSON_zh = null;
let resumeText_zh = '';  // 中文简历纯文本（原版方式）
let currentTheme = 'navy';
let currentLang = 'en';

/* ===== Color Themes ===== */
const THEMES = {
  navy:    { name: '战略蓝',   primary:'#1F4E79', accent:'#2E75B6', light:'#D6E4F0', swatch:'#1F4E79' },
  teal:    { name: '科技青',   primary:'#0F766E', accent:'#14B8A6', light:'#CCFBF1', swatch:'#0F766E' },
  wine:    { name: '领导力红', primary:'#9B1B30', accent:'#DC2626', light:'#FEE2E2', swatch:'#9B1B30' },
  amber:   { name: '商业橙',   primary:'#B45309', accent:'#F59E0B', light:'#FEF3C7', swatch:'#B45309' },
  indigo:  { name: '金融靛',   primary:'#3730A3', accent:'#6366F1', light:'#E0E7FF', swatch:'#3730A3' },
  forest:  { name: 'GTM绿',    primary:'#1A5C38', accent:'#2E8B57', light:'#D6EAE0', swatch:'#1A5C38' },
  plum:    { name: '参谋紫',   primary:'#4A235A', accent:'#7D3C98', light:'#EAD9F5', swatch:'#4A235A' },
};

/* Auto-select theme based on path title keywords */
function autoTheme(title) {
  const t = (title||'').toLowerCase();
  if (/chief|staff|c-?suite|office of|ceo|founder|advisor|advisory/i.test(t)) return 'plum';
  if (/gtm|go[- ]?to[- ]?market|market entry|market expansion|product marketing/i.test(t)) return 'forest';
  if (/strategy|operations|bizops|business operations|strategy operations/i.test(t)) return 'navy';
  if (/engineer|developer|frontend|backend|tech|data|machine learn|ai|algorithm/i.test(t)) return 'teal';
  if (/market|growth|brand|content|seo|ads/i.test(t)) return 'amber';
  if (/product|design|ux|ui/i.test(t)) return 'plum';
  if (/financ|account|audit|risk/i.test(t)) return 'indigo';
  if (/director|vp|head|chief|president|lead.*team|\\u7BA1\\u7406|\\u603B\\u76D1/i.test(t)) return 'wine';
  if (/green|sustain|enviro/i.test(t)) return 'forest';
  return 'navy';
}

function applyTheme(themeId) {
  currentTheme = themeId;
  const t = THEMES[themeId];

  // Apply to both EN and ZH pages
  ['resumePageEn','resumePageZh'].forEach(pageId => {
    const page = document.getElementById(pageId);
    if (!page || !t) return;
    page.style.setProperty('--r-primary', t.primary);
    page.style.setProperty('--r-accent', t.accent);
    page.style.setProperty('--r-light', t.light);
    page.querySelectorAll('.r-name, .r-section-head, .r-exp-title, .r-edu-degree').forEach(el => el.style.color = t.primary);
    page.querySelectorAll('.r-headline').forEach(el => el.style.color = t.accent);
    page.querySelectorAll('.r-section-head').forEach(el => el.style.borderBottom = '2px solid ' + t.accent);
    page.querySelectorAll('.r-skill.top').forEach(el => {
      el.style.background = t.light;
      el.style.color = t.primary;
    });
  });

  // Update swatch active state
  document.querySelectorAll('.theme-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.theme === themeId);
  });
}

function renderThemeSwatches() {
  const container = document.getElementById('themeSwatches');
  container.innerHTML = '';
  Object.entries(THEMES).forEach(([id, t]) => {
    const el = document.createElement('div');
    el.className = 'theme-swatch' + (id === currentTheme ? ' active' : '');
    el.style.background = t.swatch;
    el.dataset.theme = id;
    el.title = t.name;
    el.onclick = () => applyTheme(id);
    container.appendChild(el);
  });
}

/* ===== Language Tab Switch ===== */
function switchLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.lang === lang);
  });
  document.getElementById('resumePreviewEn').style.display = lang === 'en' ? 'block' : 'none';
  document.getElementById('resumePreviewZh').style.display = lang === 'zh' ? 'block' : 'none';
}

/* ===== Step Navigation ===== */
function setStep(n) {
  [1,2,3].forEach(i => {
    document.getElementById('step'+i).style.display = i===n ? 'block' : 'none';
    const si = document.getElementById('si'+i);
    si.className = 'step-item'+(i===n?' active':i<n?' done':'');
    si.querySelector('.step-dot').textContent = i<n ? '\\u2713' : i;
  });
  window.scrollTo({top:0,behavior:'smooth'});
}
function showErr(id,msg){const e=document.getElementById(id);e.textContent=msg;e.style.display='block';}
function hideErr(id){document.getElementById(id).style.display='none';}

/* ===== API Call ===== */
let lastRawResponse = '';
let serviceAccessToken = ''; // Tab memory only; never a model API key.
async function callLLM(system, user, maxTokens=8000) {
  if (!serviceAccessToken) serviceAccessToken = prompt('输入你自行部署服务的访问口令（不是模型 API Key）') || '';
  if (!serviceAccessToken) throw new Error('需要服务访问口令');
  // Model API key stays in the server secret.
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Access-Token': serviceAccessToken },
    body: JSON.stringify({
      model: 'kimi-k2.6',
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });
  if (res.status === 401) serviceAccessToken = '';
  const text = await res.text();
  let d;
  try { d = JSON.parse(text); } catch(e) { throw new Error('API\\u54CD\\u5E94\\u5F02\\u5E38: ' + text.slice(0,200)); }
  if (!res.ok) throw new Error(d.error?.message || d.message || 'API\\u8BF7\\u6C42\\u5931\\u8D25 ' + res.status);
  const content = d.choices?.[0]?.message?.content || '';
  lastRawResponse = content;

  // Check for finish_reason that indicates truncation
  const finishReason = d.choices?.[0]?.finish_reason;
  if (finishReason === 'length') {
    console.warn('[callLLM] Output was truncated! finish_reason=length');
  }
  return content;
}

function extractJSON(raw) {
  if (!raw || raw.trim().length === 0) {
    throw new Error('AI\\u8FD4\\u56DE\\u4E3A\\u7A7A');
  }





  // Attempt 1: Direct parse
  try { const r = JSON.parse(raw);  return r; } catch(e) {}

  // Attempt 2: Strip markdown code fences (\`\`\`json ... \`\`\` or \`\`\` ... \`\`\`)
  let s = raw.replace(/^\\s*\`\`\`[a-zA-Z]*\\s*\\n?/gm, '').replace(/\\n?\`\`\`\\s*$/gm, '').trim();
  try { const r = JSON.parse(s);  return r; } catch(e) {}

  // Attempt 3: Find the LAST \`\`\`json and work from there (AI sometimes outputs commentary before)
  const lastFence = raw.lastIndexOf('\`\`\`');
  if (lastFence > 0) {
    // Find the opening \`\`\` before it
    const beforeLast = raw.lastIndexOf('\`\`\`', lastFence - 1);
    if (beforeLast >= 0) {
      const fenced = raw.slice(beforeLast, lastFence + 3);
      const stripped = fenced.replace(/^\\s*\`\`\`[a-zA-Z]*\\s*\\n?/, '').replace(/\\n?\`\`\`\\s*$/, '').trim();
      try { const r = JSON.parse(stripped);  return r; } catch(e) {}
    }
  }

  // Attempt 4: Find outermost { } and parse
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    let inner = s.slice(start, end+1);
    try { const r = JSON.parse(inner);  return r; } catch(e) {}

    // Attempt 5: Fix trailing commas before } or ]
    let fixed = inner.replace(/,\\s*([\\]}])/g, '$1');
    try { const r = JSON.parse(fixed);  return r; } catch(e) {}

    // Attempt 6: Fix single quotes to double quotes (careful not to break strings)
    // Only replace ' that are used as JSON string delimiters
    fixed = fixed.replace(/(?<![\\\\\\w])'([^']*)'(?=\\s*[:,\\[\\]{}])/g, '"$1"');
    try { const r = JSON.parse(fixed);  return r; } catch(e) {}

    // Attempt 7: Fix truncated JSON - find last complete value and close
    // Strategy: find the last valid comma/colon position and truncate there, then close brackets
    fixed = inner;
    // Remove incomplete trailing content (partial string/value after last comma)
    fixed = fixed.replace(/,\\s*"[^"]*$/,'');  // trailing incomplete key-value
    fixed = fixed.replace(/,\\s*[^"\\]\\}]*$/,'');  // trailing incomplete value
    // Count and close unclosed brackets
    const openBraces = (fixed.match(/\\{/g) || []).length;
    const closeBraces = (fixed.match(/\\}/g) || []).length;
    const openBrackets = (fixed.match(/\\[/g) || []).length;
    const closeBrackets = (fixed.match(/\\]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
    try { const r = JSON.parse(fixed);  return r; } catch(e) {}
  }

  console.error('[extractJSON] All attempts failed. Raw response:', raw);
  throw new Error('AI\\u8FD4\\u56DE\\u683C\\u5F0F\\u5F02\\u5E38\\uFF0C\\u539F\\u59CB\\u5185\\u5BB9\\u524D100\\u5B57: ' + raw.slice(0,100));
}

/* ===== Progress Indicator ===== */
function updateProgress(steps) {
  const el = document.getElementById('genProgress');
  el.innerHTML = steps.map(s => {
    if (s.status === 'done') return \`<div class="gen-progress-step"><span class="check">\\u2713</span> \${s.label}</div>\`;
    if (s.status === 'current') return \`<div class="gen-progress-step current"><span class="arrow">\\u25B6</span> \${s.label}</div>\`;
    return \`<div class="gen-progress-step"><span class="arrow">\\u25CB</span> \${s.label}</div>\`;
  }).join('');
}

/* ===== Step 2: Analysis ===== */
async function runAnalysis() {
  const prefs = document.getElementById('prefs').value.trim();
  const resumeZh = document.getElementById('resumeZh').value.trim();
  const jd = document.getElementById('jdInput').value.trim();
  hideErr('err1');
  if (prefs.length < 15) { showErr('err1','\\u8BF7\\u63CF\\u8FF0\\u4F60\\u7684\\u6027\\u683C\\u548C\\u5DE5\\u4F5C\\u504F\\u597D\\uFF08\\u81F3\\u5C1115\\u5B57\\uFF09'); return; }
  if (resumeZh.length < 80) { showErr('err1','\\u8BF7\\u7C98\\u8D34\\u4F60\\u7684\\u4E2D\\u6587\\u7B80\\u5386\\u5185\\u5BB9'); return; }

  setStep(2);
  document.getElementById('loadingAnalysis').style.display = 'flex';
  document.getElementById('reportArea').style.display = 'none';

  const sys = \`\\u4F60\\u662F\\u9876\\u7EA7\\u804C\\u4E1A\\u53D1\\u5C55\\u987E\\u95EE\\uFF0C\\u4E13\\u6CE8\\u4E8E\\u5E2E\\u52A9\\u4E2D\\u56FD\\u804C\\u573A\\u4EBA\\u8F6C\\u578B\\u51FA\\u6D77AI\\u516C\\u53F8\\u548C\\u5916\\u4F01\\u3002\\u4F60\\u50CF\\u4EBA\\u751F\\u5BFC\\u5E08\\u4E00\\u6837\\u5206\\u6790\\u4E00\\u4E2A\\u4EBA\\uFF1A\\u5148\\u80AF\\u5B9A\\u6027\\u683C\\u7279\\u8D28\\uFF0C\\u518D\\u6316\\u6398\\u7ECF\\u5386\\u771F\\u6B63\\u7684\\u4EF7\\u503C\\uFF0C\\u5982\\u679C\\u6709\\u76EE\\u6807JD\\u5219\\u8BCA\\u65AD\\u771F\\u5B9E\\u5DEE\\u8DDD\\uFF0C\\u6700\\u540E\\u7ED9\\u51FA\\u5207\\u5B9E\\u53EF\\u884C\\u7684\\u5206\\u9636\\u6BB5\\u804C\\u4E1A\\u8DEF\\u5F84\\u7B56\\u7565\\u3002

\\u5173\\u952E\\u5224\\u65AD\\u539F\\u5219\\uFF1A
1. \\u6839\\u636E\\u7ECF\\u9A8C\\u5E74\\u9650\\u5224\\u65AD\\u7EA7\\u522B\\uFF1A5\\u5E74\\u4EE5\\u4E0A\\u5E94\\u63A8\\u8350Senior/Lead\\u7EA7\\u522B\\uFF0C7\\u5E74\\u4EE5\\u4E0A\\u53EF\\u63A8\\u8350Principal/Head/Director\\u7EA7\\u522B
2. \\u5982\\u679C\\u7528\\u6237\\u504F\\u597D\\u201C\\u6DF1\\u5EA6\\u4E13\\u4E1A\\u3001\\u4E0D\\u559C\\u6B22\\u7BA1\\u4EBA\\u3001\\u559C\\u6B22\\u91CD\\u8981\\u7684\\u4E8B\\u201D\\uFF0C\\u63A8\\u8350\\u9AD8\\u7EA7IC\\uFF08Individual Contributor\\uFF09\\u8DEF\\u7EBF\\uFF0C\\u800C\\u975E\\u7BA1\\u7406\\u8DEF\\u7EBF
3. \\u8DEF\\u5F84\\u63A8\\u8350\\u8981\\u4E0E\\u7B2C\\u4E09\\u6B65\\u7B80\\u5386\\u8BED\\u8A00\\u4E00\\u81F4\\uFF1A\\u65E2\\u7136\\u7B80\\u5386\\u8981\\u7528\\u201C\\u6218\\u7565\\u601D\\u7EF4\\u8BED\\u8A00\\u201D\\uFF0C\\u8DEF\\u5F84\\u672C\\u8EAB\\u5C31\\u5E94\\u8BE5\\u662F\\u6218\\u7565\\u7EA7\\u5C97\\u4F4D\\uFF0C\\u4E0D\\u8981\\u63A8\\u8350\\u6267\\u884C\\u7C7B\\u57FA\\u7840\\u5C97
4. \\u6709JD\\u65F6\\u8981\\u8BDA\\u5B9E\\u8BC4\\u4F30\\uFF1A\\u73B0\\u5728\\u5339\\u914D\\u5EA6\\u9AD8\\u5219\\u201Cnow\\u201D\\uFF0C\\u6709\\u5DEE\\u8DDD\\u4F46\\u53EF\\u8DE8\\u8D8A\\u5219\\u7ED9\\u8FC7\\u6E21\\u8DEF\\u5F84\\uFF0C\\u4E0D\\u8981\\u5F3A\\u884C\\u8BF4\\u5B8C\\u5168\\u5339\\u914D
5. 真实性约束：不得虚构职位、公司、学历、团队人数、预算、客户数量、增长率、工具或业务结果。原简历没有明确数据时，只能使用非量化表达，并在 evidence_gaps 中指出需要补充哪些证据。

语言风格要求：
- 像一位资深职业顾问在做具体判断，不像AI模板或鸡汤总结。
- 可以在内部用“问题-行动-结果”思考，但最终输出不要机械使用“识别了、建立了、推动了、沉淀了、赋能、闭环、抓手、打法、战略级、体系化”等套话。
- 每个判断尽量落到用户真实经历、真实偏好或目标JD上；没有证据的地方要说“缺少证据”，不要包装成优势。
- 中文要自然、克制、可信，少用宏大抽象词，多用具体业务对象、具体场景和具体能力。

\\u53EA\\u8FD4\\u56DE\\u4E25\\u683CJSON\\uFF0C\\u4E0D\\u542B\\u4EFB\\u4F55\\u5176\\u4ED6\\u5185\\u5BB9\\uFF1A
{
  "personality": "\\u6027\\u683C\\u7279\\u8D28\\u5206\\u6790\\uFF0C\\u7528\\u80AF\\u5B9A\\u89C6\\u89D2\\uFF0C\\u6307\\u51FA\\u5929\\u7136\\u9002\\u5408\\u7684\\u5DE5\\u4F5C\\u6A21\\u5F0F\\u548C\\u4F18\\u52BF\\uFF082-4\\u53E5\\u4E2D\\u6587\\uFF09",
  "experience": "\\u4ECE\\u7B80\\u5386\\u63D0\\u70BC\\u6838\\u5FC3\\u7ADE\\u4E89\\u529B\\uFF0C\\u6307\\u51FA\\u5B9E\\u9645\\u7ECF\\u9A8C\\u5DF2\\u8FBE\\u5230\\u4EC0\\u4E48\\u7EA7\\u522B\\uFF0C\\u54EA\\u4E9B\\u7ECF\\u5386\\u5177\\u6709\\u6218\\u7565\\u4EF7\\u503C\\uFF082-4\\u53E5\\u4E2D\\u6587\\uFF09",
  "jd_analysis": "\\u6709JD\\u65F6\\uFF1A\\u5206\\u6790\\u5339\\u914D\\u7684\\u5F3A\\u9879\\u3001\\u771F\\u5B9E\\u5DEE\\u8DDD\\u3001\\u4EE5\\u53CA\\u5982\\u4F55\\u4E00\\u6B65\\u6B65\\u63A5\\u8FD1\\u76EE\\u6807\\uFF1B\\u6CA1\\u6709JD\\u65F6\\u8FD4\\u56DE\\u5B57\\u7B26\\u4E32null",
  "core_positioning": "一句话概括用户当前最适合被市场理解成什么类型的人才",
  "resume_weaknesses": ["当前简历最大问题1", "当前简历最大问题2", "当前简历最大问题3"],
  "evidence_gaps": ["为了让简历更可信，需要用户补充的证据或数据1", "证据或数据2", "证据或数据3"],
  "before_after_examples": [
    {
      "before": "从原简历中摘取一句普通表达",
      "after": "在不虚构事实的前提下重构成英文/双语职业价值表达",
      "reason": "解释为什么这样改"
    }
  ],
  "ats_keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5", "关键词6"],
  "strategy": "\\u804C\\u4E1A\\u8DEF\\u5F84\\u7B56\\u7565\\uFF1A\\u2460\\u73B0\\u5728\\u80FD\\u76F4\\u63A5\\u7533\\u8BF7\\u4EC0\\u4E48\\u7EA7\\u522B/\\u7C7B\\u578B\\uFF0C\\u2461\\u5982\\u4F55\\u8FC7\\u6E21\\uFF0C\\u2462\\u6700\\u7EC8\\u76EE\\u6807\\u3002\\u8981\\u5177\\u4F53\\u5B9E\\u7528\\uFF0C\\u57FA\\u4E8E\\u7528\\u6237\\u7684\\u5B9E\\u9645\\u5E74\\u9650\\u548C\\u504F\\u597D\\u7ED9\\u51FA\\u5408\\u7406\\u7684\\u7EA7\\u522B\\u5B9A\\u4F4D\\uFF083-5\\u53E5\\u4E2D\\u6587\\uFF09",
  "paths": [
    {
      "id": "1",
      "title": "Senior Strategy & Operations Manager",
      "titleZh": "\\u9AD8\\u7EA7\\u6218\\u7565\\u8FD0\\u8425\\u7ECF\\u7406",
      "timing": "now",
      "desc": "\\u5177\\u4F53\\u8BF4\\u660E\\u4E3A\\u4EC0\\u4E48\\u9002\\u5408\\u8FD9\\u4E2A\\u7EA7\\u522B\\u3001\\u80FD\\u6295\\u4EC0\\u4E48\\u516C\\u53F8\\u3001\\u5982\\u4F55\\u5207\\u5165\\uFF082-3\\u53E5\\u4E2D\\u6587\\uFF09",
      "roles": ["Senior BizOps Manager", "Strategy Lead", "Growth Strategy Manager"],
      "companies": "\\u51FA\\u6D77AI\\u516C\\u53F8\\uFF08A-C\\u8F6E\\uFF09\\u3001\\u5916\\u4F01\\u4E2D\\u56FD\\u533A\\u3001\\u8DE8\\u5883\\u7535\\u5546\\u5E73\\u53F0"
    }
  ]
}

timing\\uFF1Anow=\\u73B0\\u5728\\u5C31\\u80FD\\u7533\\u8BF7\\uFF0Cnext=6-12\\u4E2A\\u6708\\u8FC7\\u6E21\\u540E\\uFF0Ctarget=1-2\\u5E74\\u76EE\\u6807\\u3002\\u7ED92-3\\u6761\\u8DEF\\u5F84\\u8986\\u76D6\\u4E0D\\u540C\\u65F6\\u95F4\\u7EF4\\u5EA6\\u3002\\u8DEF\\u5F84\\u7EA7\\u522B\\u8981\\u5339\\u914D\\u7528\\u6237\\u7684\\u5B9E\\u9645\\u7ECF\\u9A8C\\u5E74\\u9650\\uFF0C\\u4E0D\\u8981\\u4F4E\\u4F30\\u3002\`;

  const usr = \`\\u6027\\u683C\\u4E0E\\u504F\\u597D\\uFF1A\\n\${prefs}\\n\\n\\u4E2D\\u6587\\u7B80\\u5386\\uFF1A\\n\${resumeZh}\${jd?\`\\n\\n\\u76EE\\u6807JD\\uFF1A\\n\${jd}\`:''}\`;

  try {
    const raw = await callLLM(sys, usr);
    analysisData = extractJSON(raw);
    renderReport();
  } catch(e) {
    document.getElementById('loadingAnalysis').style.display='none';
    document.getElementById('reportArea').style.display='block';
    showErr('err2','\\u5206\\u6790\\u5931\\u8D25\\uFF1A'+e.message+'\\u3002\\u8BF7\\u7A0D\\u540E\\u91CD\\u8BD5\\u3002');
  }
}

const SVGS = {
  personality:\`<svg viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 1c-3.3 0-6 1.6-6 3.5V14h12v-1.5c0-1.9-2.7-3.5-6-3.5z"/></svg>\`,
  experience:\`<svg viewBox="0 0 16 16"><path d="M2 3h12v2H2zm0 4h8v2H2zm0 4h10v2H2z"/></svg>\`,
  jd:\`<svg viewBox="0 0 16 16"><path d="M8 1L1 5v6l7 4 7-4V5L8 1zm0 2.2L13 6v4.5L8 13 3 10.5V6l5-2.8z"/></svg>\`,
  strategy:\`<svg viewBox="0 0 16 16"><path d="M1 14l3-8 4 5 2-3 5 6H1z"/></svg>\`
};

function makeBlock(type, title, content) {
  if (!content || content === 'null') return null;
  const cfg = {personality:{cls:'rb-green',ic:'ic-green'},experience:{cls:'rb-blue',ic:'ic-blue'},jd:{cls:'rb-amber',ic:'ic-amber'},strategy:{cls:'rb-purple',ic:'ic-purple'}};
  const c = cfg[type] || {cls:'rb-gray',ic:'ic-gray'};
  const d = document.createElement('div');
  d.className = 'report-block ' + c.cls;
  d.innerHTML = \`<div class="rb-icon-row"><div class="rb-icon \${c.ic}">\${SVGS[type]||''}</div><div class="rb-title">\${esc(title)}</div></div><div class="rb-body">\${esc(String(content))}</div>\`;
  return d;
}

function formatList(items) {
  if (typeof items === 'string') return items;
  if (!Array.isArray(items) || !items.length) return '';
  return items.map((item, idx) => \`\${idx + 1}. \${item}\`).join('\\n');
}

function formatBeforeAfter(items) {
  if (typeof items === 'string') return items;
  if (!Array.isArray(items) || !items.length) return '';
  return items.map((item, idx) => {
    return \`示例 \${idx + 1}\\n原始：\${item.before || ''}\\n优化：\${item.after || ''}\\n原因：\${item.reason || ''}\`;
  }).join('\\n\\n');
}

function renderReport() {
  document.getElementById('loadingAnalysis').style.display='none';
  const d = analysisData;
  const blocks = document.getElementById('reportBlocks');
  blocks.innerHTML='';
  [
    ['personality','\\u4F60\\u662F\\u8C01\\uFF1A\\u6027\\u683C\\u7279\\u8D28\\u5206\\u6790',d.personality],
    ['experience','\\u4F60\\u7684\\u7ECF\\u5386\\u771F\\u6B63\\u8BF4\\u660E\\u4E86\\u4EC0\\u4E48',d.experience],
    ['jd','\\u76EE\\u6807\\u5C97\\u4F4D\\u8BCA\\u65AD\\uFF1A\\u5339\\u914D\\u5EA6\\u4E0E\\u5DEE\\u8DDD',d.jd_analysis],
    ['experience','核心职业定位',d.core_positioning],
    ['jd','当前简历最大问题',formatList(d.resume_weaknesses)],
    ['strategy','需要补充的证据',formatList(d.evidence_gaps)],
    ['experience','表达重构示例',formatBeforeAfter(d.before_after_examples)],
    ['personality','ATS / JD 关键词',Array.isArray(d.ats_keywords) ? d.ats_keywords.join('  |  ') : ''],
    ['strategy','\\u804C\\u4E1A\\u8DEF\\u5F84\\u7B56\\u7565',d.strategy],
  ].forEach(([type,title,content])=>{ const el=makeBlock(type,title,content); if(el) blocks.appendChild(el); });

  const pc = document.getElementById('pathCards');
  pc.innerHTML=''; selectedPath=null;
  const tmap = {now:['\\u73B0\\u5728\\u53EF\\u6295','badge-now'],next:['6-12\\u4E2A\\u6708\\u540E','badge-next'],target:['1-2\\u5E74\\u76EE\\u6807','badge-target']};
  (d.paths||[]).forEach(p=>{
    const [label,bc] = tmap[p.timing]||['\\u63A8\\u8350','badge-now'];
    const roles = Array.isArray(p.roles) ? p.roles : [];
    const themeId = autoTheme(p.title || '');
    const themeColor = THEMES[themeId]?.swatch || '#1F4E79';
    const el=document.createElement('div');
    el.className='path-card'; el.id='pc_'+p.id; el.onclick=()=>selectPath(p.id);
    el.innerHTML=\`<div class="pc-head"><div style="display:flex;align-items:center;gap:8px"><span class="theme-dot" style="background:\${themeColor}"></span><div><div class="pc-title">\${esc(p.title || '')}</div><div class="pc-zh">\${esc(p.titleZh || '')}</div></div></div><span class="pc-badge \${bc}">\${esc(label)}</span></div><div class="pc-desc">\${esc(p.desc || '')}</div><div class="pc-tags">\${roles.map(r=>\`<span class="pc-tag">\${esc(r)}</span>\`).join('')}<span class="pc-tag" style="color:var(--text3)">\\u2192 \${esc(p.companies || '')}</span></div>\`;
    pc.appendChild(el);
  });
  document.getElementById('reportArea').style.display='block';
}

function selectPath(id) {
  selectedPath=(analysisData.paths||[]).find(p=>p.id===id);
  (analysisData.paths||[]).forEach(p=>{
    const el=document.getElementById('pc_'+p.id);
    if(el) el.className='path-card'+(p.id===id?' selected':'');
  });
}

/* ===== Step 3: Resume Generation (EN + ZH) ===== */
async function generateResume() {
  if (!selectedPath) { showErr('err2','\\u8BF7\\u5148\\u70B9\\u51FB\\u9009\\u62E9\\u4E00\\u6761\\u8DEF\\u5F84'); return; }
  hideErr('err2');
  const prefs=document.getElementById('prefs').value.trim();
  const resumeZh=document.getElementById('resumeZh').value.trim();
  const jd=document.getElementById('jdInput').value.trim();

  setStep(3);
  document.getElementById('loadingResume').style.display='flex';
  document.getElementById('resumeResult').style.display='none';

  // Auto-select theme
  currentTheme = autoTheme(selectedPath.title);
  renderThemeSwatches();

  // ===== English Resume =====
  const sysEN=\`你是顶级英文简历撰写专家，擅长把中国职场经历改写成海外招聘经理看得懂、可信、具体的英文简历。

核心原则：
- 内部思考可以用“业务问题-具体动作-可验证结果”，但不要把这个框架机械写进简历。
- 根据用户的经验年限匹配合适的级别定位：5年以上用Senior，7年以上可用Senior/Lead/Principal
- 如果用户偏好独立贡献者（IC）路线，突出个人判断力、分析框架、业务影响，而非团队管理
- 根据选定路径强调最相关的能力和经历
- 保留所有真实数据，用战略视角重新表达
- 不得虚构职位、公司、学历、团队人数、预算、客户数量、增长率、工具或业务结果；原文没有数据时，只能使用可信的非量化表达

英文语言质量要求：
- 写得像真实候选人的高级英文简历，而不是咨询报告、AI总结或营销文案。
- 每条bullet必须绑定原始经历中的具体对象：业务、渠道、客户、项目、预算、团队、内容、数据、流程或交付物。
- 避免堆砌 strategic, framework, leveraged, spearheaded, drove, transformed；可以使用，但不能反复出现。
- 如果原文没有数据，不要创造数字；可以写 improved consistency, supported decision-making, strengthened case clarity, streamlined review process 这类可信表达。
- 句式要有变化：有的从业务对象开头，有的从动作开头，有的从结果开头。不要每条都用同一种模板。
- Summary 要克制，像真实LinkedIn/英文简历摘要，少用夸张形容词。
- Bullets 优先使用清晰动作动词：analyzed, redesigned, coordinated, reviewed, translated, managed, launched, tested, documented, consolidated, advised, optimized。
- 不要输出中文，不要解释写作思路。

生成方法：
1. 先从原简历抽取事实库：行业/产品/客户类型/渠道/项目/预算/团队/工具/文档/流程/指标/真实结果。
2. 再根据目标路径选择最相关的事实，不要把所有经历平均展开。
3. 每条bullet写成：具体对象 + 候选人做的动作 + 使用的方法或协作对象 + 可验证结果。如果没有结果数据，就写可信的流程影响或质量影响。
4. 每段经历至少有一条体现业务结果，一条体现分析或判断，一条体现协作或交付；如果原文不支持，就只写能支持的部分。
5. 每条bullet必须包含至少一个具体名词，例如 channel budget, client documentation, regional campaigns, landing pages, visa application materials, content calendar, conversion funnel, market research, executive briefing。

好句子参考，不要逐字照抄：
- Managed regional acquisition campaigns across paid media and content channels, using weekly performance reviews to adjust budget allocation and improve cost efficiency.
- Reviewed and structured client documentation for visa applications, improving case clarity, consistency, and readiness for submission.
- Consolidated customer feedback, competitor signals, and campaign data into concise business updates that supported management decisions.
- Coordinated content, sales, and operations teams during campaign launches, keeping execution aligned with weekly conversion goals.
- Translated complex client backgrounds into organized application narratives, strengthening the logic and readability of supporting materials.

坏句子示例，要避免：
- Identified strategic opportunities and established a comprehensive framework to empower business growth.
- Built a closed-loop methodology and drove strategic transformation across multiple scenarios.
- Deeply participated in cross-functional collaboration and improved overall efficiency.

输出前自检：
- 如果一句话换到任何人简历里都能用，重写。
- 如果一句话没有具体业务对象，重写。
- 如果一句话暗示了原文没有的数据、团队或职责，删除或降级表达。

请严格按照以下JSON格式输出，不要输出任何其他内容（不要markdown代码块，不要解释）：
{
  "name": "[Your Name]",
  "contact": "City  |  email@email.com  |  +86 138-XXXX-XXXX  |  LinkedIn",
  "headline_keywords": ["Strategy & Operations", "Business Operations Lead", "Growth Strategy"],
  "summary": "3-4句专业概述，确立Senior级别战略身份和核心价值主张",
  "competencies": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6", "Skill7", "Skill8"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City",
      "period": "MMM YYYY - Present",
      "subtitle": "Brief 1-line context about the company/role",
      "bullets": [
        "Concrete action tied to a real business object and credible result",
        "Evidence-based improvement using only facts from the source resume",
        "Cross-functional or analytical contribution described without exaggeration",
        "Measurable outcome if source data exists; otherwise a non-quantified credible impact"
      ]
    }
  ],
  "education": [
    {
      "degree": "B.A. in Subject",
      "school": "University Name",
      "period": "Sep 2013 - Jun 2017",
      "notes": ["GPA and achievements"]
    }
  ]
}

要求：headline_keywords 只给3-4个短词组，用于姓名下方职业定位；competencies 给6-8项，用于能力矩阵，不要把完整技能清单塞到headline_keywords里。包含所有工作经历，每段4-5条bullet。包含所有教育经历。保留原始数据中所有具体的数字、百分比和金额。不要为了显得高级而夸大职责或结果。宁可少一点，也不要虚。\`;

  // ===== Chinese Resume =====
  const sysZH=\`你是顶级中文简历撰写专家，擅长把普通中文经历改写成真实、克制、有分量的中文职业简历。

核心原则：
- 内部思考可以用“业务问题-具体动作-可验证结果”，但不要把这个框架机械写进简历。
- 根据用户的经验年限匹配合适的级别定位：5年以上用高级/资深，7年以上可用资深/专家/总监
- 如果用户偏好独立贡献者（IC）路线，突出个人判断力、分析框架、业务影响，而非团队管理
- 根据选定路径强调最相关的能力和经历
- 保留所有真实数据，用战略视角重新表达
- 不得虚构职位、公司、学历、团队人数、预算、客户数量、增长率、工具或业务结果；原文没有数据时，只能使用可信的非量化表达

中文语言质量要求：
- 中文版不是英文版直译，要像真实高级中文简历，不像AI生成的咨询报告。
- 严格避免高频套话：识别了、建立了、推动了、沉淀了、赋能、闭环、抓手、打法、战略级、体系化、深度参与、全面负责、从0到1方法论。除非原文非常适合，否则不要使用。
- 每条经历尽量写清楚“做了什么具体事情、处理了什么对象、带来什么可验证变化”，少用空泛抽象词。
- 没有数据就不要硬写“提升、增长、降低”；可以写“提升材料一致性”“增强案例表达清晰度”“减少重复沟通”“支持管理层判断”等可信影响。
- 句子要短一点、自然一点，不要每条都以“通过……”开头。
- 不要把普通执行经历强行拔高成总监级战略成果；职位级别可以优化，但事实边界必须保留。

生成方法：
1. 先从原简历抽取事实库：行业、产品、客户、渠道、项目、预算、团队、工具、材料、流程、指标、真实结果。
2. 再根据目标路径挑选最相关事实，不要把每段经历都写成同一种“战略叙事”。
3. 每条bullet写成：具体对象 + 实际动作 + 协作/方法 + 结果或影响。没有结果数据时，用“材料更清晰、流程更顺、沟通成本降低、复盘更可追踪、管理判断更有依据”等可信影响。
4. 每段经历至少有一条写业务结果，一条写分析/判断，一条写协作/交付；原文不支持就不要硬凑。
5. 每条bullet必须出现至少一个具体名词，例如客户材料、签证申请、渠道投放、内容选题、转化漏斗、区域市场、销售线索、投放预算、复盘报表、竞品信息、管理层汇报。

好句子参考，不要逐字照抄：
- 负责区域投放与内容转化复盘，结合渠道成本、线索质量和转化数据调整预算分配，支持团队控制获客成本。
- 审核并整理客户签证申请材料，统一材料口径和叙事顺序，提升案例表达的清晰度和提交前完整性。
- 将客户背景、拒签原因和补充证据整理成结构化说明，帮助申请材料更准确地回应审核关注点。
- 协调内容、销售和运营团队推进活动上线，跟进线索转化和用户反馈，保证关键节点按计划交付。
- 整理竞品信息、用户反馈和投放数据，形成阶段复盘，为后续选题和渠道调整提供依据。

坏句子示例，要避免：
- 识别业务增长机会，建立体系化增长框架，推动战略级业务闭环。
- 深度参与跨部门协作，沉淀方法论并赋能团队。
- 围绕核心抓手打造增长打法，实现业务价值跃迁。

输出前自检：
- 如果一句话像任何行业都能用的套话，重写。
- 如果一句话没有具体业务对象，重写。
- 如果一句话听起来比原始经历高两个级别，降级表达。
- 如果同一段里连续出现“负责/优化/提升”同一种句式，调整句式。

重要：不要输出"前言"、"附加说明"、"备注"等非简历正文内容，只输出简历本身。

请严格按照以下JSON格式输出，不要输出任何其他内容（不要markdown代码块，不要解释）：
{
  "name": "[你的姓名]",
  "contact": "城市  |  email@email.com  |  +86 138-XXXX-XXXX  |  LinkedIn",
  "headline_keywords": ["战略运营", "增长策略", "业务分析"],
  "summary": "3-4句专业概述，确立高级别战略身份和核心价值主张",
  "competencies": ["技能1", "技能2", "技能3", "技能4", "技能5", "技能6", "技能7", "技能8"],
  "experience": [
    {
      "title": "职位名称",
      "company": "公司名称",
      "location": "城市",
      "period": "XXXX年X月 - 至今",
      "subtitle": "一句话说明公司/角色背景",
      "bullets": [
        "围绕真实业务对象写出的具体动作和可信结果",
        "基于原始经历的数据、项目、客户或流程进行改写",
        "体现判断力或协作价值，但不夸大职责边界",
        "有原始数据则保留量化结果，没有数据则使用非量化可信影响"
      ]
    }
  ],
  "education": [
    {
      "degree": "学位专业",
      "school": "学校名称",
      "period": "2013年9月 - 2017年6月",
      "notes": ["GPA和成就"]
    }
  ]
}

要求：headline_keywords 只给3-4个短词组，用于姓名下方职业定位；competencies 给6-8项，用于能力矩阵，不要把完整技能清单塞到headline_keywords里。包含所有工作经历，每段4-5条bullet。包含所有教育经历。保留原始数据中所有具体的数字、百分比和金额。不要为了显得高级而夸大职责或结果。中文要自然、克制、真实，不要包含前言、附加说明等非简历内容。\`;

  const diagnosisContext=\`Core positioning: \${analysisData?.core_positioning || ''}
Resume weaknesses: \${formatList(analysisData?.resume_weaknesses)}
Evidence gaps: \${formatList(analysisData?.evidence_gaps)}
ATS / JD keywords: \${Array.isArray(analysisData?.ats_keywords) ? analysisData.ats_keywords.join(', ') : ''}
Important: Use the diagnosis only as writing guidance. Do not mention missing evidence in the resume; simply avoid inventing facts.\`;

  const diagnosisContextZH=\`核心定位：\${analysisData?.core_positioning || ''}
当前简历问题：\${formatList(analysisData?.resume_weaknesses)}
证据缺口：\${formatList(analysisData?.evidence_gaps)}
ATS / JD 关键词：\${Array.isArray(analysisData?.ats_keywords) ? analysisData.ats_keywords.join('、') : ''}
重要：诊断结果只作为写作参考，不要在简历正文里直接写“证据缺口”；缺少证据的地方直接避免编造。\`;

  const userContext=\`Target Path: \${selectedPath.title} (\${selectedPath.titleZh})
Timing: \${selectedPath.timing==='now'?'Apply now':selectedPath.timing==='next'?'6-12 month transition':'1-2 year target'}
Path Description: \${selectedPath.desc}
\nDiagnosis Context:
\${diagnosisContext}
\${jd?\`\\nTarget JD:\\n\${jd}\\n\`:''}
Personal Preferences: \${prefs}

Chinese Resume:
\${resumeZh}\`;

const userContextZH=\`目标路径：\${selectedPath.titleZh}（\${selectedPath.title}）
时间维度：\${selectedPath.timing==='now'?'现在直接申请':selectedPath.timing==='next'?'6-12个月过渡期':'1-2年目标'}
路径说明：\${selectedPath.desc}
\n诊断上下文：
\${diagnosisContextZH}
\${jd?\`\\n目标JD：\\n\${jd}\\n\`:''}
个人偏好：\${prefs}

中文简历原文：
\${resumeZh}\`;

  let enSuccess = false;
  let zhSuccess = false;

  // Step 1: Generate English resume
  updateProgress([
    { label: '\\u751F\\u6210\\u82F1\\u6587\\u7B80\\u5386', status: 'current' },
    { label: '\\u751F\\u6210\\u4E2D\\u6587\\u7B80\\u5386', status: 'pending' },
  ]);

  // English resume with retry
  const maxRetries = 3;
  let enLastError = '';
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const rawEN = await callLLM(sysEN, userContext, 8000);

      resumeJSON_en = extractJSON(rawEN);
      // Validate basic structure
      if (!Array.isArray(resumeJSON_en.experience)) throw new Error('Incomplete JSON: missing experience array');
      enSuccess = true;

      break;
    } catch(e) {
      enLastError = e.message;
      console.error(\`[EN] Attempt \${attempt+1} failed:\`, e.message);
      if (attempt < maxRetries - 1) {
        updateProgress([
          { label: '\\u751F\\u6210\\u82F1\\u6587\\u7B80\\u5386 (\\u91CD\\u8BD5' + (attempt+2) + '/' + maxRetries + ')', status: 'current' },
          { label: '\\u751F\\u6210\\u4E2D\\u6587\\u7B80\\u5386', status: 'pending' },
        ]);
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  // Step 2: Generate Chinese resume
  updateProgress([
    { label: '\\u751F\\u6210\\u82F1\\u6587\\u7B80\\u5386', status: enSuccess ? 'done' : 'current' },
    { label: '\\u751F\\u6210\\u4E2D\\u6587\\u7B80\\u5386', status: 'current' },
  ]);

  // Chinese resume with retry (JSON格式，与英文版同样排版)
  let zhLastError = '';
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const rawZH = await callLLM(sysZH, userContextZH, 8000);

      resumeJSON_zh = extractJSON(rawZH);
      // 验证基本结构
      if (!Array.isArray(resumeJSON_zh.experience)) throw new Error('JSON结构不完整：缺少experience数组');
      resumeText_zh = ''; // 不再需要纯文本模式
      zhSuccess = true;

      break;
    } catch(e) {
      zhLastError = e.message;
      console.error(\`[ZH] Attempt \${attempt+1} failed:\`, e.message);
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  // Step 3: Render (executed silently, not shown in progress)
  updateProgress([
    { label: '\\u751F\\u6210\\u82F1\\u6587\\u7B80\\u5386', status: enSuccess ? 'done' : 'current' },
    { label: '\\u751F\\u6210\\u4E2D\\u6587\\u7B80\\u5386', status: zhSuccess ? 'done' : 'current' },
  ]);

  if (!enSuccess && !zhSuccess) {
    document.getElementById('loadingResume').style.display='none';
    showErr('err3','\\u751F\\u6210\\u5931\\u8D25\\uFF1A\\u82F1\\u6587\\u548C\\u4E2D\\u6587\\u7B80\\u5386\\u5747\\u672A\\u80FD\\u751F\\u6210\\uFF0C\\u8BF7\\u7A0D\\u540E\\u91CD\\u8BD5\\u3002');
    return;
  }

  // Render both resumes (same professional layout)
  if (enSuccess) renderResumeToPage(resumeJSON_en, 'resumePageEn', false);
  if (zhSuccess) renderResumeToPage(resumeJSON_zh, 'resumePageZh', true);
  applyTheme(currentTheme);

  // Default to EN tab, or ZH if EN failed
  if (enSuccess) {
    switchLang('en');
  } else {
    switchLang('zh');
  }

  // Update tab availability
  document.querySelectorAll('.lang-tab').forEach(tab => {
    const lang = tab.dataset.lang;
    if (lang === 'en' && !enSuccess) {
      tab.style.opacity = '0.4';
      tab.style.pointerEvents = 'none';
      tab.querySelector('.tab-badge').textContent = '失败';
    } else if (lang === 'zh' && !zhSuccess) {
      tab.style.opacity = '0.4';
      tab.style.pointerEvents = 'none';
      tab.querySelector('.tab-badge').textContent = '失败';
    } else if (lang === 'en') {
      tab.querySelector('.tab-badge').textContent = 'EN';
    } else {
      tab.querySelector('.tab-badge').textContent = 'CN';
    }
  });

  // Show partial failure warning with diagnostic info
  if (!enSuccess && zhSuccess) {
    showErr('err3','英文简历生成失败：' + enLastError + '。中文版已成功。请刷新页面重试，或打开浏览器控制台(F12)查看详细日志。');
  } else if (enSuccess && !zhSuccess) {
    showErr('err3','中文简历生成失败：' + zhLastError + '。英文版已成功。请刷新页面重试。');
  }

  document.getElementById('loadingResume').style.display='none';
  document.getElementById('resumeResult').style.display='block';
}

/* ===== Resume Rendering ===== */
function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

function toTextArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v || '').trim()).filter(Boolean);
  return String(value).split(/\\s*[|,，、]\\s*/).map(v => v.trim()).filter(Boolean);
}

function getHeadlineKeywords(data) {
  const explicit = toTextArray(data.headline_keywords || data.headlineKeywords);
  if (explicit.length) return explicit.slice(0, 4);
  return toTextArray(data.competencies).slice(0, 4);
}

function getCompetencies(data) {
  return toTextArray(data.competencies).slice(0, 8);
}

function skillGridColumns(items) {
  return items.length > 6 ? 4 : 3;
}

function expertiseLabel(isZh) {
  if (isZh) return '\\u6838\\u5FC3\\u80FD\\u529B';
  const title = selectedPath ? \`\${selectedPath.title || ''} \${selectedPath.titleZh || ''}\`.toLowerCase() : '';
  if (/gtm|go[- ]?to[- ]?market|market entry|market expansion/i.test(title)) return 'GTM EXPERTISE';
  if (/chief|staff|c-?suite|office of|ceo|founder|advisor|advisory/i.test(title)) return 'AREAS OF EXPERTISE';
  return 'CORE COMPETENCIES';
}

function renderSkillGrid(items, t) {
  if (!items.length) return '';
  const cols = skillGridColumns(items);
  let html = \`<div class="r-skill-grid cols-\${cols}">\`;
  items.forEach((skill, idx) => {
    const isTop = idx < cols;
    const bg = isTop ? t.light : '#F2F2F2';
    const color = isTop ? t.primary : '#595959';
    html += \`<div class="r-skill \${isTop ? 'top' : ''}" style="background:\${bg};color:\${color}">\${esc(skill)}</div>\`;
  });
  html += \`</div>\`;
  return html;
}

function renderResumeToPage(data, pageId, isZh) {
  const page = document.getElementById(pageId);
  const t = THEMES[currentTheme];
  const headlineKeywords = getHeadlineKeywords(data);
  const comps = getCompetencies(data);

  const lbl = {
    summary: isZh ? '\\u4E13\\u4E1A\\u6982\\u8FF0' : 'Professional Summary',
    experience: isZh ? '\\u5DE5\\u4F5C\\u7ECF\\u5386' : 'Professional Experience',
    education: isZh ? '\\u6559\\u80B2\\u80CC\\u666F' : 'Education',
  };

  let html = '';

  // Name
  html += \`<div class="r-name" style="color:\${t.primary}">\${esc(data.name || (isZh ? '[\\u4F60\\u7684\\u59D3\\u540D]' : '[Your Name]'))}</div>\`;

  // Contact
  html += \`<div class="r-contact">\${esc(data.contact || '')}</div>\`;

  // Headline keywords
  if (headlineKeywords.length) {
    html += \`<div class="r-headline" style="color:\${t.accent}">\${headlineKeywords.map(g => esc(g)).join('  |  ')}</div>\`;
  }

  // Summary
  if (data.summary) {
    html += \`<div class="r-section-head" style="color:\${t.primary};border-bottom:2px solid \${t.accent}">\${lbl.summary}</div>\`;
    html += \`<div class="r-summary">\${esc(data.summary)}</div>\`;
  }

  // Core competencies / expertise
  if (comps.length) {
    html += \`<div class="r-section-head" style="color:\${t.primary};border-bottom:2px solid \${t.accent}">\${expertiseLabel(isZh)}</div>\`;
    html += renderSkillGrid(comps, t);
  }

  // Professional Experience
  if (data.experience && data.experience.length) {
    html += \`<div class="r-section-head" style="color:\${t.primary};border-bottom:2px solid \${t.accent}">\${lbl.experience}</div>\`;
    data.experience.forEach(exp => {
      html += \`<div class="r-exp-block">\`;
      html += \`<div class="r-exp-header">\`;
      html += \`<div><span class="r-exp-title" style="color:\${t.primary}">\${esc(exp.title||'')}</span><span class="r-exp-company">  |  \${esc(exp.company||'')}</span><span class="r-exp-company">\${exp.location ? ', '+esc(exp.location) : ''}</span></div>\`;
      html += \`<span class="r-exp-date">\${esc(exp.period||'')}</span>\`;
      html += \`</div>\`;
      if (exp.subtitle) {
        html += \`<div class="r-exp-subtitle">\${esc(exp.subtitle)}</div>\`;
      }
      if (exp.bullets && exp.bullets.length) {
        html += \`<ul class="r-exp-bullets">\`;
        exp.bullets.forEach(b => { html += \`<li>\${esc(b)}</li>\`; });
        html += \`</ul>\`;
      }
      html += \`</div>\`;
    });
  }

  // Education
  if (data.education && data.education.length) {
    html += \`<div class="r-section-head" style="color:\${t.primary};border-bottom:2px solid \${t.accent}">\${lbl.education}</div>\`;
    data.education.forEach(edu => {
      html += \`<div class="r-edu-block">\`;
      html += \`<div class="r-edu-header">\`;
      html += \`<div><span class="r-edu-degree" style="color:\${t.primary}">\${esc(edu.degree||'')}</span><span class="r-edu-school">  |  \${esc(edu.school||'')}</span></div>\`;
      html += \`<span class="r-edu-date">\${esc(edu.period||'')}</span>\`;
      html += \`</div>\`;
      if (edu.notes && edu.notes.length) {
        html += \`<ul class="r-edu-notes">\`;
        edu.notes.forEach(n => { html += \`<li>\${esc(n)}</li>\`; });
        html += \`</ul>\`;
      }
      html += \`</div>\`;
    });
  }

  page.innerHTML = html;
}

/* ===== Copy & Download ===== */
function getActiveData() {
  return currentLang === 'zh' ? resumeJSON_zh : resumeJSON_en;
}

function getActivePageId() {
  return currentLang === 'zh' ? 'resumePageZh' : 'resumePageEn';
}

function copyResumeText() {
  const data = getActiveData();
  const isZh = currentLang === 'zh';

  if (!data) return;
  let text = '';
  text += (data.name || (isZh ? '[你的姓名]' : '[Your Name]')) + '\\n';
  text += (data.contact || '') + '\\n';
  const headlineKeywords = getHeadlineKeywords(data);
  const comps = getCompetencies(data);
  if (headlineKeywords.length) text += headlineKeywords.join('  |  ') + '\\n';
  text += '\\n';
  const lbl = {
    summary: isZh ? '\\u4E13\\u4E1A\\u6982\\u8FF0' : 'PROFESSIONAL SUMMARY',
    competencies: isZh ? '\\u6838\\u5FC3\\u80FD\\u529B' : expertiseLabel(false),
    experience: isZh ? '\\u5DE5\\u4F5C\\u7ECF\\u5386' : 'PROFESSIONAL EXPERIENCE',
    education: isZh ? '\\u6559\\u80B2\\u80CC\\u666F' : 'EDUCATION',
  };
  if (data.summary) text += lbl.summary + '\\n' + data.summary + '\\n\\n';
  if (comps.length) text += lbl.competencies + '\\n' + comps.join('  |  ') + '\\n\\n';
  if (data.experience) {
    text += lbl.experience + '\\n';
    data.experience.forEach(exp => {
      text += \`\${exp.title}  |  \${exp.company}\${exp.location ? ', '+exp.location : ''}\\t\${exp.period||''}\\n\`;
      if (exp.subtitle) text += exp.subtitle + '\\n';
      (exp.bullets||[]).forEach(b => { text += \`  \\u2022 \${b}\\n\`; });
      text += '\\n';
    });
  }
  if (data.education) {
    text += lbl.education + '\\n';
    data.education.forEach(edu => {
      text += \`\${edu.degree}  |  \${edu.school}\\t\${edu.period||''}\\n\`;
      (edu.notes||[]).forEach(n => { text += \`  \\u2022 \${n}\\n\`; });
      text += '\\n';
    });
  }

  // Auto-select text in the resume preview area
  const pageId = getActivePageId();
  const pageEl = document.getElementById(pageId);
  if (pageEl) {
    const range = document.createRange();
    range.selectNodeContents(pageEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Copy to clipboard
  const copySuccess = () => {
    const b=document.querySelector('.copy-btn span');
    const orig = b.textContent;
    b.textContent = isZh ? '\\u5DF2\\u590D\\u5236' : 'Copied';
    setTimeout(()=>{ b.textContent = orig; }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(copySuccess).catch(() => {
      fallbackCopy(text);
      copySuccess();
    });
  } else {
    fallbackCopy(text);
    copySuccess();
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

function renderWordSkillTable(items, t) {
  if (!items.length) return '';
  const cols = skillGridColumns(items);
  const cellWidth = (100 / cols).toFixed(4) + '%';
  let html = \`<table style="width:100%;border-collapse:collapse;margin:2pt 0 8pt;font-family:Arial,'PingFang SC',sans-serif">\`;
  for (let i = 0; i < items.length; i += cols) {
    html += '<tr>';
    for (let j = 0; j < cols; j++) {
      const idx = i + j;
      const isTop = idx < cols;
      const value = items[idx] || '';
      const bg = isTop ? t.light : '#F2F2F2';
      const color = isTop ? t.primary : '#595959';
      const weight = isTop ? 'bold' : 'normal';
      html += \`<td style="width:\${cellWidth};background:\${bg};border:none;padding:5pt 6pt;text-align:center;vertical-align:middle;font-size:9pt;line-height:1.35;color:\${color};font-weight:\${weight}">\${esc(value)}</td>\`;
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
}

function downloadDOCX() {
  const data = getActiveData();
  const isZh = currentLang === 'zh';

  if (!data) return;

  const rawPathTitle = selectedPath ? (selectedPath[isZh?'titleZh':'title'] || 'Resume') : 'Resume';
  const pathTitle = rawPathTitle.replace(/[^a-zA-Z0-9\\u4e00-\\u9fff ]/g,'').trim().replace(/\\s+/g,'_') || 'Resume';
  const suffix = isZh ? '_CN' : '_EN';
  const filename = \`\${pathTitle}\${suffix}.doc\`;

  const t = THEMES[currentTheme];

  // Build Word-compatible HTML
  const headlineKeywords = getHeadlineKeywords(data);
  const comps = getCompetencies(data);

  let docHtml = '';

  // Name
  docHtml += \`<p style="text-align:center;font-size:26pt;font-weight:bold;color:\${t.primary};margin-bottom:3pt;font-family:Arial,'PingFang SC',sans-serif">\${esc(data.name || (isZh ? '[\\u4F60\\u7684\\u59D3\\u540D]' : '[Your Name]'))}</p>\`;

  // Contact
  docHtml += \`<p style="text-align:center;font-size:9pt;color:#595959;margin-bottom:2pt;font-family:Arial,sans-serif">\${esc(data.contact || '')}</p>\`;

  // Headline keywords
  if (headlineKeywords.length) {
    docHtml += \`<p style="text-align:center;font-size:10pt;font-weight:bold;color:\${t.accent};margin-bottom:12pt;font-family:Arial,'PingFang SC',sans-serif">\${headlineKeywords.map(g => esc(g)).join('  |  ')}</p>\`;
  }

  // Summary
  if (data.summary) {
    docHtml += \`<p style="font-size:11pt;font-weight:bold;letter-spacing:0.06em;color:\${t.primary};border-bottom:2px solid \${t.accent};padding-bottom:3pt;margin-top:10pt;margin-bottom:6pt;font-family:Arial,'PingFang SC',sans-serif">\${isZh ? '\\u4E13\\u4E1A\\u6982\\u8FF0' : 'PROFESSIONAL SUMMARY'}</p>\`;
    docHtml += \`<p style="font-size:10pt;line-height:1.6;color:#595959;margin-bottom:8pt;font-family:Arial,'PingFang SC',sans-serif">\${esc(data.summary)}</p>\`;
  }

  // Competencies / expertise grid
  if (comps.length) {
    docHtml += \`<p style="font-size:11pt;font-weight:bold;letter-spacing:0.06em;color:\${t.primary};border-bottom:2px solid \${t.accent};padding-bottom:3pt;margin-top:12pt;margin-bottom:6pt;font-family:Arial,'PingFang SC',sans-serif">\${isZh ? '\\u6838\\u5FC3\\u80FD\\u529B' : expertiseLabel(false)}</p>\`;
    docHtml += renderWordSkillTable(comps, t);
  }

  // Experience
  if (data.experience && data.experience.length) {
    docHtml += \`<p style="font-size:11pt;font-weight:bold;letter-spacing:0.06em;color:\${t.primary};border-bottom:2px solid \${t.accent};padding-bottom:3pt;margin-top:12pt;margin-bottom:6pt;font-family:Arial,'PingFang SC',sans-serif">\${isZh ? '\\u5DE5\\u4F5C\\u7ECF\\u5386' : 'PROFESSIONAL EXPERIENCE'}</p>\`;
    data.experience.forEach(exp => {
      docHtml += \`<p style="margin-bottom:1pt;font-family:Arial,'PingFang SC',sans-serif"><span style="font-size:11pt;font-weight:bold;color:\${t.primary}">\${esc(exp.title)}</span><span style="float:right;font-size:9pt;color:#888888">\${esc(exp.period || '')}</span></p>\`;
      docHtml += \`<p style="font-size:10pt;color:#595959;margin-bottom:1pt;font-family:Arial,'PingFang SC',sans-serif">\${esc(exp.company)}\${exp.location ? ', '+esc(exp.location) : ''}</p>\`;
      if (exp.subtitle) {
        docHtml += \`<p style="font-size:9pt;color:#888888;font-style:italic;margin-bottom:3pt;font-family:Arial,'PingFang SC',sans-serif">\${esc(exp.subtitle)}</p>\`;
      }
      if (exp.bullets && exp.bullets.length) {
        docHtml += \`<ul style="padding-left:16pt;margin:2pt 0 8pt">\`;
        exp.bullets.forEach(b => {
          docHtml += \`<li style="font-size:10pt;color:#595959;line-height:1.55;margin-bottom:2pt;font-family:Arial,'PingFang SC',sans-serif">\${esc(b)}</li>\`;
        });
        docHtml += \`</ul>\`;
      }
    });
  }

  // Education
  if (data.education && data.education.length) {
    docHtml += \`<p style="font-size:11pt;font-weight:bold;letter-spacing:0.06em;color:\${t.primary};border-bottom:2px solid \${t.accent};padding-bottom:3pt;margin-top:12pt;margin-bottom:6pt;font-family:Arial,'PingFang SC',sans-serif">\${isZh ? '\\u6559\\u80B2\\u80CC\\u666F' : 'EDUCATION'}</p>\`;
    data.education.forEach(edu => {
      docHtml += \`<p style="margin-bottom:1pt;font-family:Arial,'PingFang SC',sans-serif"><span style="font-size:10.5pt;font-weight:bold;color:\${t.primary}">\${esc(edu.degree)}</span><span style="float:right;font-size:9pt;color:#888888">\${esc(edu.period || '')}</span></p>\`;
      docHtml += \`<p style="font-size:10pt;color:#595959;margin-bottom:2pt;font-family:Arial,'PingFang SC',sans-serif">\${esc(edu.school)}</p>\`;
      if (edu.notes && edu.notes.length) {
        docHtml += \`<ul style="padding-left:16pt;margin:2pt 0 6pt">\`;
        edu.notes.forEach(n => {
          docHtml += \`<li style="font-size:9.5pt;color:#595959;line-height:1.5;font-family:Arial,'PingFang SC',sans-serif">\${esc(n)}</li>\`;
        });
        docHtml += \`</ul>\`;
      }
    });
  }

  // Wrap in Word-compatible HTML document
  const fullHtml = \`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>\${esc(data.name || 'Resume')}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page { size: A4; margin: 0.75in; }
body { font-family: Arial, 'PingFang SC', sans-serif; font-size: 10.5pt; line-height: 1.55; color: #595959; }
p { margin-top: 0; margin-bottom: 0; }
</style>
</head>
<body>
\${docHtml}
</body>
</html>\`;

  const btn = document.querySelector('.download-btn span');
  const origText = btn.textContent;
  btn.textContent = '\\u6B63\\u5728\\u751F\\u6210 Word...';

  try {
    const blob = new Blob(['\\ufeff' + fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);

    // Method 1: Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);

    // Use setTimeout to ensure the link is in DOM before clicking
    setTimeout(() => {
      a.click();
      // Cleanup after a delay
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    }, 100);

    btn.textContent = '\\u5DF2\\u4E0B\\u8F7D \\u2713';
    setTimeout(()=>{ btn.textContent = origText; }, 3000);
  } catch(e) {
    // Fallback: open in new window so user can save manually
    try {
      const blob = new Blob(['\\ufeff' + fullHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      btn.textContent = '\\u5DF2\\u5728\\u65B0\\u7A97\\u53E3\\u6253\\u5F00';
      setTimeout(()=>{ btn.textContent = origText; }, 3000);
    } catch(e2) {
      btn.textContent = origText;
      console.error('Word export failed');
      alert('\\u4E0B\\u8F7D\\u5931\\u8D25\\uFF0C\\u8BF7\\u5C1D\\u8BD5\\u4F7F\\u7528\\u590D\\u5236\\u7EAF\\u6587\\u672C\\u529F\\u80FD');
    }
  }
}
</script>
</html>
`;

export default {
 async fetch(request,env) {
  const url=new URL(request.url);
  if(url.pathname==='/api/chat')return handleApi(request,env);
  if(request.method!=='GET' || url.pathname!=='/')return new Response('Not found',{status:404});
  return new Response(HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"}});
 }
};
