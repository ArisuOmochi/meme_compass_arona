// ==========================================
// 1. Emoji 字典配置 (键名已与逻辑严格对齐)
// ==========================================
const emojiMap = {
    // === 基础身份 ===
    "原批": "🐵📱⚡️😭",
    "米卫兵": "🛡️💂💎🏰",
    "米黑大将": "⚔️👎💣🤬",
    "网左": "🛠️🚩🟥💂",
    "殖人": "🏃🇺🇸🗽🐀",
    "兔友": "🐰🇨🇳🧱💪",
    "主机婆罗门": "🤴🎮📺🍷",
    "T0小仙女": "🧚‍♀️👊🚫🙅‍♀️", // 修正了键名
    "孙吧吧友": "🦍🍌🚬🥵",
    "二刺螈": "🤓📺🎌💞",
    "乐子人": "🤡🎭🍿🤣",
    "现充": "💑💰🚗🎉",
    "互联网路人": "😐📱🌊🍃",

    // === 特殊缝合怪 (Combos) ===
    "网左原批": "🛠️⚡️🐵🚩",
    "黑神话吹": "🐒👑🆙🇨🇳",
    "抗压原批": "🦍⚡️🐵💊",
    "女拳师": "🤡🥊🧚‍♀️💢",   // 修正了键名
    "肥宅": "🎌🍱🏃🐖",     // 修正了键名
    "塞尔达卫兵": "🛡️🗡️🌲🐫",
    "萌新": "🍼👶❓✨"
};

// 默认兜底 Emoji
const defaultEmoji = "❓🧬🧪🤔";

// ==========================================
// 2. 全局变量与初始化
// ==========================================
let questions = [];
let currentQuestionIndex = 0;

// 分数池定义
let scores = {
    pol_left: 0, pol_right: 0, pol_national: 0,
    game_mihoyo: 0, game_hater: 0, game_console: 0,
    gender_fem: 0, gender_man: 0,
    vibe_abstract: 0, vibe_otaku: 0, vibe_normie: 0
};

// 初始化函数
async function init() {
    try {
        // 加时间戳防止缓存
        const response = await fetch('questions.json?v=' + new Date().getTime());
        if (!response.ok) throw new Error("HTTP error " + response.status);
        questions = await response.json();
        console.log(`成功加载 ${questions.length} 道题目`);
        
        const startBtn = document.querySelector('.start-btn');
        if(startBtn) startBtn.disabled = false;
    } catch (error) {
        alert("加载失败！请确保在本地服务器或GitHub Pages运行。");
        console.error(error);
    }
}
init();

// ==========================================
// 3. 交互逻辑
// ==========================================
function startTest() {
    if (!questions || questions.length === 0) return alert("题目加载中...");
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    document.getElementById('result-screen').classList.add('hidden');
    renderQuestion();
}

function renderQuestion() {
    if (currentQuestionIndex >= questions.length) {
        calculateAndShowResult();
        return;
    }
    const q = questions[currentQuestionIndex];
    
    // 进度条
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    const bar = document.getElementById('progress-fill');
    if(bar) bar.style.width = `${progress}%`;

    // 题目与选项
    document.getElementById('question-text').innerText = q.text;
    const optsContainer = document.getElementById('options-container');
    optsContainer.innerHTML = ''; 

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn option-btn';
        btn.innerText = opt.text;
        btn.onclick = () => handleAnswer(opt.scores);
        optsContainer.appendChild(btn);
    });
}

function handleAnswer(choiceScores) {
    if (choiceScores) {
        for (let key in choiceScores) {
            if (scores.hasOwnProperty(key)) scores[key] += choiceScores[key];
            else scores[key] = choiceScores[key]; 
        }
    }
    currentQuestionIndex++;
    renderQuestion(); // 递归调用下一题判断
}

