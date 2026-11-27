import { createLintConfig } from "@automovie/config";
import type {
  ITtscLintBoundariesElement,
  ITtscLintConfig,
} from "@ttsc/lint";

const base: ITtscLintConfig = createLintConfig({ documented: true });
const testElements: readonly ITtscLintBoundariesElement[] = [
  {
    type: "package",
    pattern: "packages/*/src/**",
    entry: "packages/*/src/**",
  },
  { type: "test", pattern: "test/**" },
  { type: "website", pattern: "website/**" },
];

/**
 * Tests may inspect package source while package lint rules stay strict.
 */
export default {
  ...base,
  rules: {
    ...base.rules,
    "boundaries/entry-point": ["error", { elements: testElements }],
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            regex: "^(\\.\\./)+(test|website)/",
            message: "Tests cannot import another application source tree.",
          },
          {
            regex: "^(\\.\\./)+packages/[^/]+/lib(/|$)",
            message: "Tests may import package source, not built package files.",
          },
          {
            regex: "^(\\.\\./)+[^/]+/(src|lib)(/|$)",
            message: "Import the package by its name instead.",
          },
          {
            regex: "^(@automovie/[^/]+|automovie)/(src|lib)(/|$)",
            message: "Use an exported package entry point.",
          },
        ],
      },
    ],
  },
};
