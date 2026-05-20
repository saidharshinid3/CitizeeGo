const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    required: true,
  },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Emergency'],
    default: 'Low',
  },

  status: {
  type: String,
  enum: [
    'Pending',
    'Assigned',
    'In Progress',
    'Completed',
    'Resolved',
    'Emergency',
    'Completed (Needs Proof)'
  ],
  default: 'Pending'
},

  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  workerRemarks: {
  type: String
},

image: {
  type: String,
  default: ''
},

completionProof: {
  type: String
},

}, {

  timestamps: true,

});
module.exports = mongoose.model(
  'Complaint',
  complaintSchema
);