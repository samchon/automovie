import shared from "../../../config/lint.config";
import type { ITtscLintConfig } from "@ttsc/lint";

/** Shared source correctness and declaration guards, with the production's explicit-any refusal preserved. */
export default {
  ...shared,
  rules: {
    ...shared.rules,
    "typescript/no-explicit-any": "error",
  },
} satisfies ITtscLintConfig;
