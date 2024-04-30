const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Int32 } = require('bson');

const app = express();
const port = 5500;

app.use(bodyParser.json());
app.use(cors());

const mongoURI =
  "mongodb+srv://admin:admin@cluster0.yntaf1q.mongodb.net/carservicedb?retryWrites=true&w=majority";
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
    props: String,
   });
   
  const Services = mongoose.model('Services', serviceSchema);
  
  app.get('/carservicedb/users', async (req, res) => {
    try {
      const users = await Users.find();
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Błąd pobierania users' });
    }
  });
  
  app.get('/carservicedb/services', async (req, res) => {
    try {
      const services = await Services.find();
      res.json(services);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Błąd pobierania users' });
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
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Error adding user' });
      }
    });
   
     
    

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });