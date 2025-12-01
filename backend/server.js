const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Папка для статичних файлів (фронтенд)
app.use(express.static(path.join(__dirname, '../frontend')));

// Шлях до файлу з бронюваннями
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

// Ініціалізація файлу бронювань
const initializeBookingsFile = () => {
    if (!fs.existsSync(BOOKINGS_FILE)) {
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2));
    }
};

// Отримати всі бронювання
app.get('/api/bookings', (req, res) => {
    try {
        initializeBookingsFile();
        const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
        const bookings = JSON.parse(data);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Помилка читання файлу бронювань' });
    }
});

// Створити нове бронювання
app.post('/api/bookings', (req, res) => {
    try {
        initializeBookingsFile();
        const newBooking = {
            id: Date.now(),
            ...req.body,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
        const bookings = JSON.parse(data);
        bookings.push(newBooking);
        
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
        
        console.log('Нове бронювання:', newBooking);
        res.status(201).json({ 
            success: true, 
            message: 'Бронювання успішно створено!', 
            booking: newBooking 
        });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ error: 'Помилка збереження бронювання' });
    }
});

// Отримати статистику
app.get('/api/stats', (req, res) => {
    try {
        initializeBookingsFile();
        const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
        const bookings = JSON.parse(data);
        
        const stats = {
            totalBookings: bookings.length,
            pending: bookings.filter(b => b.status === 'pending').length,
            confirmed: bookings.filter(b => b.status === 'confirmed').length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length,
            byRoomType: bookings.reduce((acc, booking) => {
                acc[booking.roomType] = (acc[booking.roomType] || 0) + 1;
                return acc;
            }, {})
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Помилка отримання статистики' });
    }
});

// Оновити статус бронювання
app.put('/api/bookings/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        initializeBookingsFile();
        const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
        let bookings = JSON.parse(data);
        
        const index = bookings.findIndex(b => b.id == id);
        if (index === -1) {
            return res.status(404).json({ error: 'Бронювання не знайдено' });
        }
        
        bookings[index].status = status;
        bookings[index].updatedAt = new Date().toISOString();
        
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Статус оновлено', 
            booking: bookings[index] 
        });
    } catch (error) {
        res.status(500).json({ error: 'Помилка оновлення бронювання' });
    }
});

// Обробка всіх інших маршрутів (для SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Сервер запущено на порту ${PORT}`);
    console.log(`🌐 Відкрийте в браузері: http://localhost:${PORT}`);
});
