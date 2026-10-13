import mongoose from "mongoose";

const WhichlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            weight: {
                type: String,
                required: true,
            },
            quantity: {
                type: Number,
                default: 1,
            }
        }
    ]


}, { timestamps: true, minimize: false });

const WhichlistModel = mongoose.model("Whichlist", WhichlistSchema);

export default WhichlistModel;