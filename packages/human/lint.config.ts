import { type ITtscEvidenceGraphConfig, evidence } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

/**
 * Authored public definitions owe both contracts; barrels only re-export
 * their carriers. The body folder is assigned to the body contract and the
 * residual population (everything that is not the body) answers for the face,
 * so a new source file under `src/` owes a contract by default.
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
      "error",
      { symbol: ["type", "function", "property"] },
    ],
    "evidence/graph": ["error", graph],
    "evidence/singular": "error",
    "evidence/todo": "error",
  },
} satisfies ITtscLintConfig;
