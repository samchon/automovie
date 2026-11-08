import type {
  ITtscLintBoundariesElement,
  ITtscLintBoundariesElementTypesRule,
  ITtscLintConfig,
} from "@ttsc/lint";

/** Public API and parameter vocabulary with their permitted dependencies. */
const LAYERS: Array<[string, string[]]> = [
  [
    "api",
    [
      "appearance",
      "generation",
      "lofting",
      "skeleton",
      "structures",
      "typings",
    ],
  ],
  ["appearance", ["generation", "lofting", "structures", "typings"]],
  ["control", ["structures", "typings"]],
  ["generation", ["lofting", "structures", "typings"]],
  ["skeleton", ["generation", "lofting", "structures", "typings"]],
  ["lofting", []],
  ["typings", []],
  ["structures", ["typings"]],
  ["inspection", ["generation", "lofting", "structures", "typings"]],
  ["executable", ["inspection", "generation", "lofting", "structures", "typings"]],
];

/**
 * Classification of the generator layers and Human types. Workspace
 * dependencies compiled from source (such as `../recovery`) are classified
 * first as `external`, so their own folder names never borrow Human's layer
 * rules; their own lint config governs them.
 */
const ELEMENTS: ITtscLintBoundariesElement[] = [
  { type: "external", pattern: "../**" },
  ...LAYERS.map(
    ([type]: [string, string[]]): ITtscLintBoundariesElement => ({
      type,
      pattern: type === "api" ? "src/AutoMovieHuman.ts" : `src/${type}/**`,
    }),
  ),
];

/** Allowed imports of every classified parameter module. */
const POLICIES: ITtscLintBoundariesElementTypesRule[] = [
  { from: "external", allow: ["external"] },
  ...LAYERS.map(
    ([type, below]: [string, string[]]): ITtscLintBoundariesElementTypesRule => ({
      from: type,
      allow: [type, ...below],
    }),
  ),
];

/**
 * Human runtime layers and pure inspection keep external reads at the Node executable boundary.
 * Browser/public layers cannot import the executable layer. Shared correctness guards apply to both.
 */
export default {
  extends: "./lint.library.config.ts",
  rules: {
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
  },
} satisfies ITtscLintConfig;
