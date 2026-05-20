const express = require('express');

const router = express.Router();

const Complaint = require('../models/complaint');

const User = require('../models/User');

const { protect } = require('../middleware/authMiddleware');


// ======================================
// CREATE COMPLAINT
// ======================================

router.post('/', protect, async (req, res) => {

  try {

    const {
      title,
      description,
      category,
      priority,
      image
    } = req.body;

    const complaint = new Complaint({

      user: req.user._id,

      title,
      description,
      category,
      priority,
      image,

      status: 'Pending'

    });

    const savedComplaint = await complaint.save();
    const io = req.app.get('io');

io.emit('emergencyComplaint', {
  message: '🚨 Emergency complaint received!',
  complaint: savedComplaint
});

    res.status(201).json(savedComplaint);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// GET COMPLAINTS
// ======================================

router.get('/', protect, async (req, res) => {

  try {

    let complaints;

    // ADMIN -> SEE ALL COMPLAINTS

    if (req.user.role === 'admin') {

      complaints = await Complaint.find()
        .populate('user', 'name email')
        .populate('assignedWorker', 'name email');

    }

    // WORKER -> SEE ASSIGNED TASKS

    else if (req.user.role === 'worker') {

      complaints = await Complaint.find({
        assignedWorker: req.user._id
      })
      .populate('user', 'name email');

    }

    // CITIZEN -> SEE OWN COMPLAINTS

    else {

      complaints = await Complaint.find({
        user: req.user._id
      });

    }

    res.json(complaints);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// ASSIGN WORKER
// ======================================

router.put('/:id/assign', protect, async (req, res) => {

  try {

    // ONLY ADMIN

    if (req.user.role !== 'admin') {

      return res.status(401).json({
        message: 'Admin only'
      });

    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {

      return res.status(404).json({
        message: 'Complaint not found'
      });

    }

    complaint.assignedWorker = req.body.workerId;

    complaint.status = 'In Progress';

    await complaint.save();

    res.json({
      message: 'Worker assigned successfully'
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// UPDATE STATUS
// ======================================

router.put('/:id', protect, async (req, res) => {

  try {

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {

      return res.status(404).json({
        message: 'Complaint not found'
      });

    }

    complaint.status =
      req.body.status || complaint.status;
    complaint.workerRemarks =
      req.body.workerRemarks || complaint.workerRemarks;
    complaint.completionProof =
      req.body.completionProof || complaint.completionProof;

    const updatedComplaint =
      await complaint.save();

    res.json(updatedComplaint);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// DELETE COMPLAINT
// ======================================

router.delete('/:id', protect, async (req, res) => {

  try {

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {

      return res.status(404).json({
        message: 'Complaint not found'
      });

    }

    await complaint.deleteOne();

    res.json({
      message: 'Complaint removed'
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

module.exports = router;