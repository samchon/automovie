import { type IEvidenceConfig } from "@wrtnlabs/evidence";

// Each declared person owns a review. Unassigned source stays in the shared
// residual population, so a new helper cannot silently escape review coverage.
const subjects = ["generated-korean-girl-01"];
const sharedSources = [
  "src/subjects/**/*.ts",
  ...subjects.map((subject) => `!src/subjects/${subject}/**/*.ts`),
];

/**
 * A model owes every recorded view, and that review owes the complete current
 * construction source. This graph covers the retained authored subjects only;
 * current example documents and product assets are owned by Playground and
 * Human. Their retired portable-study review carriers establish no current
 * source or render acceptance. Human retains its complete implementation
 * contracts population in its own configuration. Surviving subject and shared
 * source selectors are unchanged, including their warning severity.
 */
const graph: IEvidenceConfig = {
  claims: [
    ...subjects.flatMap((subject): IEvidenceConfig["claims"] => [
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
            root: "../packages/human",
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
  ],
};

export default { ...graph, severity: "warning" } satisfies IEvidenceConfig;
