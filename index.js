// Підключення необхідних модулів
const express = require("express"); // Express - фреймворк для створення веб-додатків
const app = express(); // Створення екземпляру додатку Express
const multer = require("multer"); // Multer - middleware для обробки файлових завантажень
const fs = require('fs/promises'); // Модуль для роботи з файловою системою (використовує проміси)
const path = require('path'); // Модуль для роботи зі шляхами файлів

const port = 8000; // Порт, на якому буде слухати вхідні підключення

// Middleware для обробки файлових завантажень за допомогою Multer
const upload = multer();

// Шлях до файлу notes.json, де зберігаються нотатки
const notesJsonPath = 'notes.json';

// Middleware для обробки статичних файлів з папки 'static'
app.use(express.static(path.join(__dirname, 'static')));

// Middleware для розбору тіла запиту у форматі JSON
app.use(express.json());


// Middleware для перевірки наявності властивості 'notes' та ініціалізації її порожнім масивом
const checkNotesProperty = async (req, res, next) => {
  try {
      // Читання вмісту файлу 'notes.json'
      const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');

      // Перевірка, чи файл 'notes.json' порожній або не існує
      if (notesJsonData.trim() === '') {
          // Якщо так, то перезаписуємо файл ініціалізованим порожнім масивом JSON
          await fs.writeFile(notesJsonPath, '[]', 'utf8');
      }

      // Передача управління наступному middleware або маршруту
      next();
  } catch (error) {
      // Обробка помилки: відправлення відповіді з HTTP-кодом 500 та повідомленням про помилку
      console.error(error);
      res.status(500).json({ error: 'Внутрішня помилка серверу' });
  }
};

  
  // Використовуємо middleware для всіх маршрутів
  app.use(checkNotesProperty);

// GET /notes - отримання списку нотаток
app.get('/notes', async (req, res) => {
  try {
      // Читання вмісту файлу 'notes.json'
      const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');
      
      // Парсінг JSON-рядка у JavaScript-об'єкт
      const notesJson = JSON.parse(notesJsonData);
      
      // Отримання списку нотаток
      const notes = notesJson;
      
      // Відправлення списку нотаток у відповідь клієнту у форматі JSON
      res.json(notes);
  } catch (error) {
      // Обробка помилки: відправлення відповіді з HTTP-кодом 500 та повідомленням про помилку
      console.error(error);
      res.status(500).json({ error: 'Внутрішня помилка серверу' });
  }
});

// GET-маршрут для відправлення статичного файлу UploadForm.html клієнту

// Шлях до файлу UploadForm.html в папці 'static'
const filePath = 'UploadForm.html';

app.get('/UploadForm.html', (req, res) => {
  // Відправлення файлу клієнту за допомогою res.sendFile

  // Параметри:
  // - Шлях до файлу, який відправляється
  // - Об'єкт параметрів, в якому вказується маршрут на кореневу папку файлу
  // - Callback-функція, яка викликається після відправлення файлу або виникає помилка

  res.sendFile(filePath, { root: path.join(__dirname, 'static') }, (err) => {
    if (err) {
      // Обробка помилки, якщо не вдалося відправити файл

      // Логування помилки в консоль сервера
      console.error(err);

      // Відправлення клієнту відповіді з HTTP-кодом 500 та повідомленням про внутрішню помилку
      res.status(500).send('Внутрішня помилка серверу');
    }
  });
});


// POST /upload
// Маршрут для обробки POST-запитів на '/upload'

app.post('/upload', upload.fields([{ name: 'note_name' }, { name: 'note' }]), async (req, res) => {
  try {
    // Отримання ім'я та текст нотатки з тіла POST-запиту
    const noteName = req.body.note_name;
    const noteText = req.body.note;

    // Читання вмісту файлу 'notes.json'
    const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');

    // Парсінг JSON-рядка у JavaScript-масив об'єктів
    const notesJson = JSON.parse(notesJsonData);

    // Перевірка наявності нотатки з таким ім'ям
    const existingNote = notesJson.find((note) => note.name === noteName);

    // Якщо нотатка з ім'ям вже існує, повертаємо помилку 400
    if (existingNote) {
      return res.status(400).json({ error: 'Така нотатка вже існує' });
    }

    // Додавання нової нотатки до масиву
    notesJson.push({ name: noteName, text: noteText });

    // Збереження оновленого масиву нотаток у файл 'notes.json'
    await fs.writeFile(notesJsonPath, JSON.stringify(notesJson, null, 2));

    // Відправлення відповіді про успішне завантаження нотатки з кодом 201
    res.status(400).send('Нотатка успішно додана!');
  } catch (error) {
    // Обробка помилок: вивід інформації про помилку у консоль сервера
    console.error(error);

    // Відправлення відповіді з HTTP-кодом 500 та повідомленням про внутрішню помилку
    res.status(500).json({ error: 'Внутрішня помилка серверу' });
  }
});



