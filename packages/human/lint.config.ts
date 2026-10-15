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

/**
 * Part modules, one each under `src/parts/<part>`: the skin parts of the
 * `AutoMovieHumanPart` union, then the eye, whose eyeballs are separate meshes
 * the head carries. A part directory missing here classifies as the catch-all
 * `part` element, which may import nothing, so it fails until it is declared.
 */
const PARTS: string[] = [
  "trunk",
  "neck",
  "head",
  "ear",
  "arm",
  "hand",
  "leg",
  "foot",
  "eye",
];

/**
 * Modules below the composition, each with the modules it may import besides
 * itself. Generation runs one way, from input documents to geometry: no module
 * imports `human`, a skin part imports no other part, and the junction knows
 * no part, so parts meet only through the rings it joins. `parts` is the
 * contract every part implements, the files directly under `src/parts`.
 */
const LAYERS: Array<[string, string[]]> = [
  ["structures", []],
  ["measure", ["structures"]],
  ["skeleton", ["structures", "measure"]],
  ["junction", ["structures", "measure", "skeleton"]],
  ["parts", ["structures", "measure", "skeleton", "junction"]],
  ["rig", ["structures", "measure", "skeleton", "junction"]],
  ["appearance", ["structures", "measure", "skeleton", "junction"]],
  [
    "garment",
    ["structures", "measure", "skeleton", "junction", "rig", "appearance"],
  ],
  [
    "export",
    [
      "structures",
      "measure",
      "skeleton",
      "junction",
      "rig",
      "appearance",
      "garment",
    ],
  ],
];

/** Classification of every Human source module for the boundary rule. */
const ELEMENTS: ITtscLintBoundariesElement[] = [
  ...LAYERS.filter(
    ([type]: [string, string[]]): boolean => type !== "parts",
  ).map(
    ([type]: [string, string[]]): ITtscLintBoundariesElement => ({
      type,
      pattern: `src/${type}/**`,
    }),
  ),
  { type: "parts", pattern: "src/parts/*.ts" },
  ...PARTS.map(
    (part: string): ITtscLintBoundariesElement => ({
      type: `part:${part}`,
      pattern: `src/parts/${part}/**`,
    }),
  ),
  { type: "part", pattern: "src/parts/*/**" },
  { type: "human", pattern: "src/human/**" },
];

/** Allowed imports of every classified module; anything else is refused. */
const POLICIES: ITtscLintBoundariesElementTypesRule[] = [
  ...LAYERS.map(
    ([type, below]: [
      string,
      string[],
    ]): ITtscLintBoundariesElementTypesRule => ({
      from: type,
      allow: [type, ...below],
    }),
  ),
  ...PARTS.map(
    (part: string): ITtscLintBoundariesElementTypesRule => ({
      from: `part:${part}`,
      allow: [
        `part:${part}`,
        "parts",
        "structures",
        "measure",
        "skeleton",
        "junction",
      ],
      message:
        "A skin part imports only its own module and the layers below; parts meet through the junction, never each other.",
    }),
  ),
  {
    from: "part",
    disallow: ["*"],
    message:
      "Declare this part directory in PARTS of packages/human/lint.config.ts before it imports anything.",
  },
  {
    from: "human",
    allow: [
      ...LAYERS.map(([type]: [string, string[]]): string => type),
      "part:*",
      "human",
    ],
  },
];

/**
 * Shared correctness guards, plus the refusal of any route by which external
 * data could become the person: Human source generates every figure from
 * typed parameters by code, so it never imports a reader, loads a module at
 * run time or fetches. The rules cover `src`, the only program this
 * configuration compiles; the build guard runs without lint plugins.
 *
 * Module boundaries keep Human's layers one-way: see `LAYERS` and `PARTS`.
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
