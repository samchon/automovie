import type { ITtscLintConfig } from "@ttsc/lint";

/** Source correctness and formatting run independently of the authored graph. */
export default {
  format: {
    severity: "off",
    semi: true,
    singleQuote: false,
    arrowParens: "always",
    bracketSpacing: true,
    quoteProps: "as-needed",
    trailingComma: "all",
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    endOfLine: "lf",
    sortImports: { order: ["<THIRD_PARTY_MODULES>", "^[./]"] },
    jsDoc: true,
  },
  rules: {
    eqeqeq: "error",
    "no-debugger": "error",
    "no-duplicate-imports": "error",
    "no-fallthrough": "error",
    "no-self-compare": "error",
    "no-var": "error",
    "prefer-const": "error",
    "typescript/await-thenable": "error",
    "typescript/ban-ts-comment": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
    "typescript/no-unnecessary-type-constraint": "error",
    "typescript/prefer-as-const": "error",
    "typescript/require-array-sort-compare": "error",
    "typescript/switch-exhaustiveness-check": "error",
  },
} satisfies ITtscLintConfig;
