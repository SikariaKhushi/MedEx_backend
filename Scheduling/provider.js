// provider.js
const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
    doctorID: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    doctorName: { type: String, required: true },
    specialization: { type: String, required: true },
    workingHours: {
        start: { type: String, required: true },
        end: { type: String, required: true }
    },
    availability: { type: [Date], default: [] }, // Array of available time slots
    appointments: [{ 
        patientName: { type: String, required: true },
        appointmentDate: { type: Date, required: true }
    }]  // Array of booked appointments
});

const Provider = mongoose.model('Provider', providerSchema);

module.exports = Provider;
