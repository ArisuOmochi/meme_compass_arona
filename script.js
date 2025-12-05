// ==========================================
// 全局状态管理
// ==========================================
let appData = null;      // 存放 data.json 的所有内容
let currentQIndex = 0;   // 当前题号
let scores = {};         // 当前分数状态
let historyStack = [];   // 历史记录栈（用于撤回）

// ==========================================
// 1. 初始化
// ==========================================
async function init() {
    try {
        const btn = document.querySelector('.start-btn');
        // 加时间戳防止缓存
        const res = await fetch('data.json?v=' + new Date().getTime());
        if (!res.ok) throw new Error("Load failed");
        
        appData = await res.json();
        console.log("配置加载成功:", appData.meta.title);
        
        // 初始化分数对象 (根据 dimensions 键值)
        Object.keys(appData.dimensions).forEach(key => scores[key] = 0);

        btn.disabled = false;
        btn.innerText = "开始查成分";
    } catch (err) {
        console.error(err);
        alert("数据加载失败，请检查环境 (需在服务器/localhost运行)");
    }
}
init();

// ==========================================
// 2. 游戏流程控制
// ==========================================
function startTest() {
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    document.getElementById('result-screen').classList.add('hidden');
    renderQuestion();
}

function renderQuestion() {
    const q = appData.questions[currentQIndex];
    
    // UI更新
    document.getElementById('q-number').innerText = currentQIndex + 1;
    document.getElementById('question-text').innerText = q.text;
    
    // 进度条
    const progress = (currentQIndex / appData.questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;

    // 撤回按钮状态
    const undoBtn = document.getElementById('undo-btn');
    if (currentQIndex > 0) undoBtn.classList.remove('hidden');
    else undoBtn.classList.add('hidden');

    // 渲染选项
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn option-btn';
        btn.innerText = opt.text;
        btn.onclick = () => handleAnswer(opt.scores);
        container.appendChild(btn);
    });
}

function handleAnswer(choiceScores) {
    // 1. 记录历史 (深拷贝当前分数，用于撤回恢复)
    // 实际上我们只需要记录"这一步加了什么分"或者"这一步之前的总分"
    // 为了简单，我们记录"这一步加的分"
    historyStack.push(choiceScores);

    // 2. 加分
    if (choiceScores) {
        for (let key in choiceScores) {
            if (scores.hasOwnProperty(key)) scores[key] += choiceScores[key];
        }
    }

    // 3. 推进
    currentQIndex++;
    if (currentQIndex < appData.questions.length) {
        renderQuestion();
    } else {
        calculateAndShowResult();
    }
}

// === 撤回功能 ===
function undoLastAnswer() {
    if (currentQIndex === 0 || historyStack.length === 0) return;

    // 1. 弹出上一次的得分变动
    const lastChange = historyStack.pop();

    // 2. 减分 (回滚状态)
    if (lastChange) {
        for (let key in lastChange) {
            if (scores.hasOwnProperty(key)) scores[key] -= lastChange[key];
        }
    }

    // 3. 倒退题目
    currentQIndex--;
    renderQuestion();
}

