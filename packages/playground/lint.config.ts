import { type ITtscEvidenceGraphConfig, evidence } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

/** The anatomical editors are separate application surfaces; every other new module remains a prototype carrier. */
const prototypeSources = ["src/**/*.ts", "!src/human/**/*.ts"];
/** The body editor's own adapters, which answer for the body contract and not the face's. */
const bodySources = [
  "src/human/connectedBodyPanel.ts",
  "src/human/bodyPoseControls.ts",
  "src/human/bodySimpleControls.ts",
];
const faceSources = [
  "src/human/**/*.ts",
  ...bodySources.map((one) => "!" + one),
];

/**
 * The private playground still carries a real deterministic-prototype contract.
 *
 * Every source module is selected. The film demonstration pays the executable
 * prototype units this application actually renders and explicitly declines
 * the downstream-fidelity units that remain outside a local viewer demo.
 *
 * Native evidence lint evaluates the two declared relationships. Self-Review
 * follows the repository evidence-graph skill to compare each changed public
 * export with the requirement and specification it actually implements and
 * to require truthful direct citations. This configuration does not record a
 * current unpaid-host count.
 */
const graph: ITtscEvidenceGraphConfig = {
  claims: [
    {
      name: "face application implements anatomical editor requirements",
      type: "typescript",
      files: faceSources,
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
      name: "face application implements anatomical editor specifications",
      type: "typescript",
      files: faceSources,
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
    {
      name: "body application implements body editor requirements",
      type: "typescript",
      files: bodySources,
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: ["requirements/actors/body-authoring/**/README.md"],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "requirements/actors/body-authoring/**/*.md",
            "!requirements/actors/body-authoring/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
    {
      name: "body application implements body editor specifications",
      type: "typescript",
      files: bodySources,
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "specifications/asset-and-representation/body-authoring/**/README.md",
          ],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../../docs",
          files: [
            "specifications/asset-and-representation/body-authoring/**/*.md",
            "!specifications/asset-and-representation/body-authoring/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
    {
      name: "playground demonstrations realize prototype requirements",
      type: "typescript",
      files: prototypeSources,
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: ["requirements/product/prototype-quality.md"],
        symbol: "h3",
      },
    },
    {
      name: "playground demonstrations realize prototype specifications",
      type: "typescript",
      files: prototypeSources,
      symbol: ["type", "function", "property"],
      reference: {
        type: "markdown",
        root: "../../docs",
        files: [
          "specifications/authoring-and-authority/prototype-determinism-and-fidelity.md",
        ],
        symbol: "h3",
      },
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
    "evidence/todo": "error",
  },
} satisfies ITtscLintConfig;
