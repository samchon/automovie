import type { ITtscLintConfig } from "@ttsc/lint";

/** External data readers and runtime module loaders belong to executable modules. */
const READERS: string[] = [
  "fs", "node:fs", "fs/promises", "node:fs/promises",
  "zlib", "node:zlib", "http", "node:http", "https", "node:https",
  "child_process", "node:child_process", "module", "node:module",
];

/**
 * Library I/O policy, scoped independently of the package's global declaration and layer checks.
 * Executables retain the inherited shared checks and Human checks in lint.config.ts.
 */
export default {
  extends: "../../config/lint.config.ts",
  files: ["src/**"],
  ignores: ["src/executable/**"],
  rules: {
    "no-restricted-imports": ["error", {
      paths: READERS.map((name: string): { name: string; message: string } => ({
        name, message: "Human library modules read no external data.",
      })),
    }],
    "no-restricted-syntax": [
      "error",
      { selector: "CallExpression[callee.type='ImportKeyword']", message: "Human library modules load no module at run time." },
      { selector: "CallExpression[callee.type='Identifier'][callee.name='require']", message: "Human library modules load no module at run time." },
      { selector: "PropertyAccessExpression[object.name=/^(module|global|globalThis|window|self)$/][property.name='require']", message: "Human library modules obtain no CommonJS loader from a runtime host." },
      { selector: "ElementAccessExpression[object.name=/^(module|global|globalThis|window|self)$/][property.value='require']", message: "Human library modules load no module at run time." },
      { selector: "CallExpression[callee.name='fetch']", message: "Human library modules fetch no external data." },
    ],
  },
} satisfies ITtscLintConfig;
