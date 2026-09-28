import { type ITtscEvidenceGraphConfig, evidence } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

/**
 * Keep the historical body and face evidence populations visible while their
 * relationships are being redesigned. Every evidence diagnostic in this
 * package is advisory; source modules still explain their responsibility in
 * JSDoc. Barrels only re-export their carriers. The body folder remains
 * separate from the residual face population so later graph work can inspect
 * exactly which relationship each file previously occupied.
 */
const bodyLeaves = ["src/body/**/*.ts", "!src/**/index.ts"];
const publicLeaves = ["src/**/*.ts", "!src/body/**/*.ts", "!src/**/index.ts"];

const contract = (
  name: string,
  files: string[],
  layer: "requirements/actors" | "specifications/asset-and-representation",
  topic: "facial-authoring" | "body-authoring",
): ITtscEvidenceGraphConfig["claims"][number] => ({
  name,
  type: "typescript",
  files,
  symbol: ["type", "function", "property"],
  reference: [
    {
      type: "markdown",
      root: "../../docs",
      files: [`${layer}/${topic}/**/README.md`],
      symbol: "h1",
    },
    {
      type: "markdown",
      root: "../../docs",
      files: [`${layer}/${topic}/**/*.md`, `!${layer}/${topic}/**/README.md`],
      symbol: "h3",
    },
  ],
});

const graph: ITtscEvidenceGraphConfig = {
  claims: [
    contract(
      "human body exports implement body requirements",
      bodyLeaves,
      "requirements/actors",
      "body-authoring",
    ),
    contract(
      "human body exports implement body specifications",
      bodyLeaves,
      "specifications/asset-and-representation",
      "body-authoring",
    ),
    {
      name: "human public exports implement face requirements",
      type: "typescript",
      files: publicLeaves,
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: ["requirements/actors/facial-authoring/**/README.md"],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "requirements/actors/facial-authoring/**/*.md",
            "!requirements/actors/facial-authoring/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
    {
      name: "human public exports implement face specifications",
      type: "typescript",
      files: publicLeaves,
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "specifications/asset-and-representation/facial-authoring/**/README.md",
          ],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "specifications/asset-and-representation/facial-authoring/**/*.md",
            "!specifications/asset-and-representation/facial-authoring/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
  ],
};

export default {
  extends: "../../config/lint.config.ts",
  plugins: { evidence },
  rules: {
    "evidence/documented": [
      "warning",
      { symbol: ["type", "function", "property"] },
    ],
    "evidence/graph": ["warning", graph],
    "evidence/singular": "warning",
    "evidence/todo": "warning",
  },
} satisfies ITtscLintConfig;
