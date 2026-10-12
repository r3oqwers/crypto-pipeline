const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

function hashSHA256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

const users = [
    { id: 13, login: "Новак", passwordHash: hashSHA256("Давід") },
    { id: 14, login: "Паздерська", passwordHash: hashSHA256("Марія") },
    { id: 15, login: "Павловський", passwordHash: hashSHA256("Максим") }
];

const JWT_SECRET = "MariiaPazderska";

app.post('/login', (req, res) => {
    const { login, password } = req.body;
    const user = users.find(u => u.login === login);
    
    if (user && user.passwordHash === hashSHA256(password)) {
        const token = jwt.sign({ id: user.id, login: user.login }, JWT_SECRET, { expiresIn: '14m' });
        res.json({
            message: "Користувач був успішно авторизований",
            token: token
        });
    } else {
        res.status(401).json({ message: "Невірний логін або пароль" });
    }
});

// Захищений шлях localhost:3000/protected
app.get('/protected', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: "Доступ заборонено: відсутній токен" });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ message: "Доступ дозволено!", userData: decoded });
    } catch (error) {
        res.status(401).json({ message: "Невалідний або прострочений токен" });
    }
});

// Запуск сервера (адаптовано для Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => {
        console.log("SYS.SERVER_ONLINE -> http://localhost:3000");
    });
}
module.exports = app;