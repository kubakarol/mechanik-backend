const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5500;

app.use(bodyParser.json());
app.use(cors());

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

// Dodaj trasę dla obecnego użytkownika (zakładam pierwszego znalezionego użytkownika)
app.get('/carservicedb/currentUser', async (req, res) => {
  try {
    const user = await Users.findOne(); // Pobiera pierwszego użytkownika
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
    }
    res.json(user);
  } catch (err) {
    console.error('Błąd pobierania użytkownika:', err);
    res.status(500).json({ message: 'Błąd pobierania danych użytkownika' });
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
