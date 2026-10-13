import mongoose, { Mongoose } from "mongoose";

const CartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            weight: {
                type: String,
                required: true,
            },
            original_price: {
                type: Number,
                required: true,
            },
            selling_price: {
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: 1,
            },
        }
    ],
    total_ammount: {
        type: Number,
        default: 0,
    },
}, { timestamps: true, minimize: false });

const CartModel = mongoose.model("Cart", CartSchema);

export default CartModel;