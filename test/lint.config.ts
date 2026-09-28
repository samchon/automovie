import { type ITtscEvidenceGraphConfig, evidence } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

// The source populations remain declared so graph diagnostics stay visible as
// warnings while the review-tag scheme is removed.
const subjects = ["generated-korean-girl-01"];
const sharedSources = [
  "src/subjects/**/*.ts",
  ...subjects.map((subject) => `!src/subjects/${subject}/**/*.ts`),
];
// The body folder and face residual remain separate graph populations.
// Domain review carriers remain attached to the root construction record.
// Match their explicit suffix, so a future preview.ts is still source to review.
const studyReviews = [
  "studies/human-face/review.ts",
  "studies/human-face/**/*-review.ts",
];
const studySources = [
  "studies/human-face/**/*.ts",
  ...studyReviews.map((file) => `!${file}`),
];

/**
 * The declared source and view relationships remain visible while their graph
 * diagnostics warn. Review fingerprints are no longer required or authored.
 * A warning does not establish anatomical or photographic acceptance.
 */
const graph: ITtscEvidenceGraphConfig = {
  claims: [
    ...subjects.flatMap((subject): ITtscEvidenceGraphConfig["claims"] => [
      {
        name: `${subject}: every required view is recorded`,
        type: "typescript" as const,
        files: [`src/subjects/${subject}/model.ts`],
        symbol: "function" as const,
        reference: [
          {
            type: "markdown" as const,
            files: [`src/subjects/${subject}/review.md`],
            symbol: "h2" as const,
            checklist: true,
            noEvidenceExclude: true,
            severity: "error" as const,
          },
          {
            type: "markdown" as const,
            files: [`src/subjects/${subject}/review.md`],
            symbol: "h2" as const,
            checklist: true,
            noEvidenceExclude: true,
            severity: "warning" as const,
          },
        ],
      },
      {
        name: `${subject}: reviewed construction basis`,
        type: "typescript" as const,
        files: [
          `src/subjects/${subject}/review.ts`,
          `src/subjects/${subject}/**/*-review.ts`,
        ],
        symbol: "property" as const,
        reference: [
          {
            type: "typescript" as const,
            // A review is the observer, not part of the geometry it observes.
            files: [
              ...sharedSources,
              `src/subjects/${subject}/**/*.ts`,
              "!src/subjects/**/review.ts",
              `!src/subjects/${subject}/**/*-review.ts`,
            ],
            symbol: ["type", "function", "property"],
            noEvidenceExclude: true,
          },
          {
            type: "typescript" as const,
            package: "@automovie/human",
            // The construction surface, as it was selected before the
            // package moved under `face/`: what was `components/` and
            // `geometry/` is now `anatomy/`, `surface/` and `mesh/`.
            files: [
              "src/face/anatomy/**/*.ts",
              "src/face/surface/**/*.ts",
              "src/face/mesh/**/*.ts",
              "src/face/export/**/*.ts",
              "!src/face/**/index.ts",
            ],
            symbol: ["type", "function", "property"],
            noEvidenceExclude: true,
          },
        ],
      },
      {
        name: `${subject}: construction review retains domain inspections`,
        type: "typescript" as const,
        files: [`src/subjects/${subject}/review.ts`],
        symbol: "property" as const,
        reference: {
          type: "typescript" as const,
          files: [`src/subjects/${subject}/**/*-review.ts`],
          symbol: "property" as const,
          noEvidenceExclude: true,
        },
      },
      {
        name: `${subject}: model retains its review carrier`,
        type: "typescript" as const,
        files: [`src/subjects/${subject}/model.ts`],
        symbol: "function" as const,
        reference: {
          type: "typescript" as const,
          files: [`src/subjects/${subject}/review.ts`],
          symbol: "property" as const,
          singleEvidencePerSymbol: true,
          noEvidenceExclude: true,
        },
      },
    ]),
    {
      name: "portable face studies retain every per-person observation",
      type: "typescript",
      files: studySources,
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          files: ["studies/human-face/review.md"],
          symbol: "h2",
          checklist: true,
          noEvidenceExclude: true,
          severity: "error",
        },
        {
          type: "markdown",
          files: ["studies/human-face/review.md"],
          symbol: "h2",
          checklist: true,
          noEvidenceExclude: true,
          severity: "warning",
        },
      ],
    },
    {
      name: "portable face studies retain their construction review",
      type: "typescript",
      files: studySources,
      symbol: ["type", "function", "property"],
      reference: {
        type: "typescript",
        files: ["studies/human-face/review.ts"],
        symbol: "property",
        singleEvidencePerSymbol: true,
        noEvidenceExclude: true,
      },
    },
    {
      name: "portable face construction source is inspected",
      type: "typescript",
      files: studyReviews,
      symbol: "property",
      reference: [
        {
          type: "typescript",
          package: "@automovie/human",
          files: ["src/**/*.ts", "!src/body/**/*.ts", "!src/**/index.ts"],
          symbol: ["type", "function", "property"],
          noEvidenceExclude: true,
        },
        {
          type: "typescript",
          files: studySources,
          symbol: ["type", "function", "property"],
          noEvidenceExclude: true,
        },
      ],
    },
    {
      name: "portable face construction review retains its domain inspections",
      type: "typescript",
      files: ["studies/human-face/review.ts"],
      symbol: "property",
      reference: {
        type: "typescript",
        files: ["studies/human-face/**/*-review.ts"],
        symbol: "property",
        noEvidenceExclude: true,
      },
    },
    {
      name: "portable body construction source is inspected",
      type: "typescript",
      files: ["studies/human-body/review.ts"],
      symbol: "property",
      reference: {
        type: "typescript",
        package: "@automovie/human",
        files: ["src/body/**/*.ts", "!src/**/index.ts"],
        symbol: ["type", "function", "property"],
        noEvidenceExclude: true,
      },
    },
    {
      name: "portable body studies retain the provenance and review contract",
      type: "typescript",
      files: ["studies/human-body/**/*.ts"],
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../docs",
          files: ["requirements/actors/body-authoring/**/README.md"],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../docs",
          files: [
            "requirements/actors/body-authoring/**/*.md",
            "!requirements/actors/body-authoring/**/README.md",
          ],
          symbol: "h3",
        },
        {
          type: "markdown",
          root: "../docs",
          files: [
            "specifications/asset-and-representation/body-authoring/**/README.md",
          ],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../docs",
          files: [
            "specifications/asset-and-representation/body-authoring/**/*.md",
            "!specifications/asset-and-representation/body-authoring/**/README.md",
          ],
          symbol: "h3",
        },
      ],
    },
    {
      name: "portable face studies retain the provenance and review contract",
      type: "typescript",
      files: ["studies/human-face/**/*.ts"],
      symbol: ["type", "function", "property"],
      reference: [
        {
          type: "markdown",
          root: "../docs",
          files: ["requirements/actors/facial-authoring/**/README.md"],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../docs",
          files: [
            "requirements/actors/facial-authoring/**/*.md",
            "!requirements/actors/facial-authoring/**/README.md",
          ],
          symbol: "h3",
        },
        {
          type: "markdown",
          root: "../docs",
          files: [
            "specifications/asset-and-representation/facial-authoring/**/README.md",
          ],
          symbol: "h1",
        },
        {
          type: "markdown",
          root: "../docs",
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
  extends: "../config/lint.config.ts",
  plugins: { evidence },
  rules: { "evidence/graph": ["warning", graph] },
} satisfies ITtscLintConfig;
