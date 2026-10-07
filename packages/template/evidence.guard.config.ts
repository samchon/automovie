import { evidence } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

export default {
  plugins: { evidence },
  rules: {
    "evidence/documented": "error",
    "evidence/todo": "error",
  },
} satisfies ITtscLintConfig;
