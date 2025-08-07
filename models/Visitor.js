const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  type: { type: String, required: true },
  full_name: { type: String },
  visitor_name: { type: String },
  cnic: { type: String },
  visitor_cnic: { type: String },
  email: { type: String },
  phone: { type: String },
  visitor_phone: { type: String },
  host: { type: String, required: true },
  purpose: { type: String, required: true },
  entry_time: { type: Date },
  timestamp: { type: Date },
  exit_time: { type: Date },
  is_group_visit: { type: Boolean, default: false },
  group_id: { type: String },
  total_members: { type: Number },
  group_members: [{ type: String }]
}, {
  timestamps: true
});

// Virtual field for combined name
visitorSchema.virtual('name').get(function() {
  return this.full_name || this.visitor_name || 'Unknown';
});

// Virtual field for combined CNIC
visitorSchema.virtual('combinedCNIC').get(function() {
  return this.cnic || this.visitor_cnic || 'Not provided';
});

// Virtual field for combined phone
visitorSchema.virtual('combinedPhone').get(function() {
  return this.phone || this.visitor_phone || 'Not provided';
});

// Virtual field for entry time
visitorSchema.virtual('entryTime').get(function() {
  return this.entry_time || this.timestamp;
});

module.exports = mongoose.model('Visitor', visitorSchema);
