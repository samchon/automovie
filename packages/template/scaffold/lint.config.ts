import type { ITtscLintConfig } from "@ttsc/lint";

/**
 * Source elements in dependency order: the host and commands enter films,
 * films compose scenes, scenes call consequences, interactions and entities,
 * and every behavior rests on laws. An import against that direction, into an
 * unknown folder, or of `Math.random` fails lint.
 */
const elements = [
  { type: "host", pattern: "src/*.ts" },
  { type: "executable", pattern: "src/executable/**" },
  { type: "integrations", pattern: "src/integrations/**" },
  { type: "films", pattern: "src/composition/films/**" },
  { type: "scenes", pattern: "src/composition/scenes/**" },
  { type: "consequences", pattern: "src/consequences/**" },
  { type: "interactions", pattern: "src/interactions/**" },
  { type: "entities", pattern: "src/entities/**" },
  { type: "laws", pattern: "src/laws/**" },
];

/** Source correctness, formatting and dependency direction; checklist answers run through `npm run evidence`. */
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
    "no-restricted-syntax": [
      "error",
      {
        selector: "MemberExpression[object.name='Math'][property.name='random']",
        message: "Draw variation from the installed seeded generator.",
      },
    ],
    "boundaries/no-unknown": ["error", { elements }],
    "boundaries/element-types": [
      "error",
      {
        elements,
        default: "disallow",
        rules: [
          { from: "host", allow: ["host", "films"] },
          {
            from: "executable",
            allow: ["executable", "host", "films", "integrations"],
          },
          { from: "integrations", allow: ["integrations"] },
          { from: "films", allow: ["films", "scenes", "host"] },
          {
            from: "scenes",
            allow: ["scenes", "consequences", "interactions", "entities"],
          },
          {
            from: "consequences",
            allow: ["consequences", "interactions", "entities", "laws"],
          },
          { from: "interactions", allow: ["interactions", "entities", "laws"] },
          { from: "entities", allow: ["entities", "laws"] },
          { from: "laws", allow: ["laws"] },
        ],
      },
    ],
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
