import express from 'express';
import Authmiddleware from '../middlewares/Authmiddleware.js';
import { Addtocart, Getallcartdata, getmycartdata, Removecart, Clearitem } from '../controllers/Cartcontroller.js';
import Ratelimit from '../models/Ratelimit.js';


const Cartroute = express.Router();

// product add from cart
Cartroute.post("/cart/addtocart",
    Ratelimit(
        60 * 1000,      // 1 minute window
        20,              // 5 attempts
        5 * 60 * 1000   // 5 minute cooldown
    ), Authmiddleware, Addtocart);

// product remove from cart
Cartroute.post("/cart/remove", Ratelimit(
    60 * 1000,      // 1 minute window
    20,              // 5 attempts
    5 * 60 * 1000   // 5 minute cooldown
), Authmiddleware, Removecart);

// in count of product
// Cartroute.post("/cart/incquantity", Authmiddleware, incresequantity);

// get all cart items
Cartroute.get("/cart/all", Ratelimit(
    60 * 1000,      // 1 minute window
    30,              // 5 attempts
    5 * 60 * 1000   // 5 minute cooldown
), Authmiddleware, Getallcartdata);

// get my cart data
Cartroute.get("/cart/mycart/:userId", Ratelimit(
    60 * 1000,      // 1 minute window
    30,              // 5 attempts
    5 * 60 * 1000   // 5 minute cooldown
), Authmiddleware, getmycartdata);

// clear cart selected items
Cartroute.delete("/cart/clear/:productId", Ratelimit(
    60 * 1000,      // 1 minute window
    3,              // 5 attempts
    5 * 60 * 1000   // 5 minute cooldown
), Authmiddleware, Clearitem)

export default Cartroute;