// GET /notes/noteName

// Обробник GET-запиту для отримання тексту нотатки за її ім'ям
app.get('/notes/:noteName', async (req, res) => {
  try {
      // Отримання параметра ім'я нотатки з URL
      const noteName = req.params.noteName;

      // Читання вмісту файлу 'notes.json'
      const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');

      // Парсінг JSON-рядка у масив об'єктів нотаток
      const notesJson = JSON.parse(notesJsonData);

      // Пошук нотатки за ім'ям у масиві
      const selectedNote = notesJson.find((note) => note.name === noteName);

      // Перевірка наявності нотатки
      if (!selectedNote) {
          // Якщо нотатка не знайдена, відправляємо відповідь з HTTP-кодом 404 та повідомленням про помилку
          return res.status(400).json({ error: 'Нотатку не знайдено' });
      }

      // Відправлення відповіді з текстом нотатки користувачеві
      res.send(selectedNote.text);
  } catch (error) {
      // Обробка помилок: вивід інформації про помилку у консоль сервера
      console.error(error);

      // Відправлення відповіді з HTTP-кодом 500 та повідомленням про внутрішню помилку
      res.status(500).json({ error: 'Внутрішня помилка серверу' });
  }
});



  // Обробник PUT-запиту для оновлення тексту нотатки за ім'ям
app.put('/notes/:noteName', express.text(), async (req, res) => {
  try {
      // Отримання ім'я нотатки та нового тексту з параметрів шляху та тіла запиту
      const noteName = req.params.noteName;
      const newNoteText = req.body;

      // Читання вмісту файлу 'notes.json'
      const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');

      // Парсінг JSON-рядка у JavaScript-масив об'єктів
      const notesJson = JSON.parse(notesJsonData);
      
      // Пошук нотатки за ім'ям у масиві нотаток
      const selectedNote = notesJson.find((note) => note.name === noteName);

      // Перевірка, чи нотатка знайдена
      if (selectedNote) {
          // Заміна тексту існуючої нотатки новим текстом
          selectedNote.text = newNoteText;

          // Оновлення файлу 'notes.json' із зміненим масивом нотаток
          await fs.writeFile(notesJsonPath, JSON.stringify(notesJson), 'utf8');

          // Відправлення відповіді про успішне оновлення нотатки із кодом 200
          res.status(200).send('Нотатка успішно оновлена!');
      } else {
          // Відправлення відповіді про те, що нотатка не знайдена із кодом 404
          res.status(400).send('Нотатку не знайдено');
      }
  } catch (error) {
      // Обробка помилок: вивід інформації про помилку у консоль сервера
      console.error(error);

      // Відправлення відповіді із HTTP-кодом 500 та повідомленням про внутрішню помилку
      res.status(500).json({ error: 'Внутрішня помилка серверу' });
  }
});


// DELETE /notes/:noteName
app.delete('/notes/:noteName', async (req, res) => {
  try {
    // Отримання параметру :noteName з URL-запиту
    const noteName = req.params.noteName;

    // Читання JSON-даних з файлу за вказаним шляхом
    const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');
    const notesJson = JSON.parse(notesJsonData);

    // Пошук нотатки за ім'ям
    const selectedNoteIndex = notesJson.findIndex((note) => note.name === noteName);

    // Перевірка чи нотатка існує
    if (selectedNoteIndex === -1) {
      // Якщо нотатка не знайдена, відправити відповідь зі статусом 404 та повідомленням про помилку
      return res.status(400).json({ error: 'Нотатку не знайдено' });
    }

    // Видалення нотатки з масиву
    notesJson.splice(selectedNoteIndex, 1);

    // Оновлення файлу з JSON-даними
    await fs.writeFile(notesJsonPath, JSON.stringify(notesJson, null, 2));

    // Відправлення відповіді зі статусом 200 та повідомленням про успішне видалення
    res.status(200).send('Нотатка була успішно видалена!');
  } catch (error) {
    // Обробка помилок: виведення помилки у консоль та відправка відповіді зі статусом 500 та повідомленням про внутрішню помилку
    console.error(error);
    res.status(500).json({ error: 'Внутрішня помилка серверу' });
  }
});


// Встановлення прослуховування запитів на вказаному порту
app.listen(port, () => {
  // Виведення повідомлення при запуску сервера
  console.log(`Server is running at http://localhost:${port}`);
});
