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
  // Logic units and their helpers may reach every source folder.
  { type: "tests", pattern: "test/**" },
  // In this monorepo the installed packages resolve to their workspace source.
  { type: "packages", pattern: "packages/**" },
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
        selector:
          "MemberExpression[object.name='Math'][property.name='random']",
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
          { from: "host", allow: ["packages", "host", "films"] },
          {
            from: "executable",
            allow: ["packages", "executable", "host", "films", "integrations"],
          },
          { from: "integrations", allow: ["packages", "integrations"] },
          { from: "films", allow: ["packages", "films", "scenes", "host"] },
          {
            from: "scenes",
            allow: [
              "packages",
              "scenes",
              "consequences",
              "interactions",
              "entities",
            ],
          },
          {
            from: "consequences",
            allow: [
              "packages",
              "consequences",
              "interactions",
              "entities",
              "laws",
            ],
          },
          {
            from: "interactions",
            allow: ["packages", "interactions", "entities", "laws"],
          },
          { from: "entities", allow: ["packages", "entities", "laws"] },
          { from: "laws", allow: ["packages", "laws"] },
          {
            from: "tests",
            allow: [
              "tests",
              "packages",
              "host",
              "executable",
              "films",
              "scenes",
              "consequences",
              "interactions",
              "entities",
              "laws",
            ],
          },
          { from: "packages", allow: ["packages"] },
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
