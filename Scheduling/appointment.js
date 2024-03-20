const Provider = require('./provider');
const mongoose = require('mongoose'); // Assuming Mongoose for database interactions

// Add validation library (e.g., Joi)
const Joi = require('joi');

async function bookAppointment(urgencyLevel, specialization, patientName) {
  // Validate input parameters
  const schema = Joi.object({
    urgencyLevel: Joi.string().valid('red', 'orange', 'green').required(),
    specialization: Joi.string().required(),
    patientName: Joi.string().required(),
  });
  const validationResult = schema.validate({ urgencyLevel, specialization, patientName });
  if (validationResult.error) {
    throw new Error(validationResult.error.details[0].message);
  }

  try {
    const doctors = await Provider.find({ specialization });
    if (!doctors || doctors.length === 0) {
      throw new Error('No doctors available for the specified specialization');
    }

    if (urgencyLevel === 'red') {
      const fastestAppointment = await findFastestAppointment(doctors);
      if (!fastestAppointment) {
        return { error: 'No appointments available for the specified specialization' };
      }
      const appointmentTime = fastestAppointment.time;
      const doctorDetails = fastestAppointment.doctor;
      const bookedAppointment = await bookSelectedAppointment(doctorDetails._id, appointmentTime, patientName);
      return { appointmentTime, doctorDetails, bookedAppointment };
    } else {
      const availableSlots = findAvailableSlots(doctors);
      return availableSlots;
    }
  } catch (error) {
    throw new Error('Error booking appointment: ' + error.message);
  }
}

async function findFastestAppointment(doctors) {
  let fastestAppointment = null;
  let fastestTime = Infinity;

  for (const doctor of doctors) {
    for (const slot of doctor.availability) {
      const slotTime = new Date(slot).getTime();
      if (slotTime < fastestTime) {
        fastestTime = slotTime;
        fastestAppointment = { time: slot, doctor };
      }
    }
  }

  return fastestAppointment;
}

function findAvailableSlots(doctors) {
  const availableSlots = [];

  for (const doctor of doctors) {
    const doctorSlots = doctor.availability.map(slot => new Date(slot));
    availableSlots.push({
      doctor: {
        id: doctor._id,
        name: doctor.doctorName,
        specialization: doctor.specialization,
      },
      slots: doctorSlots,
    });
  }

  return availableSlots;
}

async function bookSelectedAppointment(doctorId, appointmentDateTime, patientName) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const filter = { _id: doctorId };
    const update = { $push: { appointments: { patientName, appointmentDateTime } } };
    const options = { session };

    const result = await Provider.findOneAndUpdate(filter, update, options);
    if (!result) {
      throw new Error('Doctor not found');
    }

    // Check availability within the transaction for consistency
    const isSlotAvailable = result.availability.some(slot => slot.getTime() === appointmentDateTime.getTime());
    if (!isSlotAvailable) {
      throw new Error('Appointment slot is not available');
    }

    await session.commitTransaction();
    session.endSession();

    return { appointmentDateTime, doctorId };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error('Error booking appointment: ' + error.message);
  }
}

module.exports = {
  bookAppointment,
};
