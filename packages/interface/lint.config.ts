import type { ITtscLintConfig } from "@ttsc/lint";

/** General source correctness lint; evidence runs through its own command. */
export default { extends: "../../config/lint.config.ts" } satisfies ITtscLintConfig;
