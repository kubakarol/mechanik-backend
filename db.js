const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
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
        const services = await Services.find({}, 'name description props city imagePath');
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

app.post('/carservicedb/addServices', upload.single('image'), async (req, res) => {
    const { name, props, description, city } = req.body;
    const propsArray = JSON.parse(props); // Parse props as they are sent as JSON string
    const imagePath = req.file ? req.file.path : '';
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
        const deletedService = await Services.findByIdAndDelete(serviceId);
        if (deletedService) {
            res.status(200).json({ message: 'Service deleted successfully' });
        } else {
            res.status(404).send('Service not found');
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).send('Error deleting service');
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
