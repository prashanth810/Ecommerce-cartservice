import dotenv from "dotenv";

dotenv.config();

const env = process.env;

const Envs = {
    PORT: env.PORT,
    MONGO_URL: env.MONGO_URL,
    JWT_SECRET: env.JWT_SECRET,
    GRPC_PORT: env.GRPC_PORT || 3002,
    INTERNAL_GRPC_KEY: env.INTERNAL_GRPC_KEY,
    PRODUCT_GRPC_URL: env.PRODUCT_GRPC_URL,
    // HTTP base URL of the Product service (used as fallback when gRPC is unreachable)
    PRODUCT_SERVICE_URL: env.PRODUCT_SERVICE_URL,
};

export default Envs;