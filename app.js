const displayExpr = document.getElementById("display-expr");
const displayVal = document.getElementById("display-val");
const historyList = document.getElementById("history-list");
const historyPanel = document.getElementById("history-panel");

let currentInput = "0";
let expression = "";
let shouldResetScreen = false;
let history = JSON.parse(localStorage.getItem("calc_history")) || [];

function updateDisplay() {
    displayVal.innerText = currentInput;
    displayExpr.innerText = expression;
}

function inputNum(num) {
    if (currentInput === "0" || shouldResetScreen) {
        currentInput = num;
        shouldResetScreen = false;
    } else {
        if (num === "." && currentInput.includes(".")) return;
        currentInput += num;
    }
    updateDisplay();
}

function handleOperator(op) {
    if (shouldResetScreen) {
        expression = currentInput + " " + op + " ";
        shouldResetScreen = false;
    } else {
        if (expression && !currentInput) {
            expression = expression.slice(0, -3) + " " + op + " ";
        } else {
            expression += currentInput + " " + op + " ";
        }
    }
    currentInput = "";
    updateDisplay();
}

function clearAll() {
    currentInput = "0";
    expression = "";
    shouldResetScreen = false;
    updateDisplay();
}

function backspace() {
    if (shouldResetScreen) {
        clearAll();
        return;
    }
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = "0";
    }
    updateDisplay();
}

function negate() {
    if (currentInput === "0") return;
    if (currentInput.startsWith("-")) {
        currentInput = currentInput.slice(1);
    } else {
        currentInput = "-" + currentInput;
    }
    updateDisplay();
}

function percentage() {
    if (currentInput === "0") return;
    currentInput = (parseFloat(currentInput) / 100).toString();
    updateDisplay();
}

function calculate() {
    if (!expression || shouldResetScreen) return;
    
    let fullExpr = expression + currentInput;
    let sanitizedExpr = fullExpr.replace(/&divide;/g, "/").replace(/&times;/g, "*");
    
    let result;
    try {
        result = evaluateExpression(sanitizedExpr);
        if (!isFinite(result)) {
            result = "Error";
        } else {
            result = parseFloat(result.toFixed(10)).toString();
        }
    } catch (e) {
        result = "Error";
    }

    const formattedExpr = fullExpr.replace(/\*/g, " &times; ").replace(/\//g, " &divide; ");
    
    if (result !== "Error") {
        addHistoryItem(formattedExpr, result);
    }
    
    currentInput = result;
    expression = "";
    shouldResetScreen = true;
    updateDisplay();
}

function evaluateExpression(str) {
    const tokens = str.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return 0;
    
    let values = [];
    let ops = [];
    
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        if (!isNaN(token)) {
            values.push(parseFloat(token));
        } else if (token === "%") {
            let val = values.pop();
            values.push(val / 100);
        } else {
            while (ops.length > 0 && hasPrecedence(token, ops[ops.length - 1])) {
                values.push(applyOp(ops.pop(), values.pop(), values.pop()));
            }
            ops.push(token);
        }
    }
    
    while (ops.length > 0) {
        values.push(applyOp(ops.pop(), values.pop(), values.pop()));
    }
    
    return values[0];
}

function hasPrecedence(op1, op2) {
    if (op2 === '(' || op2 === ')') return false;
    if ((op1 === '*' || op1 === '/') && (op2 === '+' || op2 === '-')) return false;
    return true;
}

function applyOp(op, b, a) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': 
            if (b === 0) return Infinity;
            return a / b;
    }
    return 0;
}

function addHistoryItem(expr, res) {
    history.unshift({ expr, res });
    if (history.length > 30) history.pop();
    localStorage.setItem("calc_history", JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = "";
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No history yet</div>';
        return;
    }
    history.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.onclick = () => {
            currentInput = item.res;
            expression = "";
            shouldResetScreen = true;
            updateDisplay();
        };
        div.innerHTML = `
            <span class="hist-expr">${item.expr} =</span>
            <span class="hist-res">${item.res}</span>
        `;
        historyList.appendChild(div);
    });
}

function initTheme() {
    const themeToggleBtn = document.getElementById("theme-toggle");
    const activeTheme = localStorage.getItem("calc_theme") || "dark-theme";
    document.body.className = activeTheme;

    themeToggleBtn.onclick = () => {
        if (document.body.classList.contains("dark-theme")) {
            document.body.className = "light-theme";
            localStorage.setItem("calc_theme", "light-theme");
        } else {
            document.body.className = "dark-theme";
            localStorage.setItem("calc_theme", "dark-theme");
        }
    };
}

function initListeners() {
    document.querySelectorAll(".btn-num").forEach(btn => {
        btn.onclick = () => inputNum(btn.getAttribute("data-val"));
    });

    document.querySelectorAll(".btn-op").forEach(btn => {
        btn.onclick = () => handleOperator(btn.getAttribute("data-val"));
    });

    document.querySelector('[data-action="clear"]').onclick = clearAll;
    document.querySelector('[data-action="backspace"]').onclick = backspace;
    document.querySelector('[data-action="negate"]').onclick = negate;
    document.querySelector('[data-val="%"]').onclick = percentage;
    document.querySelector('[data-action="calculate"]').onclick = calculate;

    document.getElementById("history-toggle").onclick = () => {
        historyPanel.classList.toggle("active");
    };

    document.getElementById("clear-history").onclick = () => {
        history = [];
        localStorage.removeItem("calc_history");
        renderHistory();
    };

    document.addEventListener("keydown", (e) => {
        const key = e.key;
        if (key >= "0" && key <= "9") inputNum(key);
        else if (key === ".") inputNum(".");
        else if (key === "+") handleOperator("+");
        else if (key === "-") handleOperator("-");
        else if (key === "*") handleOperator("*");
        else if (key === "/") handleOperator("/");
        else if (key === "Enter" || key === "=") calculate();
        else if (key === "Backspace") backspace();
        else if (key === "Escape") clearAll();
    });
}

window.onload = () => {
    initTheme();
    initListeners();
    renderHistory();
    updateDisplay();
};
