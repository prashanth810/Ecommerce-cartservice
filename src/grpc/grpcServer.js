import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import CartModel from "../models/CartModel.js";
import Envs from "../utils/Envs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cartProto = grpc.loadPackageDefinition(
    protoLoader.loadSync(path.join(__dirname, "./cart.proto"), {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    })
).cart;

// only services that know the shared key can call this server
const isAllowed = (call) => {
    const key = call?.metadata?.get("x-internal-key")?.[0];
    return Boolean(key && key === Envs.INTERNAL_GRPC_KEY);
};

const GetCartItems = async (call, callback) => {
    if (!isAllowed(call)) {
        return callback({ code: grpc.status.UNAUTHENTICATED, message: "Not allowed" });
    }

    try {
        const { userId } = call.request;

        if (!mongoose.isValidObjectId(userId)) {
            return callback(null, { success: true, message: "Cart is empty", items: [] });
        }

        // one cart document per user, with an items[] array
        const cart = await CartModel.findOne({ userId }).lean();

        const items = (cart?.items || [])
            .map((item) => ({
                productId: String(item.productId),
                weight: item.weight || "",
                quantity: Number(item.quantity) || 0,
                name: item.name || "",
                image: item.image || "",
            }))
            .filter((item) => item.productId && item.quantity > 0);

        return callback(null, { success: true, message: "Cart items", items });
    } catch (error) {
        return callback({ code: grpc.status.INTERNAL, message: error.message });
    }
};

const ClearCart = async (call, callback) => {
    if (!isAllowed(call)) {
        return callback({ code: grpc.status.UNAUTHENTICATED, message: "Not allowed" });
    }

    try {
        const { userId } = call.request;

        if (!mongoose.isValidObjectId(userId)) {
            return callback(null, { success: true, message: "Cart cleared" });
        }

        await CartModel.deleteOne({ userId });

        return callback(null, { success: true, message: "Cart cleared" });
    } catch (error) {
        return callback({ code: grpc.status.INTERNAL, message: error.message });
    }
};

const startGrpcServer = () => {
    const server = new grpc.Server();
    server.addService(cartProto.CartService.service, { GetCartItems, ClearCart });

    server.bindAsync(`0.0.0.0:${Envs.GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (error) => {
        if (error) {
            console.error("Cart gRPC failed to start:", error.message);
            return;
        }
        console.log(`Cart gRPC server running on ${Envs.GRPC_PORT}`);
    });
};

export default startGrpcServer;