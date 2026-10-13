import mongoose from "mongoose";
import Envs from "../utils/Envs.js";

const mongo_url = Envs.MONGO_URL;

const ConnectionDb = async () => {
    try {
        await mongoose.connect(mongo_url);
        console.log("cart db connected successfully !!!");
    }
    catch (error) {
        console.log(error.message)
    }
}

export default ConnectionDb;