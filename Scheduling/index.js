const express = require('express');
const mongoose = require('mongoose');
const Provider = require('./provider');
const { bookAppointment } = require('./appointment');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://khushisikaria2022:%23iamgroot1508@cluster0.skia7n6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

app.use(express.json());

// Endpoint to book appointment
app.post('/bookAppointment', async (req, res) => {
    console.log('Received request to book appointment:', req.body);
    const { specialization, urgencyLevel } = req.body;

    try {
        const appointmentResult = await bookAppointment(urgencyLevel, specialization);
        res.json(appointmentResult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use(express.static('public')); // Serve static files from 'public' directory

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
