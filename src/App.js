import express from "express";
import cors from "cors";
import morgan from "morgan";
import ConnectionDb from "./config/ConnectionDB.js";
import Envs from "./utils/Envs.js";
import Cartroute from "./routes/Cartroute.js";
import Whichlistroute from "./routes/Whichlistroute.js";
import startGrpcServer from "./grpc/grpcServer.js";


const app = express();
const PORT = Envs.PORT;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());
app.use(morgan("dev"));


// routes 
app.use("/api/auth/v3", Cartroute);
app.use("/api/auth/v3", Whichlistroute);


ConnectionDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Cart service is running http://localhost:${PORT}`)
    })
    // gRPC server (used by the payment / order service)
    startGrpcServer();
}) // reload

    .catch((error) => {
        console.log("cart service failed to start")
        process.exit(1);
    })