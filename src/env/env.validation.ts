import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { DotEnv } from "./env.dto";

export function validateEnv (config: Record<string, unknown>) {
    const validatedConfig = plainToClass(
        DotEnv,
        config,
        { enableImplicitConversion: true },
    );
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  
    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}