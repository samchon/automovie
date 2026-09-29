import type { ITtscLintConfig } from "@ttsc/lint";

/**
 * The website presents production captures and four interactive building tours. Its
 * modules are page entry points and the host adapter they share, not public
 * contract carriers, so only the workspace correctness rules apply here.
 */
export default {
  extends: "../config/lint.config.ts",
} satisfies ITtscLintConfig;
