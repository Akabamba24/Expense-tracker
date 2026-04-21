const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Links this expense to the User model
        },
        text: {
            type: String,
            required: [true, 'Please add a description'],
        },
        amount: {
            type: Number,
            required: [true, 'Please add an amount'],
        },
        category: {
            type: String,
            required: [true, 'Please select a category'],
            enum: ['Food', 'Rent', 'Transport', 'Entertainment', 'Utilities', 'Business Expense', 'Other'],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Expense', expenseSchema);
