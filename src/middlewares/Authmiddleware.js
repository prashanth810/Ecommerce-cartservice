import Envs from "../utils/Envs.js";
import jwt from "jsonwebtoken";


const Authmiddleware = (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided !!!" });
        }

        const decode = jwt.verify(token, Envs.JWT_SECRET);

        const user = decode;
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }

}

export default Authmiddleware;