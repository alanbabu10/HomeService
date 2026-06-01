const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  subTotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  pdfUrl: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
