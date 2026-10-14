import type { IAutoMovieEvidenceBranchClaim } from "./IAutoMovieEvidenceBranchClaim";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { IAutoMovieSourceEvidencePopulation } from "./IAutoMovieSourceEvidencePopulation";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";
import { DOCS } from "./DOCS";
import { SOURCES } from "./SOURCES";
import { branchClaims } from "./branchClaims";
import { createAutoMovieSourceRealizationReferences } from "./createAutoMovieSourceRealizationReferences";
import { referencesPerFile } from "./referencesPerFile";
import { requiresEvidence } from "./requiresEvidence";
import { sharedDocsRoot } from "./sharedDocsRoot";
import { sharedReference } from "./sharedReference";
import { upstreamReference } from "./upstreamReference";

/** A principle is a no-exclusion checklist every selected unit answers. */
function principleReference(shared: string, file: string, review: boolean): ITtscEvidenceGraphReference {
  return sharedReference(shared, "principles", file, review, true, false);
}

/** An obligation is no-exclusion coverage distributed across one layer. */
function obligationReference(shared: string, file: string, review: boolean): ITtscEvidenceGraphReference {
  return sharedReference(shared, "obligations", file, review, false, false);
}

function sourceObligations(shared: string, file: string, review: boolean): ITtscEvidenceGraphReference {
  return obligationReference(shared, file, review);
}

/** The no-exclusion checklist every selected TypeScript source owner answers. */
function sourceUnitPrinciples(shared: string, review: boolean): ITtscEvidenceGraphReference {
  return principleReference(shared, "source-units.md", review);
}

/**
 * Construct named source-owner realization and unit obligations for design sources, shots, production serialization and film assembly.
 *
 * @evidence contracts/common.md#principled-implementation Construct named source-owner realization and unit obligations for design sources, shots, production serialization and film assembly.
 * @evidence contracts/common.md#clear-and-simple-design Source population metadata owns globs, owner kinds and design correspondence; assembly additionally walks current settings files through referencesPerFile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One-target owner cardinality and no-exclusion H2 realization stay explicit; current source references do not claim review receipts.
 * @evidence contracts/common.md#meaningful-documentation Disabled follows evidence completion, with film shot targets using final screenplays and brief targets using brief shots.
 * @evidence contracts/performance.md#efficient-algorithms The source family count is fixed, while settings per-file references trigger physical walks and output proportional to selected settings files.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared family references and metadata are reused within assembly; returned claim records are rebuilt per declaration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns claim arrays and nested references; no source evaluator or background task is retained.
 */
export function sourceClaims(graph: IAutoMovieEvidenceConfigProps): IAutoMovieEvidenceBranchClaim[] {
  const shared: string = sharedDocsRoot(graph.location);
  const claims: IAutoMovieEvidenceBranchClaim[] = [];
  for (const name of [
    "mapSources",
    "modelSources",
    "spaceSources",
    "materialSources",
    "instanceSources",
    "motionSources",
    "systemSources",
  ] as const) {
    const source: IAutoMovieSourceEvidencePopulation = SOURCES[name];
    const design: "instances" | "maps" | "materials" | "models" | "motions" | "spaces" | "systems" = source.design!;
    const review: boolean = false;
    claims.push(
      ...branchClaims(
        name,
        {
          name: `${name} owners each answer exactly one ${design} design file`,
          type: "typescript",
          files: [...source.files],
          symbol: [...source.ownerSymbols],
          disabled: !requiresEvidence(graph[name]),
          reference: createAutoMovieSourceRealizationReferences({
reference: {
              type: "markdown",
              root: DOCS,
              files: [`${design}/**/*.md`],
              symbol: "file",
              noEvidenceExclude: true,
              singleEvidencePerSymbol: true,
            },
          }),
        },
        {
          name: `${name} owners answer source-unit principle checklists, realize every ${design} unit, and cover source obligations`,
          type: "typescript",
          files: [...source.files],
          symbol: [...source.symbols],
          disabled: !requiresEvidence(graph[name]),
          reference: [
            sourceUnitPrinciples(shared, review),
            upstreamReference(shared, source.obligation, review),
            sourceObligations(shared, source.obligation, review),
            ...createAutoMovieSourceRealizationReferences({
              reference: {
                type: "markdown",
                root: DOCS,
                files: [`${design}/**/*.md`],
                symbol: "h2",
                noEvidenceExclude: true,
              }
}),
          ],
        },
      ),
    );
  }

  const shotReview: boolean = false;
  claims.push(
    ...branchClaims("shots", {
      name: "shot and acceptance owners each realize one screenplay scene or brief shot",
      type: "typescript",
      files: [...SOURCES.shots.files],
      symbol: [...SOURCES.shots.ownerSymbols],
      disabled: !requiresEvidence(graph.shots),
      reference: createAutoMovieSourceRealizationReferences({
reference: {
          type: "markdown",
          root: DOCS,
          files:
            graph.kind === "film"
              ? ["final/screenplays/**/*.md"]
              : ["briefs/**/*.md"],
          symbol: "h3",
          noEvidenceExclude: true,
          singleEvidencePerSymbol: true,
        }
}),
    }),
    ...branchClaims("shots", {
      name: "shot source owners answer source-unit principle checklists and cover every shot-source obligation",
      type: "typescript",
      files: [...SOURCES.shots.files],
      symbol: [...SOURCES.shots.symbols],
      disabled: !requiresEvidence(graph.shots),
      reference: [
        sourceUnitPrinciples(shared, shotReview),
        upstreamReference(shared, "shots.md", shotReview),
        sourceObligations(shared, SOURCES.shots.obligation, shotReview),
      ],
    }),
    ...branchClaims("productionSources", {
      name: "production source owners answer source-unit principle checklists, serialize settings, and cover production-source obligations",
      type: "typescript",
      files: [...SOURCES.productionSources.files],
      symbol: [...SOURCES.productionSources.symbols],
      disabled: !requiresEvidence(graph.productionSources),
      reference: [
        sourceUnitPrinciples(shared, false),
        upstreamReference(
          shared,
          SOURCES.productionSources.obligation,
          false,
        ),
        sourceObligations(
          shared,
          SOURCES.productionSources.obligation,
          false,
        ),
        ...referencesPerFile(
          graph,
          "settings",
          "h2",
          false,
        ),
      ],
    }),
    ...branchClaims("filmSources", {
      name: "film source owners answer source-unit principle checklists, assemble every screenplay sequence or brief delivery, and cover film-source obligations",
      type: "typescript",
      files: [...SOURCES.filmSources.files],
      symbol: [...SOURCES.filmSources.symbols],
      disabled: !requiresEvidence(graph.filmSources),
      reference: [
        sourceUnitPrinciples(shared, false),
        upstreamReference(
          shared,
          SOURCES.filmSources.obligation,
          false,
        ),
        sourceObligations(
          shared,
          SOURCES.filmSources.obligation,
          false,
        ),
        ...createAutoMovieSourceRealizationReferences({
reference: {
            type: "markdown",
            root: DOCS,
            files:
              graph.kind === "film"
                ? ["final/screenplays/**/*.md"]
                : ["briefs/**/*.md"],
            symbol: "h2",
            noEvidenceExclude: true,
          }
}),
      ],
    }),
  );
  return claims;
}
