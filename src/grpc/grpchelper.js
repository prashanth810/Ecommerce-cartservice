import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import Envs from "../utils/Envs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadProto = (file) =>
    grpc.loadPackageDefinition(
        protoLoader.loadSync(path.join(__dirname, file), {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        })
    );

let productClient;
const getProductClient = () => {
    if (!productClient) {
        const proto = loadProto("product.proto");
        productClient = new proto.product.ProductService(
            Envs.PRODUCT_GRPC_URL || "127.0.0.1:3001",
            grpc.credentials.createInsecure()
        );
    }
    return productClient;
};

const callGrpc = (client, method, payload) =>
    new Promise((resolve, reject) => {
        const metadata = new grpc.Metadata();
        metadata.set("x-internal-key", Envs.INTERNAL_GRPC_KEY || "");

        client[method](payload, metadata, { deadline: Date.now() + 5000 }, (error, response) => {
            if (error) return reject(error);
            resolve(response);
        });
    });

// gRPC path — works on localhost where both services share the same machine.
const getsingleproductGrpc = async (productId) => {
    try {
        const client = getProductClient();
        const response = await callGrpc(client, "GetProductById", { productId: String(productId) });
        return response?.success ? response.data : null;
    } catch (error) {
        console.error("Cartservice gRPC GetProductById error:", error.message);
        return null;
    }
};

// HTTP fallback — used when gRPC is unreachable (e.g. on Render where each service
// is a separate deployment and only the HTTP port is exposed).
// Normalizes the REST response to the same shape the gRPC path returns.
const getsingleproductHttp = async (productId) => {
    const baseUrl = Envs.PRODUCT_SERVICE_URL;
    if (!baseUrl) return null;

    try {
        const { data } = await axios.get(`${baseUrl}/api/auth/v2/product/${productId}`, {
            timeout: 8000,
        });

        if (!data?.success || !data?.data) return null;

        const p = data.data;
        const variants = (p.variants || []).map((v) => ({
            weight: v.weight || "",
            original_price: String(v.original_price ?? ""),
            selling_price: String(v.selling_price ?? ""),
            discount_price: String(v.discount_price ?? ""),
            stock: Number(v.stock ?? v.stock_quantity ?? 0),
            stock_quantity: Number(v.stock_quantity ?? v.stock ?? 0),
        }));

        return {
            id: String(p._id || p.id || ""),
            name: p.name || "",
            description: p.description || "",
            thumbnail: p.thumbnail || "",
            images: Array.isArray(p.images) ? p.images : [],
            variants,
            is_active: p.is_active !== false,
        };
    } catch (error) {
        console.error("Cartservice HTTP GetProductById error:", error.message);
        return null;
    }
};

// Try gRPC first (fast path for local dev). If it fails or returns null,
// fall back to the Product service's public REST endpoint (deployed env).
const getsingleproduct = async (productId) => {
    const product = await getsingleproductGrpc(productId);
    if (product) return product;
    return getsingleproductHttp(productId);
};

export { getsingleproduct };
