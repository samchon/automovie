import type {
  ITtscLintBoundariesElement,
  ITtscLintBoundariesElementTypesRule,
  ITtscLintConfig,
} from "@ttsc/lint";

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

/** Parameter vocabulary layers with their permitted dependencies. */
const LAYERS: Array<[string, string[]]> = [
  ["typings", []],
  ["structures", ["typings"]],
];

/** Classification of every retained Human parameter module. */
const ELEMENTS: ITtscLintBoundariesElement[] = LAYERS.map(
  ([type]: [string, string[]]): ITtscLintBoundariesElement => ({
    type,
    pattern: `src/${type}/**`,
  }),
);

/** Allowed imports of every classified parameter module. */
const POLICIES: ITtscLintBoundariesElementTypesRule[] = LAYERS.map(
  ([type, below]: [string, string[]]): ITtscLintBoundariesElementTypesRule => ({
    from: type,
    allow: [type, ...below],
  }),
);

/**
 * Shared correctness guards, plus the refusal of any route by which external
 * data could enter parameter definitions: Human source keeps its inputs in
 * typed documents, so it never imports a reader, loads a module at
 * run time or fetches. The rules cover `src`, the only program this
 * configuration compiles; the build guard runs without lint plugins.
 *
 * Module boundaries keep Human's layers one-way: see `LAYERS`.
 *
 * One public identity per file named after it, a doc comment on every exported type, function and property, and no `@todo` hold as in every package. Only the `@evidence` checklist answers wait until the rebuild declares completion, which is why Human has no evidence configuration.
 */
export default {
  ...shared,
  rules: {
    ...shared.rules,
    "evidence/documented": [
      "error",
      { symbol: ["type", "function", "property"] },
    ],
    "evidence/singular": "error",
    "evidence/todo": "error",
    "boundaries/element-types": [
      "error",
      { elements: ELEMENTS, default: "disallow", rules: POLICIES },
    ],
    "no-restricted-imports": [
      "error",
      {
        paths: READERS.map(
          (name: string): { name: string; message: string } => ({
            name,
            message: "Human parameter definitions read no external data.",
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
