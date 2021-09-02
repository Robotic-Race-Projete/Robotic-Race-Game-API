import { validateEnv } from "./env.validation";

const env = validateEnv(process.env)
export default env;