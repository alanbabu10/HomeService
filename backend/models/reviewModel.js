const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  }
}, { timestamps: true });

// After saving a review, we can automatically calculate the handyman's new average rating.
reviewSchema.post("save", async function() {
  const Employee = mongoose.model("Employee");
  const stats = await this.constructor.aggregate([
    { $match: { employee: this.employee } },
    {
      $group: {
        _id: "$employee",
        avgRating: { $avg: "$rating" }
      }
    }
  ]);

  if (stats.length > 0) {
    await Employee.findByIdAndUpdate(this.employee, {
      rating: Math.round(stats[0].avgRating * 10) / 10
    });
  }
});

module.exports = mongoose.model("Review", reviewSchema);
