const express = require("express");
const app = express();
const multer = require("multer");
const fs = require('fs/promises');
const path = require('path');
const port = 8000;

const upload = multer();
const notesJsonPath = 'notes.json';

app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());

// Middleware для перевірки наявності властивості 'notes'
const checkNotesProperty = async (req, res, next) => {
    try {
      const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');
      if (notesJsonData.trim() === '') {
        await fs.writeFile(notesJsonPath, '[]', 'utf8');
    }
      // Передаємо управління наступному middleware або маршруту
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  // Використовуємо middleware для всіх маршрутів
  app.use(checkNotesProperty);

// GET /notes
app.get('/notes', async (req, res) => {
  try {
    const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');
    const notesJson = JSON.parse(notesJsonData);
    const notes = notesJson;
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /UploadForm.html
app.get('/UploadForm.html', (req, res) => {
  res.sendFile('UploadForm.html', { root: path.join(__dirname, 'static') }, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// POST /upload
app.post('/upload', upload.fields([{ name: 'note_name' }, { name: 'note' }]), async (req, res) => {
  try {
    const noteName = req.body.note_name;
    const noteText = req.body.note;

    const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');
    const notesJson = JSON.parse(notesJsonData);

    // Перевірка наявності нотатки з таким ім'ям
    const existingNote = notesJson.find((note) => note.name === noteName);
    if (existingNote) {
      return res.status(400).json({ error: 'Note with this name already exists' });
    }

    // Додавання нової нотатки
    notesJson.push({ name: noteName, text: noteText });

    // Оновлення файлу package.json
    await fs.writeFile(notesJsonPath, JSON.stringify(notesJson, null, 2));

    res.status(201).send('Note uploaded successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// GET /notes/noteName
app.get('/notes/:noteName', async (req, res) => {
    try {
      const noteName = req.params.noteName;
  
      const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');
      const notesJson = JSON.parse(notesJsonData);
  
      // Пошук нотатки за ім'ям
      const selectedNote = notesJson.find((note) => note.name === noteName);
      if (!selectedNote) {
        return res.status(404).json({ error: 'Note not found' });
      }
  
      // Повернення тексту нотатки
      res.send(selectedNote.text);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


  // PUT /notes/:noteName
  app.put('/notes/:noteName', express.text(), async (req, res) => {
    try {
        const noteName = req.params.noteName;
        const newNoteText = req.body;

        const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');
        const notesJson = JSON.parse(notesJsonData);
        
        // Пошук нотатки за ім'ям
        const selectedNote = notesJson.find((note) => note.name === noteName);

        if (selectedNote) {
            selectedNote.text = newNoteText;
            // Оновлення файлу notes.json
            await fs.writeFile(notesJsonPath, JSON.stringify(notesJson),'utf8');
            res.status(200).send('Note updated successfully!');
        } else {
            res.status(404).send('Note not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /notes/:noteName
app.delete('/notes/:noteName', async (req, res) => {
  try {
    const noteName = req.params.noteName;

    const notesJsonData = await fs.readFile(notesJsonPath, 'utf-8');
    const notesJson = JSON.parse(notesJsonData);


    // Пошук нотатки за ім'ям
    const selectedNoteIndex = notesJson.findIndex((note) => note.name === noteName);

    if (selectedNoteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Видалення нотатки
    notesJson.splice(selectedNoteIndex, 1);

    // Оновлення файлу package.json
    await fs.writeFile(notesJsonPath, JSON.stringify(notesJson, null, 2));

    res.status(200).send('Note deleted successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});