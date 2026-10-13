import { getsingleproduct } from "../grpc/grpchelper.js";
import CartModel from "../models/CartModel.js";

// add to cart
const Addtocart = async (req, res) => {
    const { productId, name, weight, quantity = 1 } = req.body;
    try {
        const userId = req.user?.id;

        if (!name || name.trim() === "") {
            return res.status(400).json({ success: false, message: "Name is required !!!" });
        }
        if (!productId || productId.trim() === "") {
            return res.status(400).json({ success: false, message: "Product ID is required !!!" });
        }
        if (!weight) {
            return res.status(400).json({ success: false, message: "weight is required" });
        }
        if (quantity < 1) {
            return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
        }

        const product = await getsingleproduct(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found !!!" });
        }

        const productname = product.name;

        const variant = product.variants.find((item) => item.weight === weight);

        if (!variant) {
            return res.status(400).json({ success: false, message: `Weight ${weight} not available for this product!` });
        }

        if (variant.stock < quantity) {
            return res.status(400).json({ success: false, message: `Only ${variant.stock} items in stock for ${weight}!` });
        }

        let cart = await CartModel.findOne({ userId });

        if (!cart) {
            cart = new CartModel({ userId, items: [] });
        }

        const existingItem = cart.items.find(
            item => item.productId.toString() === productId && item.weight === weight
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        }
        else {
            cart.items.push({
                productId,
                name: productname,
                weight,
                quantity,
                original_price: variant.original_price,
                selling_price: variant.selling_price,
            });
        }

        // ✅ total_amount not total_ammount
        cart.total_ammount = cart.items.reduce(
            (total, item) => total + item.selling_price * item.quantity, 0
        );

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Product added to cart !!!",
            data: cart,
        })
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// remove to cart 
const Removecart = async (req, res) => {
    const { productId, weight } = req.body;
    try {
        const userId = req?.user?.id;

        if (!productId) {
            return res.status(400).json({ success: false, message: "Product id is required" })
        }

        if (!weight) {
            return res.status(400).json({ success: false, message: "Weight is required" });
        }

        let cart = await CartModel.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const itemexist = cart.items.find((item) => item.productId.toString() === productId && item.weight === weight);
        if (!itemexist) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        itemexist.quantity -= 1;

        if (itemexist.quantity === 0) {
            cart.items = cart.items.filter((item) => !(item.productId.toString() === productId && item.weight === weight));
        }

        // If cart has no items left, remove the document from DB
        if (cart.items.length === 0) {
            await CartModel.findByIdAndDelete(cart._id);
            return res.status(200).json({
                success: true,
                message: "Item removed and cart is now empty!",
                data: null,
                total: 0,
            });
        }

        cart.total_ammount = cart.items.reduce((total, item) => total + item.selling_price * item.quantity, 0);

        await cart.save();

        return res.status(200).json({
            success: true,
            message: itemexist.quantity === 0
                ? "Item removed from cart!"
                : `Quantity decreased! Remaining: ${itemexist.quantity}`,
            data: cart,
            total: cart.items.length,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// inc cart quantity onplay
// increase cart quantity
// const incresequantity = async (req, res) => {
//     const { productId, weight } = req.body;

//     try {
//         const userId = req.user?.id;

//         if (!userId) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Unauthorized! Please login."
//             });
//         }

//         if (!productId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Product ID is required"
//             });
//         }

//         if (!weight) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Weight is required"
//             });
//         }

//         // Find user's cart
//         const cart = await CartModel.findOne({ userId });

//         if (!cart) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Cart not found"
//             });
//         }

//         // Find the specific product + weight
//         const cartItem = cart.items.find(
//             (item) =>
//                 item.productId.toString() === productId.toString() &&
//                 item.weight === weight
//         );

//         if (!cartItem) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Item not found in cart"
//             });
//         }

//         // Get latest product information
//         const product = await getsingleproduct(productId);

//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product not found"
//             });
//         }

//         // Find selected variant
//         const variant = product.variants.find(
//             (item) => item.weight === weight
//         );

//         if (!variant) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Weight ${weight} not available for this product`
//             });
//         }

//         // Check stock before increasing
//         if (cartItem.quantity >= variant.stock) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Only ${variant.stock} items available in stock`
//             });
//         }

//         // Increase quantity
//         cartItem.quantity += 1;

//         // Recalculate total
//         cart.total_ammount = cart.items.reduce(
//             (total, item) =>
//                 total + item.selling_price * item.quantity,
//             0
//         );

//         await cart.save();

//         return res.status(200).json({
//             success: true,
//             message: "Quantity increased successfully",
//             data: cart,
//             total: cart.items.length,
//         });
//     }
//     catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// get all cart items
const Getallcartdata = async (req, res) => {
    try {
        const userId = req?.user?.id;

        const cart = await CartModel.findOne({ userId });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "YOur cart is empty !!!" });
        }

        return res.status(200).json({
            success: true,
            data: cart,
            total: cart.items.length,
        });

    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// get my cart data 
const getmycartdata = async (req, res) => {
    try {
        const userId = req.params.userId || req.user?.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const cart = await CartModel.findOne({ userId }).sort({ createdAt: -1 });

        if (!cart) {
            return res.status(400).json({ success: false, message: "Your Cart Is Empty !!!" });
        }

        return res.status(200).json({
            success: true,
            data: cart,
            total: cart.items ? cart.items.length : 0,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// clear selected item or full cart
const Clearitem = async (req, res) => {
    const productId = req.params?.productId || req.body?.productId || req.query?.productId;
    const weight = req.body?.weight || req.query?.weight;

    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized! Please login." });
        }

        const cart = await CartModel.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // If productId is provided, remove only that specific product (and matching weight if provided)
        if (productId) {
            const initialCount = cart.items.length;
            cart.items = cart.items.filter((item) => {
                if (weight) {
                    return !(item.productId.toString() === productId.toString() && item.weight === weight);
                }
                return item.productId.toString() !== productId.toString();
            });

            if (cart.items.length === initialCount) {
                return res.status(404).json({ success: false, message: "Item not found in cart" });
            }
        } else {
            // If no productId is passed at all, clear all items
            cart.items = [];
        }

        // If cart has no items left, delete the empty cart document from DB
        if (cart.items.length === 0) {
            await CartModel.findByIdAndDelete(cart._id);
            return res.status(200).json({
                success: true,
                message: "All items removed. Cart is now empty.",
                data: null,
                total: 0,
            });
        }

        // Recalculate total amount for remaining items
        cart.total_ammount = cart.items.reduce(
            (total, item) => total + item.selling_price * item.quantity,
            0
        );

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from cart successfully",
            data: cart,
            total: cart.items.length,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};



export { Addtocart, Removecart, Getallcartdata, getmycartdata, Clearitem };