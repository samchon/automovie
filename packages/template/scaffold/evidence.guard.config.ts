import { evidence } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

/** Unrealized source contracts remain a separate evidence gate. */
export default { plugins: { evidence }, rules: { "evidence/todo": "error" } } satisfies ITtscLintConfig;
