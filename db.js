const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
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

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const mongoURI = "mongodb+srv://admin:admin@cluster0.yntaf1q.mongodb.net/carservicedb?retryWrites=true&w=majority";
mongoose.connect(mongoURI);

// SCHEMAS

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
  props: [String],
  description: String,
  city: String,
  imagePath: String
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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//  USERS/LOGIN/REGSITER

app.get('/carservicedb/users', async (req, res) => {
  try {
    const users = await Users.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd pobierania użytkowników' });
  }
});

app.post('/carservicedb/users', async (req, res) => {
  const { name, lastname, email, password, type } = req.body;

  // Check if the user already exists
  const existingUser = await Users.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = new Users({
    name,
    lastname,
    email,
    password,
    type
  });

  try {
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
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

//  SERVICES

app.get('/carservicedb/services', async (req, res) => {
  let query = {};
  if (req.query.city) {
    query.city = req.query.city;
  }
  try {
    const services = await Services.find(query, 'name description props city imagePath');
    res.json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Error fetching services' });
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

app.get('/carservicedb/cities', async (req, res) => {
  try {
    const cities = await Services.distinct("city");
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ message: 'Error fetching cities' });
  }
});

app.post('/carservicedb/addServices', upload.single('image'), async (req, res) => {
  const { name, props, description, city } = req.body;
  const propsArray = JSON.parse(props);
  let imagePath = '';

  if (req.file) {
    const filename = `service-${Date.now()}.jpg`;
    imagePath = `/uploads/${filename}`;

    await sharp(req.file.buffer)
      .resize(1024)
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, imagePath));
  }

  try {
    const newService = new Services({ name, props: propsArray, description, city, imagePath });
    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).send('Error adding service');
  }
});

app.delete('/carservicedb/deleteServices/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Services.findByIdAndDelete(serviceId);

    if (service) {
      // Delete the image file from the uploads folder
      if (service.imagePath) {
        const imagePath = path.join(__dirname, service.imagePath);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error('Error deleting image file:', err);
          } else {
            console.log('Image file deleted successfully');
          }
        });
      }
      res.status(200).json({ message: 'Service deleted successfully' });
    } else {
      res.status(404).send('Service not found');
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).send('Error deleting service');
  }
});

//  RESERVATIONS

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

app.get('/carservicedb/reservations/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const reservations = await Reservation.find({ userId: userId });
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
});

app.delete('/carservicedb/cancelReservation/:id', async (req, res) => {
  try{
  const reservationId = req.params.id; 
  const reservation = await Reservation.findByIdAndDelete(reservationId);

    if(reservation){
      res.status(200).json({message: "Reservation cancelled succefully"})
    }else{
      res.status(404).json({message: "Reservation not found"})
    }
  }
  catch(error){
    console.log("Error while cancelling: ", error)
    res.status(500).json({message:'Error cancelling reservation'})
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
