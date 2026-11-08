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

// gRPC path — only used when PRODUCT_GRPC_URL is set (local / same network).
// On Render this env is normally empty, so we skip gRPC and go straight to HTTP.
const getsingleproductGrpc = async (productId) => {
    if (!Envs.PRODUCT_GRPC_URL) return null;
    try {
        const client = getProductClient();
        const response = await callGrpc(client, "GetProductById", { productId: String(productId) });
        return response?.success ? response.data : null;
    } catch (error) {
        console.error("Cartservice gRPC GetProductById error:", error.message);
        return null;
    }
};

// HTTP path — used on Render (each service is a separate deployment).
// Returns the normalized product, or null ONLY when the product really doesn't exist (404).
// Throws when the product service is misconfigured / down, so the real reason is visible
// instead of a misleading "Product not found".
const getsingleproductHttp = async (productId) => {
    const baseUrl = (Envs.PRODUCT_SERVICE_URL || "").trim().replace(/\/+$/, "");
    if (!baseUrl) {
        throw new Error("PRODUCT_SERVICE_URL is not set on the cart service (Render > Environment)");
    }

    const apiPath = process.env.PRODUCT_API_PATH || "/api/auth/v2/product";
    const url = `${baseUrl}${apiPath}/${productId}`;

    let lastError;
    // Render free instances sleep -> first call can take 30-60s, so long timeout + 1 retry
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const { data } = await axios.get(url, { timeout: 60000 });

            // support { data: {...} } | { product: {...} } | { data: { product: {...} } }
            const p = data?.data?.product || data?.data || data?.product;
            if (!data?.success || !p) return null;

            const variants = (p.variants || []).map((v) => ({
                weight: v.weight || "",
                original_price: String(v.original_price ?? ""),
                selling_price: String(v.selling_price ?? ""),
                discount_price: String(v.discount_price ?? ""),
                stock: Number(v.stock ?? v.stock_quantity ?? 0),
                stock_quantity: Number(v.stock_quantity ?? v.stock ?? 0),
            }));

            return {
                id: String(p._id || p.id || productId),
                name: p.name || "",
                description: p.description || "",
                thumbnail: p.thumbnail || "",
                images: Array.isArray(p.images) ? p.images : [],
                variants,
                is_active: p.is_active !== false,
            };
        } catch (error) {
            const status = error.response?.status;
            console.error(`Cartservice HTTP GetProductById attempt ${attempt} failed: ${url} ->`, status || error.code || error.message);

            if (status === 404) return null;   // product genuinely not found
            lastError = error;
        }
    }

    throw new Error(
        `Product service unreachable (${lastError?.response?.status || lastError?.code || lastError?.message}) at ${url}`
    );
};

// Try gRPC first only if configured, otherwise (or if it returns nothing) use HTTP.
const getsingleproduct = async (productId) => {
    const product = await getsingleproductGrpc(productId);
    if (product) return product;
    return getsingleproductHttp(productId);
};

export { getsingleproduct };