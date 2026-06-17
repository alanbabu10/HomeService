const mongoose = require("mongoose");

const cmsSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: "Find Professional Home Services Nearby",
    },
    heroSubtitle: {
      type: String,
      default: "Instant bookings, verified handymen, and top-tier support at your fingertips.",
    },
    aboutUs: {
      type: String,
      default: "We connect trusted local service providers with homeowners who need quick and reliable assistance.",
    },
    contactEmail: {
      type: String,
      default: "support@homeservice.com",
    },
    contactPhone: {
      type: String,
      default: "+1 (555) 019-2834",
    },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("CmsContent", cmsSchema);