// ==========================================
// 3. 结果计算引擎 (完全基于 JSON 配置)
// ==========================================
function calculateAndShowResult() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('progress-fill').style.width = '100%';

    const rules = appData.results;
    
    // 预计算一些辅助状态
    const isHater = scores.game_hater > scores.game_mihoyo;
    const isLoveHate = scores.game_hater >= 8 && scores.game_mihoyo >= 8;

    // 1. 寻找得分最高的维度
    let sortedDims = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    let topDim = sortedDims[0][0]; 
    let topScore = sortedDims[0][1];
    let secondDim = sortedDims[1] ? sortedDims[1][0] : null;

    let finalNoun = null;
    let finalPrefix = "";
    let finalEmoji = rules.fallback.emoji;
    let finalDesc = "";

    // === Step A: 检查 Combos (特殊缝合怪，优先级最高) ===
    for (let combo of rules.combos) {
        let match = true;
        
        // 检查 Hater 排斥
        if (combo.exclude_hater && isHater) match = false;
        
        // 检查所有条件分数
        if (match) {
            for (let key in combo.conditions) {
                if (scores[key] < combo.conditions[key]) {
                    match = false;
                    break;
                }
            }
        }

        if (match) {
            finalPrefix = ""; // Combo 自带完整名字
            finalNoun = combo.name;
            finalEmoji = combo.emoji;
            finalDesc = combo.desc;
            break; // 找到最高优先级的 combo 就停止
        }
    }

    // === Step B: 如果没有 Combo，走常规逻辑 ===
    if (!finalNoun) {
        // B1. 确定核心名词 (Noun)
        // 遍历 nouns 配置，找到符合条件的最高优先级的
        // 我们假设 json 里的顺序就是优先级，或者我们按分数匹配
        
        for (let rule of rules.nouns) {
            let match = false;
            
            // 特殊逻辑：扭曲
            if (rule.condition.custom === "high_love_hate") {
                if (isLoveHate) match = true;
            } 
            // 常规逻辑：维度分阈值
            else if (rule.condition.dimension) {
                const dimKey = rule.condition.dimension;
                const threshold = rule.condition.min;
                // 排除 Hater 的逻辑 (如米卫兵)
                if (rule.condition.exclude_hater && isHater) {
                    match = false;
                } else {
                    if (scores[dimKey] >= threshold) match = true;
                }
            }

            if (match) {
                finalNoun = rule.name;
                finalEmoji = rule.emoji;
                break; // 找到一个就停? 或者应该找最符合的? 
                // 这里简化逻辑：JSON数组越靠前优先级越高。
            }
        }
        
        // 兜底
        if (!finalNoun) {
            finalNoun = rules.fallback.noun;
            finalEmoji = rules.fallback.emoji;
            finalDesc = rules.fallback.desc;
        }

        // B2. 确定前缀 (Prefix) - 基于第二高分
        // 如果 topDim 已经被用作 Noun 了，我们看 secondDim
        // 或者简单点，遍历 prefix 规则，看哪个分高
        let bestPrefixScore = -999;
        
        for (let p of rules.prefixes) {
            let s = scores[p.dim];
            // 特殊处理：如果这个维度已经是 Noun 的核心维度，就不要再做前缀了，防重复
            // 简单处理：如果分数够高，且不是 Hater 冲突
            if (p.dim === "game_mihoyo" && isHater) continue;

            if (s > 5 && s > bestPrefixScore) { // 阈值 5
                // 避免前缀和名词完全一样 (逻辑上需人工保证 JSON 配置合理)
                finalPrefix = p.text;
                bestPrefixScore = s;
            }
        }
        
        // 如果没生成 Combo 描述，生成通用描述
        if (!finalDesc) {
            finalDesc = `你的核心成分是 ${appData.dimensions[topDim]} 和 ${appData.dimensions[secondDim] || '无'}。`;
        }
    }

    // 渲染
    document.getElementById('result-emoji').innerText = finalEmoji;
    document.getElementById('result-label').innerText = `${finalPrefix}${finalNoun}`;
    document.getElementById('result-desc').innerText = finalDesc;
}

function restartTest() {
    Object.keys(scores).forEach(key => scores[key] = 0);
    currentQIndex = 0;
    historyStack = []; // 清空历史
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('welcome-screen').classList.remove('hidden');
}

// ==========================================
// 4. 截图功能 (保持不变)
// ==========================================
function generateShareImage() {
    const element = document.getElementById('capture-area');
    const watermark = document.querySelector('.hidden-watermark');
    
    if(!window.html2canvas) return alert("组件加载失败");

    watermark.style.display = 'block';
    const originalPadding = element.style.padding;
    element.style.padding = '40px 20px'; 
    
    html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
    .then(canvas => {
        watermark.style.display = 'none';
        element.style.padding = originalPadding;
        showModal(canvas.toDataURL("image/png"));
    }).catch(err => {
        console.error(err);
        watermark.style.display = 'none';
        element.style.padding = originalPadding;
    });
}

function showModal(src) {
    const box = document.getElementById('img-container');
    box.innerHTML = '';
    const img = document.createElement('img');
    img.src = src;
    box.appendChild(img);
    document.getElementById('image-modal').classList.remove('hidden');
}
function closeModal() {
    document.getElementById('image-modal').classList.add('hidden');
}