// --- Навігація між модулями ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// --- Передача даних між модулями ---
function pipeTo(sourceId, targetId) {
    const sourceText = document.getElementById(sourceId).innerText;
    if (sourceText && !sourceText.includes("AWAITING")) {
        document.getElementById(targetId).value = sourceText;
        if(targetId === 'metricsInput') switchTab('module3');
        if(targetId === 'freqInput') switchTab('module4');
    }
}

// --- Експорт результатів у TXT (Ідея 1) ---
function downloadReport(outputId, filename) {
    const text = document.getElementById(outputId).innerText;
    
    if (text === "AWAITING_INPUT..." || text === "AWAITING_SCAN_INITIALIZATION..." || !text) {
        alert("ERR: NO_DATA_TO_EXPORT");
        return;
    }
    
    const reportContent = 
`// SYS.CRYPTO_PIPELINE EXPORT
// DATE: ${new Date().toLocaleString()}
// MODULE_OUTPUT: SUCCESS

[ENCRYPTED_DATA_START]
${text}
[ENCRYPTED_DATA_END]

// END_OF_REPORT`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- Ефект друку тексту ---
function typeEffect(elementId, text, speed = 5) {
    const element = document.getElementById(elementId);
    element.innerHTML = "";
    let i = 0;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// --- Базова логіка Шифру Цезаря (використовується скрізь) ---
function cezarShifr(tekst, krok) {
    let rezultat = "";
    let ukr = "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя";
    let eng = "abcdefghijklmnopqrstuvwxyz";
    
    for (let char of tekst) {
        if (/[a-zA-Zа-яА-ЯіІїЇєЄґҐ]/.test(char)) {
            let isLower = char === char.toLowerCase();
            let cLower = char.toLowerCase();
            let alphabet = ukr.includes(cLower) ? ukr : (eng.includes(cLower) ? eng : "");
            
            if (alphabet) {
                let index = alphabet.indexOf(cLower);
                let zsuv = (index + krok) % alphabet.length;
                if (zsuv < 0) zsuv += alphabet.length;
                rezultat += isLower ? alphabet[zsuv] : alphabet[zsuv].toUpperCase();
            } else {
                rezultat += char;
            }
        } else {
            rezultat += char;
        }
    }
    return rezultat;
}

// --- Обробка інтерфейсу Шифру Цезаря ---
function runCaesar(action) {
    const text = document.getElementById('caesarInput').value;
    const key = parseInt(document.getElementById('caesarKey').value) || 0;
    let krok = action === 'enc' ? key : -key;
    
    let rezultat = cezarShifr(text, krok);
    typeEffect('caesarOutput', rezultat);
}

// --- Шифр Перестановки ---
function runPerm(action) {
    const text = document.getElementById('permInput').value;
    const key = document.getElementById('permKey').value;
    if (!key) return typeEffect('permOutput', "ERR: KEY_MISSING");
    
    let res = "";
    if (action === 'enc') {
        let t = text;
        while (t.length % key.length !== 0) t += " ";
        let stovptsi = Array(key.length).fill("");
        for (let i = 0; i < t.length; i++) stovptsi[i % key.length] += t[i];
        let poryadok = Array.from({length: key.length}, (_, i) => i).sort((a, b) => key[a].toLowerCase().localeCompare(key[b].toLowerCase()));
        res = poryadok.map(i => stovptsi[i]).join("");
    } else {
        if (text.length % key.length !== 0) return typeEffect('permOutput', "ERR: LENGTH_MISMATCH");
        let kRyad = text.length / key.length;
        let poryadok = Array.from({length: key.length}, (_, i) => i).sort((a, b) => key[a].toLowerCase().localeCompare(key[b].toLowerCase()));
        let stovptsi = Array(key.length).fill("");
        let start = 0;
        for (let i of poryadok) { stovptsi[i] = text.slice(start, start + kRyad); start += kRyad; }
        for (let r = 0; r < kRyad; r++) for (let s = 0; s < key.length; s++) res += stovptsi[s][r];
    }
    typeEffect('permOutput', res);
}

// --- Метрики ---
function runMetrics() {
    const text = document.getElementById('metricsInput').value;
    if (!text) return;
    const len = text.length;
    const spaces = (text.match(/ /g) || []).length;
    const letters = (text.match(/[a-zA-Zа-яА-ЯіІїЇєЄґҐ]/g) || []).length;
    
    document.getElementById('metricsList').innerHTML = `
        <li>> TOTAL_BYTES... ${len}</li>
        <li>> CHAR_COUNT...  ${letters}</li>
        <li>> SPACE_COUNT... ${spaces}</li>
        <li>> ENTROPY_EST... ${(letters / (len || 1)).toFixed(2)}</li>
        <li style="color: green; margin-top: 10px;">[ STATUS: READY_FOR_DECRYPTION ]</li>
    `;
}

// --- Частотний аналіз ---
function runFrequencyAnalysis() {
    const text = document.getElementById('freqInput').value.toLowerCase();
    if (!text) return;
    
    let counts = {};
    let total = 0;
    for (let char of text) {
        if (/[a-zа-яіїєґ]/.test(char)) { counts[char] = (counts[char] || 0) + 1; total++; }
    }
    
    let sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    let html = `> TOTAL_CHARS: ${total}<br><br>`;
    
    if(sorted.length > 0) {
        html += `> TARGET_LOCKED: "${sorted[0][0]}" (HIGHEST_PROBABILITY_OF_VOWEL)<br><br>`;
    }
    
    html += `<table style="width:100%; text-align:left; font-size: 12px;">`;
    for (let [char, count] of sorted) {
        let percent = ((count / total) * 100).toFixed(1);
        let blocksCount = Math.min(Math.round(percent / 2), 20); 
        let blocks = "█".repeat(blocksCount) + "░".repeat(20 - blocksCount);
        
        html += `<tr>
            <td width="20px"><strong>[${char.toUpperCase()}]</strong></td>
            <td width="40px">${count}</td>
            <td width="50px">${percent}%</td>
            <td class="ascii-bar" style="color: #555; letter-spacing: -1px;">${blocks}</td>
        </tr>`;
    }
    html += `</table>`;
    
    document.getElementById('freqOutput').innerHTML = html;
}

// --- Автоматичний Брутфорс (Ідея 2) ---
function runBruteForce() {
    const text = document.getElementById('freqInput').value;
    const output = document.getElementById('bruteOutput');
    
    if (!text) {
        output.innerHTML = "ERR: NO_TARGET_DATA";
        return;
    }
    
    output.innerHTML = "INITIALIZING_BRUTEFORCE_ATTACK...<br><br>";
    
    let htmlResult = "<table style='width: 100%; text-align: left; font-size: 12px;'>";
    htmlResult += "<tr style='color: #777;'><th>SHIFT (K)</th><th>DECRYPTED_TEXT_SAMPLE</th></tr>";
    
    for (let k = 1; k < 34; k++) {
        let attempt = cezarShifr(text, -k);
        let sample = attempt.length > 40 ? attempt.substring(0, 40) + "..." : attempt;
        
        htmlResult += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 4px 0; font-weight: bold; width: 80px;">KEY = ${k}</td>
                <td style="padding: 4px 0; font-family: 'Courier New', monospace;">${sample}</td>
            </tr>
        `;
    }
    htmlResult += "</table>";
    
    setTimeout(() => {
        output.innerHTML = htmlResult;
    }, 300);
}
// --- Візуалізація матриці Перестановки (Ідея 4) ---
function visualizePermutation() {
    const text = document.getElementById('permInput').value;
    const key = document.getElementById('permKey').value;
    const matrixDiv = document.getElementById('matrixVisualizer');
    
    if (!key || !text) {
        matrixDiv.innerHTML = "ERR: REQUIRE_INPUT_AND_KEY";
        matrixDiv.style.display = "block";
        return;
    }

    let t = text;
    // Додаємо пробіли, якщо текст не заповнює таблицю рівномірно
    while (t.length % key.length !== 0) t += " ";
    
    // Визначаємо алфавітний порядок літер ключа
    let poryadok = Array.from({length: key.length}, (_, i) => i)
        .sort((a, b) => key[a].toLowerCase().localeCompare(key[b].toLowerCase()));
    
    // Створюємо масив рангів (який стовпець читається 1-м, 2-м і т.д.)
    let ranks = Array(key.length).fill(0);
    for(let i = 0; i < poryadok.length; i++) {
        ranks[poryadok[i]] = i + 1;
    }

    // Малюємо таблицю
    let html = "<table class='matrix-table'><tr>";
    
    // Генеруємо заголовки (Літера ключа + її черга зчитування)
    for(let i = 0; i < key.length; i++) {
        html += `<th>${key[i].toUpperCase()}<span class='key-order'>[READ_ORDER: ${ranks[i]}]</span></th>`;
    }
    html += "</tr>";

    // Заповнюємо таблицю символами тексту
    let kRyad = t.length / key.length;
    let index = 0;
    for(let r = 0; r < kRyad; r++) {
        html += "<tr>";
        for(let c = 0; c < key.length; c++) {
            // Замінюємо пробіли на підкреслення для наочності
            let char = t[index] === ' ' ? '_' : t[index];
            html += `<td>${char}</td>`;
            index++;
        }
        html += "</tr>";
    }
    html += "</table>";
    html += "<p style='font-size: 11px; color: #666; margin-top: 8px;'>* Символ '_' позначає порожнє місце (пробіл).</p>";

    matrixDiv.innerHTML = html;
    matrixDiv.style.display = "block";
}
// --- Логіка Авторизації (Лаба 2) ---
let currentJwtToken = ""; // Тут зберігатимемо токен

async function attemptLogin() {
    const login = document.getElementById('authLogin').value;
    const pass = document.getElementById('authPass').value;
    
    typeEffect('authOutput', "VERIFYING_CREDENTIALS_WITH_SERVER...");
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: login, password: pass })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentJwtToken = data.token;
            const successMsg = `> STATUS: 200 OK\n> MSG: ${data.message}\n> JWT_TOKEN:\n${data.token}`;
            setTimeout(() => typeEffect('authOutput', successMsg, 2), 500);
        } else {
            setTimeout(() => typeEffect('authOutput', `> ERR_401: ${data.message}`, 2), 500);
        }
    } catch (error) {
        typeEffect('authOutput', "ERR: CONNECTION_TO_SERVER_FAILED");
    }
}

async function testProtectedRoute() {
    if (!currentJwtToken) {
        alert("ACCESS DENIED: Спочатку потрібно авторизуватися (отримати токен)!");
        return;
    }
    
    try {
        const response = await fetch('/protected', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${currentJwtToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`СЕРВЕР ДОЗВОЛИВ ДОСТУП!\n\n${data.message}\nТвій ID: ${data.userData.id}\nТвій логін: ${data.userData.login}`);
        } else {
            alert(`ВІДМОВА: ${data.message}`);
        }
    } catch (error) {
        alert("ERR: CONNECTION_TO_SERVER_FAILED");
    }
}