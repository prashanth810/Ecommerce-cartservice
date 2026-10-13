import express from 'express';
import Authmiddleware from '../middlewares/Authmiddleware.js';
import { clearfromwishlist, createwhichlist, getallitems, removewhichlist } from '../controllers/Whichlistcontroller.js';

const Whichlistroute = express.Router();

// Add product to wishlist
Whichlistroute.post("/wishlist/add", Authmiddleware, createwhichlist);

// remove whachlist 
Whichlistroute.delete("/wishlist/remove", Authmiddleware, removewhichlist);

// bet all items from which list 
Whichlistroute.get("/wishlist/list", Authmiddleware, getallitems);

// delete itsm from wishlist
Whichlistroute.delete("/wishlist/delete", Authmiddleware, clearfromwishlist);

export default Whichlistroute;
