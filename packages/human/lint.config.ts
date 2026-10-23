import type {
  ITtscLintBoundariesElement,
  ITtscLintBoundariesElementTypesRule,
  ITtscLintConfig,
} from "@ttsc/lint";

import shared from "../../config/lint.config";

/** Modules that read files, decompress archives, load modules or reach the network. */
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
  "module",
  "node:module",
];

/** Public API and parameter vocabulary with their permitted dependencies. */
const LAYERS: Array<[string, string[]]> = [
  ["api", ["appearance", "generation", "lofting", "structures", "typings"]],
  ["appearance", ["generation", "lofting", "structures", "typings"]],
  ["generation", ["lofting", "structures", "typings"]],
  ["lofting", []],
  ["typings", []],
  ["structures", ["typings"]],
];

/** Classification of the generator layers and Human types. */
const ELEMENTS: ITtscLintBoundariesElement[] = LAYERS.map(
  ([type]: [string, string[]]): ITtscLintBoundariesElement => ({
    type,
    pattern: type === "api" ? "src/AutoMovieHuman.ts" : `src/${type}/**`,
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
 * Correctness guards for the Human contracts and unimplemented generator.
 * The public API depends on structures; structures depend only on typings.
 * Source performs no external reads or runtime loading. Evidence checklists
 * remain deferred until the Human rebuild is complete.
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
        selector:
          "CallExpression[callee.type='Identifier'][callee.name='require']",
        message: "Human loads no module at run time.",
      },
      {
        selector:
          "PropertyAccessExpression[object.name=/^(module|global|globalThis|window|self)$/][property.name='require']",
        message: "Human obtains no CommonJS loader from a runtime host.",
      },
      {
        selector:
          "ElementAccessExpression[object.name=/^(module|global|globalThis|window|self)$/][property.value='require']",
        message: "Human loads no module at run time.",
      },
      {
        selector: "CallExpression[callee.name='fetch']",
        message: "Human fetches no external data.",
      },
    ],
  },
} satisfies ITtscLintConfig;