// ==========================================
// 4. 核心算法与 Emoji 匹配
// ==========================================
function calculateAndShowResult() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    const bar = document.getElementById('progress-fill');
    if(bar) bar.style.width = '100%';

    // 1. 排序算分
    let sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    let top1 = sortedScores[0][0]; 
    let top1Score = sortedScores[0][1];
    let top2 = sortedScores[1][0]; 
    
    console.log("得分详情:", sortedScores);

    let prefix = "";
    let noun = "";
    let desc = "";

    // 2. 身份判定 (Noun)
    if (scores.game_mihoyo >= 15) noun = "原批";
    else if (scores.game_mihoyo >= 10 && scores.vibe_otaku >= 5) noun = "米卫兵";
    else if (scores.game_hater >= 12) noun = "米黑大将";
    else if (scores.pol_left >= 12) noun = "网左";
    else if (scores.pol_right >= 12) noun = "殖人"; 
    else if (scores.pol_national >= 12) noun = "兔友";
    else if (scores.game_console >= 10) noun = "主机婆罗门";
    else if (scores.gender_fem >= 10) noun = "T0小仙女"; // 注意这里是 T0小仙女
    else if (scores.gender_man >= 10) noun = "孙吧吧友";
    else if (scores.vibe_otaku >= 12) noun = "二刺螈";
    else if (scores.vibe_abstract >= 12) noun = "乐子人";
    else if (scores.vibe_normie >= 10) noun = "现充";
    else noun = "互联网路人";

    // 3. 前缀判定 (Prefix)
    if (top2 === 'pol_left') prefix = "赤色";
    else if (top2 === 'pol_national') prefix = "爱国";
    else if (top2 === 'pol_right') prefix = "罕见";
    else if (top2 === 'game_mihoyo') prefix = "原神玩家";
    else if (top2 === 'vibe_abstract') prefix = "魔怔";
    else if (top2 === 'game_console') prefix = "高贵";
    else if (top2 === 'vibe_otaku') prefix = "死宅";
    else if (top2 === 'gender_fem') prefix = "打拳";
    else if (top2 === 'gender_man') prefix = "抗压";
    else prefix = "普通";

    // 4. 特殊组合 (Combos) - 会覆盖上面的 Noun
    if (scores.pol_left >= 8 && scores.game_mihoyo >= 8) {
        prefix = "赛博"; noun = "网左原批"; // 对应字典键: "网左原批"
        desc = "你试图在提瓦特大陆建立苏维埃，成分极其复杂。";
    }
    else if (scores.pol_national >= 8 && scores.game_console >= 8) {
        prefix = "国产之光"; noun = "黑神话吹"; // 对应字典键: "黑神话吹"
        desc = "只要是国产3A你就吹爆，任何批评声音在你看来都是境外势力。";
    }
    else if (scores.gender_man >= 8 && scores.game_mihoyo >= 8) {
        prefix = "精神分裂的"; noun = "抗压原批"; // 对应字典键: "抗压原批"
        desc = "你在孙吧骂女人，在米游社喊老婆。";
    }
    else if (scores.gender_fem >= 8 && scores.vibe_abstract >= 8) {
        prefix = "抽象"; noun = "女拳师"; // 对应字典键: "女拳师"
        desc = "攻击性极强，擅长用魔法打败魔法。";
    }
    else if (scores.pol_right >= 8 && scores.vibe_otaku >= 8) {
        prefix = "精日"; noun = "肥宅"; // 对应字典键: "肥宅"
        desc = "身在国内，心在秋叶原。";
    }
    else if (top1Score < 6) {
        prefix = "纯得像白纸的"; noun = "萌新"; // 对应字典键: "萌新"
        desc = "你可能很少上网，互联网的粪坑还没污染到你。";
    }
    else if (scores.game_hater >= 8 && scores.game_console >= 5) {
        prefix = "高傲的"; noun = "塞尔达卫兵"; // 对应字典键: "塞尔达卫兵"
        desc = "看到米哈游就像看到了杀父仇人。";
    }

    if (!desc) desc = `你的主要成分是 ${top1} 和 ${top2}。`;

    // === 5. Emoji 匹配逻辑 (核心修复) ===
    // 直接用计算出的 noun 去查字典
    // 如果找不到，就用默认值
    let finalEmoji = emojiMap[noun] || defaultEmoji;

    // 渲染结果
    const emojiEl = document.getElementById('result-emoji');
    if (emojiEl) emojiEl.innerText = finalEmoji;
    
    document.getElementById('result-label').innerText = `${prefix}${noun}`;
    document.getElementById('result-desc').innerText = desc;
}

function restartTest() {
    Object.keys(scores).forEach(key => scores[key] = 0);
    currentQuestionIndex = 0;
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('welcome-screen').classList.remove('hidden');
    const bar = document.getElementById('progress-fill');
    if(bar) bar.style.width = '0%';
}

// === 5. 赛博露出 (截图功能) ===
function generateShareImage() {
    const element = document.getElementById('capture-area');
    const watermark = document.querySelector('.hidden-watermark');
    
    // 1. 截图前的准备：显示水印，调整样式使其更像正方形卡片
    watermark.style.display = 'block';
    const originalPadding = element.style.padding;
    element.style.padding = '40px 20px'; // 增加上下留白，看起来更像拍立得
    element.style.background = '#fff';   // 确保背景是白的
    
    // 2. 开始截图
    // scale: 2 表示开启2倍清晰度，防止手机上模糊
    html2canvas(element, { 
        scale: 3, 
        useCORS: true,
        backgroundColor: "#ffffff" // 强制白底
    }).then(canvas => {
        // 3. 截图完成，复原样式
        watermark.style.display = 'none';
        element.style.padding = originalPadding;

        // 4. 生成图片并显示弹窗
        const imgData = canvas.toDataURL("image/png");
        showModal(imgData);
    }).catch(err => {
        console.error("截图失败:", err);
        alert("生成失败，请手动截屏吧😭");
        // 复原样式
        watermark.style.display = 'none';
        element.style.padding = originalPadding;
    });
}

// 显示弹窗
function showModal(imgUrl) {
    const modal = document.getElementById('image-modal');
    const container = document.getElementById('img-container');
    
    // 创建图片元素
    container.innerHTML = ''; // 清空旧图
    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = "你的成分截图";
    
    container.appendChild(img);
    modal.classList.remove('hidden');
}

// 关闭弹窗
function closeModal() {
    document.getElementById('image-modal').classList.add('hidden');
}