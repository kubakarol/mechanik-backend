const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const secretKey = 'lalala123';

const app = express();
const port = 5500;

app.use(bodyParser.json());
const corsOptions = {
  origin: 'http://localhost:5173', 
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

const mongoURI = "mongodb+srv://admin:admin@cluster0.yntaf1q.mongodb.net/carservicedb?retryWrites=true&w=majority";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schematy i modele Mongoose
const userSchema = new mongoose.Schema({
  name: String,
  lastname: String,
  email: String,
  password: String,
  type: Number,
});
const Users = mongoose.model('Users', userSchema);

const serviceSchema = new mongoose.Schema({
  name: String,
  props: String,
  description: String,
});
const Services = mongoose.model('Services', serviceSchema);

const reservationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  userName: String,
  userLastname: String,
  serviceName: String,
  reservationDate: Date,
  reservationDetails: String,
});
const Reservation = mongoose.model('Reservations', reservationSchema);

// Endpoints API
app.get('/carservicedb/users', async (req, res) => {
  try {
    const users = await Users.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd pobierania użytkowników' });
  }
});

app.get('/carservicedb/services', async (req, res) => {
  try {
    const services = await Services.find({}, 'name description props id');
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd pobierania usług' });
  }
});

app.get('/carservicedb/services/:id', async (req, res) => {
  try {
    const service = await Services.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Usługa nie została znaleziona' });
    }
    res.json(service);
  } catch (err) {
    console.error('Błąd pobierania usługi:', err);
    res.status(500).json({ message: 'Wystąpił błąd podczas pobierania usługi' });
  }
});

app.post('/carservicedb/login', async (req, res) => {
  const { email, password } = req.body;
  try {
      const user = await Users.findOne({ email, password });
      if (!user) {
          return res.status(404).json({ message: 'Nieprawidłowy email lub hasło.' });
      }
      const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
      res.json({ user: user, token: token });
  } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Błąd logowania.' });
  }
});

app.get('/carservicedb/currentUser', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);
    const user = await Users.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
    }
    res.json(user);
  } catch (error) {
    console.error('Błąd pobierania danych użytkownika:', error);
    res.status(500).json({ message: 'Błąd pobierania danych użytkownika', error: error.message });
  }
});


app.post('/carservicedb/reservations', async (req, res) => {
  try {
    const { userId, userName, userLastname, serviceName, reservationDate, reservationDetails } = req.body;
    const reservation = new Reservation({
      userId,
      userName,
      userLastname,
      serviceName,
      reservationDate,
      reservationDetails,
    });
    await reservation.save();
    res.status(201).json({ message: 'Rezerwacja została dodana' });
  } catch (error) {
    console.error('Błąd rezerwacji:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas dodawania rezerwacji' });
  }
});

app.post('/carservicedb/users', async (req, res) => {
  const { name, lastname, email, password } = req.body;
  const newUser = new Users({
    name,
    lastname,
    email,
    password,
  });

  try {
    const savedUser = await newUser.save();
    res.json(savedUser);
  } catch (error) {
    console.error('Błąd dodawania użytkownika:', error);
    res.status(500).json({ message: 'Błąd dodawania użytkownika' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});