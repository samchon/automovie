import { evidence } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

export default {
  plugins: { evidence },
  rules: {
    // Contract evidence remains visible but does not block this editor work.
    "evidence/documented": [
      "warning",
      { symbol: ["type", "function", "property"] },
    ],
    "evidence/singular": "warning",
    "evidence/todo": "warning",
  },
} satisfies ITtscLintConfig;
