import WhichlistModel from "../models/WhichlistModel.js";
import { getsingleproduct } from "../grpc/grpchelper.js";

// add product in which list
const createwhichlist = async (req, res) => {
    const { productId, weight, quantity = 1 } = req.body;
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized! Please login." });
        }

        if (!productId || productId.trim() === "") {
            return res.status(400).json({ success: false, message: "Product ID is required !!!" });
        }

        if (!weight || weight.trim() === "") {
            return res.status(400).json({ success: false, message: "Weight is required !!!" });
        }

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
        }

        const product = await getsingleproduct(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found !!!" });
        }

        const variant = product.variants.find((item) => item.weight === weight);
        if (!variant) {
            return res.status(400).json({ success: false, message: `Weight ${weight} not available for this product!` });
        }

        let wishlist = await WhichlistModel.findOne({ userId });

        if (!wishlist) {
            wishlist = new WhichlistModel({ userId, items: [] });
        }

        const existingItem = wishlist.items.find(
            (item) => item.productId.toString() === productId && item.weight === weight
        );

        if (existingItem) {
            existingItem.quantity += Number(quantity);
        } else {
            wishlist.items.push({
                productId,
                weight,
                quantity: Number(quantity),
            });
        }

        await wishlist.save();

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist successfully",
            data: wishlist,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// remove product from wishlist
const removewhichlist = async (req, res) => {
    const { productId, weight } = req.body;
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized! Please login." });
        }

        if (!productId || productId.trim() === "") {
            return res.status(400).json({ success: false, message: "Product ID is required !!!" });
        }

        if (!weight || weight.trim() === "") {
            return res.status(400).json({ success: false, message: "Weight is required !!!" });
        }

        // Step 1: quantity is more than 1, so decrease by 1
        let wishlist = await WhichlistModel.findOneAndUpdate(
            { userId, items: { $elemMatch: { productId, weight, quantity: { $gt: 1 } } } },
            { $inc: { "items.$.quantity": -1 } },
            { new: true }
        );

        if (wishlist) {
            return res.status(200).json({
                success: true,
                message: "Quantity decreased by 1",
                data: wishlist,
            });
        }

        // Step 2: quantity is 1 (or less), so remove the item completely
        wishlist = await WhichlistModel.findOneAndUpdate(
            { userId, items: { $elemMatch: { productId, weight } } },
            { $pull: { items: { productId, weight } } },
            { new: true }
        );

        if (!wishlist) {
            return res.status(404).json({ success: false, message: "Product is not available in wishlist !!!" });
        }

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist successfully",
            data: wishlist,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// get all items from which list
const getallitems = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized! Please login." });
        }

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10)); // default 10, max 50
        const skip = (page - 1) * limit;

        const wishlist = await WhichlistModel.findOne({ userId });

        const allItems = wishlist?.items || [];
        const totalItems = allItems.length;
        const totalPages = Math.ceil(totalItems / limit);
        const items = allItems.slice(skip, skip + limit);

        return res.status(200).json({
            success: true,
            message: totalItems ? "Wishlist found" : "Wishlist is empty",
            data: items,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// remove specific item from wish list
const clearfromwishlist = async (req, res) => {
    const { productId, weight } = req.body;
    const user = req.user?.id;
    try {
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized! user not found" });
        }

        if (!productId || productId.trim() === "") {
            return res.status(400).json({ success: false, message: "product is required !!!" });
        }

        if (!weight || weight.trim() === "") {
            return res.status(400).json({ success: false, message: "weight is required !!!" });
        }

        const wishlist = await WhichlistModel.findOneAndUpdate(
            { userId: user, items: { $elemMatch: { productId, weight } } },
            { $pull: { items: { productId, weight } } },
            { new: true }
        );

        if (!wishlist) {
            return res.status(404).json({ success: false, message: "product is not found in wishlist !!!" });
        }

        return res.status(200).json({
            success: true,
            message: "product removed from wishlist",
            data: wishlist,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export { createwhichlist, removewhichlist, getallitems, clearfromwishlist };
