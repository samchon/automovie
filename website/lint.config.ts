import type { ITtscLintConfig } from "@ttsc/lint";

/**
 * The website presents production captures and the interactive manor viewer. Its
 * modules are page entry points and the host adapter they share, not public
 * contract carriers, so only the workspace correctness rules apply here.
 */
export default {
  extends: "../config/lint.config.ts",
} satisfies ITtscLintConfig;
