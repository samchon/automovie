import { type ITtscEvidenceGraphConfig, evidence } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

/**
 * Every authored type and function in the human package answers the contracts
 * checklists at `.agents/skills/contracts`; the package cites no requirement
 * or specification page. Each population derives from the source-tree glob, so
 * a new source file enters it by default. Barrels only re-export declarations
 * that already answer at their definition.
 *
 * - The common chapters apply to every declaration.
 * - The modeling chapters apply to declarations that define, build or measure
 *   a form. The document, editor and export folders and the face override
 *   types at the face root carry serialization, editing and export, which
 *   define no form, so they stay outside this population.
 * - The anatomy chapters apply to every declaration that stands for the body
 *   or its controls, which is everything except export.
 *
 * The rules currently warn while the checklists are being answered component
 * by component.
 */
const declarations = ["src/**/*.ts", "!src/**/index.ts"];
const formDeclarations = [
  ...declarations,
  "!src/**/document/**",
  "!src/**/editor/**",
  "!src/**/export/**",
  "!src/face/*.ts",
];
const bodyDeclarations = [...declarations, "!src/**/export/**"];

const checklist = (
  name: string,
  files: string[],
  document: "common" | "modeling" | "anatomy",
): ITtscEvidenceGraphConfig["claims"][number] => ({
  name,
  type: "typescript",
  files,
  symbol: ["type", "function"],
  reference: {
    type: "markdown",
    root: "../../.agents/skills",
    files: [`contracts/${document}.md`],
    symbol: "h2",
    checklist: true,
  },
});

const graph: ITtscEvidenceGraphConfig = {
  claims: [
    checklist(
      "human declarations answer the common implementation principles",
      declarations,
      "common",
    ),
    checklist(
      "human form declarations answer the modeling principles",
      formDeclarations,
      "modeling",
    ),
    checklist(
      "human body declarations answer the anatomical principles",
      bodyDeclarations,
      "anatomy",
    ),
  ],
};

export default {
  extends: "../../config/lint.config.ts",
  plugins: { evidence },
  rules: {
    // Contract evidence remains visible but does not block this editor work.
    "evidence/documented": [
      "warning",
      { symbol: ["type", "function", "property"] },
    ],
    "evidence/graph": ["warning", graph],
    "evidence/singular": "warning",
    "evidence/todo": "warning",
  },
} satisfies ITtscLintConfig;
