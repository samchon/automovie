import { evidence } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

export default {
  plugins: { evidence },
  rules: {
    "evidence/singular": "error",
    "evidence/documented": [
      "error",
      { symbol: ["type", "function", "property"] },
    ],
    "evidence/todo": "error",
  },
} satisfies ITtscLintConfig;
