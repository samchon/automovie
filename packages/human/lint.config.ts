import type { ITtscLintConfig } from "@ttsc/lint";

import shared from "../../config/lint.config";

/** Modules that read files, decompress archives or reach the network. */
const READERS: string[] = [
  "fs",
  "node:fs",
  "fs/promises",
  "node:fs/promises",
  "zlib",
  "node:zlib",
  "http",
  "node:http",
  "https",
  "node:https",
  "child_process",
  "node:child_process",
];

/**
 * Shared correctness guards, plus the refusal of any route by which external
 * data could become the person: Human source generates every figure from
 * typed parameters by code, so it never imports a reader, loads a module at
 * run time or fetches. The rules cover `src`, the only program this
 * configuration compiles; the build guard runs without lint plugins.
 *
 * Evidence declarations are suspended until the rebuild declares completion.
 */
export default {
  ...shared,
  rules: {
    ...shared.rules,
    "evidence/documented": "off",
    "evidence/singular": "off",
    "evidence/todo": "off",
    "no-restricted-imports": [
      "error",
      {
        paths: READERS.map(
          (name: string): { name: string; message: string } => ({
            name,
            message:
              "Human generates the person from typed parameters by code and reads no external data.",
          }),
        ),
      },
    ],
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.type='ImportKeyword']",
        message: "Human loads no module at run time.",
      },
      {
        selector: "CallExpression[callee.name='require']",
        message: "Human loads no module at run time.",
      },
      {
        selector: "CallExpression[callee.name='fetch']",
        message: "Human fetches no external data.",
      },
    ],
  },
} satisfies ITtscLintConfig;
