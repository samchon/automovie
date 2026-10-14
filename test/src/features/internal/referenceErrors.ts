import * as path from "node:path";

import { loadSourceModule } from "./loadSourceModule";

/** The refusal constructor consumed by local-command classification tests. */
interface ReferenceErrors {
  /** Construct the actual package refusal without replacing its class identity. */
  ReferenceError: new (
    code: string,
    message: string,
  ) => Error & { code: string };
}

/** Load the actual refusal constructor so the command's instanceof branch sees its own class. */
export const referenceErrors: ReferenceErrors = loadSourceModule<ReferenceErrors>(
  path.resolve(
    __dirname,
    "../../../../packages/mcp/src/internal/ReferenceError.ts",
  ),
);
