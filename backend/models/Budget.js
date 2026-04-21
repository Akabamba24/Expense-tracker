const mongoose = require('mongoose');

const budgetSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        monthKey: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: [true, 'Please add a monthly budget amount'],
            min: [0, 'Budget must be zero or greater'],
        },
    },
    {
        timestamps: true,
    }
);

budgetSchema.index({ user: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
