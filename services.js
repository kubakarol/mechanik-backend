const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

const mongoURI =
  "mongodb+srv://admin:admin@cluster0.yntaf1q.mongodb.net/carservicedb?retryWrites=true&w=majority";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });


const serviceSchema = new mongoose.Schema({
   name: String,
   props: String,
  });
  const Services = mongoose.model('Services', serviceSchema);

  app.get('/carservicedb/services', async (req, res) => {
    try {
      const services = await Services.find();
      res.json(ser);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Błąd pobierania users' });
    }
  });