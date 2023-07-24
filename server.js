const cors = require("cors");
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const port = 3001; // Ganti dengan port yang Anda inginkan
mongoose.connect('mongodb://127.0.0.1/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Schema = mongoose.Schema;
const mahasiswaSchema = new Schema({
  nim: String,
  name: String,
  birthdate: Date,
  departemen: String
});
const loginSchema = new Schema({
  username: String,
  password: String
});
const mahasiswaModel = mongoose.model('Mahasiswa', mahasiswaSchema);
const loginModel = mongoose.model('Login', loginSchema);

let products = ['tt', 'ii'];

// Menggunakan middleware bodyParser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "*" }));

app.get('/mahasiswa', async (req, res) => {
  const mahasiswa = await mahasiswaModel.find();
  res.json(mahasiswa);
});

app.get('/mahasiswa/:nim', async (req, res) => {
  const nim = req.params.nim;
  const mahasiswa = await mahasiswaModel.find({ _id: nim });
  if (mahasiswa) {
    res.json(mahasiswa);
  } else {
    res.status(404).json({ error: 'Mahasiswa tidak ada!' });
  }
});

app.post('/mahasiswa', async (req, res) => {
  const newMahasiswa = new mahasiswaModel(req.body);
  await newMahasiswa.save();
  res.json(newMahasiswa);
});

// Update data by NIM
app.put('/mahasiswa/:nim', async (req, res) => {
  const { nim } = req.params;
  const newMahasiswa = req.body;

  try {
    const updatedData = await mahasiswaModel.findOneAndUpdate({ _id: nim }, newMahasiswa, { new: true });
    res.json(updatedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data' });
  }
});

app.delete('/mahasiswa/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    await mahasiswaModel.findOneAndDelete({ _id: id });
    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus data' });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if username is already taken
    const existingUser = await loginModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new loginModel({ username, password: hashedPassword });
    const savedUser = await newUser.save();

    res.json(savedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan data registrasi' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await loginModel.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create and sign a JWT token
    const token = jwt.sign({ id: user._id, username: user.username }, 'secret-key');

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan saat melakukan login' });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split('2000')[1];

  if (token == null) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  jwt.verify(token, 'secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  });
}

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected resource accessed successfully' });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
