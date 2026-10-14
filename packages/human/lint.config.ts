import type { ITtscLintConfig } from "@ttsc/lint";

import shared from "../../config/lint.config";

/** Shared correctness and evidence declaration guards. */
export default {
  ...shared,
} satisfies ITtscLintConfig;
