import type {
  ITtscEvidenceGraphClaim,
  ITtscEvidenceGraphMarkdownReference,
  ITtscEvidenceGraphReference,
} from "@ttsc/evidence";

import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieProductionKind } from "./createAutoMovieEvidenceConfig";
import { projectAutoMovieNativeReferences } from "./projectAutoMovieNativeClaims";

/**
 * Selects shared contracts by the work an authored layer actually produces.
 *
 * Construction principles govern the narrative ladder's meaning and form.
 * Audience-language naturalness rules are deferred to screenplay
 * naturalness. Research, settings, and design select their technical contracts
 * in every production shape. The complete inventory still ships with every
 * production.
 */
export function selectAutoMovieAuthoredContractFiles(
  kind: AutoMovieProductionKind | null,
  layer: AutoMovieAuthoredDocumentLayer,
): { discovery: string[]; principles: string[]; obligations: string[] } {
  const narrative = ["treatments", "scripts", "screenplays"].includes(layer);
  const foundation = layer === "settings" || layer === "research";
  const domain = foundation
    ? "core"
    : narrative
      ? "story"
      : layer === "briefs"
        ? "delivery"
        : "design";
  return {
    discovery: [
      "discovery/core/common.md",
      ...(domain === "design" ? ["discovery/design/designs.md"] : []),
      ...(narrative ? ["discovery/story/films.md"] : []),
      ...(layer === "research" ? [] : [`discovery/${domain}/${layer}.md`]),
      ...(narrative ? ["language/discovery/signals.md"] : []),
    ],
    principles: [
      "principles/core/common.md",
      ...(narrative ? ["principles/story/narratives.md"] : []),
      ...(!foundation && !narrative
        ? ["principles/core/inherited-units.md"]
        : []),
      `principles/${domain}/${layer}.md`,
    ],
    obligations: [
      "obligations/core/common.md",
      ...(narrative
        ? [
            "obligations/core/defaults.md",
            "language/obligations/common.md",
            "obligations/story/narratives.md",
          ]
        : []),
      ...(layer === "research" ? [] : [`obligations/${domain}/${layer}.md`]),
      ...(layer === "settings" && kind === "film"
        ? ["obligations/story/subjects.md"]
        : []),
    ],
  };
}

/** Selects audience-language contracts for final screenplay revision. */
export function selectAutoMovieScreenplayNaturalnessContractFiles(): string[] {
  return [
    "naturalness/core/common.md",
    "naturalness/story/screenplays.md",
    "language/naturalness/screenplays.md",
  ];
}

/** Binds every final screenplay unit to every selected naturalness target. */
export function createAutoMovieScreenplayNaturalnessReferences(
  _review: boolean,
): ITtscEvidenceGraphMarkdownReference[] {
  return selectAutoMovieScreenplayNaturalnessContractFiles().map((file) => ({
    type: "markdown",
    root: "docs",
    files: [file],
    symbol: "h2",
    checklist: true,
    noEvidenceExclude: true,
    requireReview: false,
  }));
}

/** Binds a layer's open searches to its work-specific contract hosts. */
export function createAutoMovieAuthoredDiscoveryReferences(
  kind: AutoMovieProductionKind | null,
  layer: AutoMovieAuthoredDocumentLayer,
  _review: boolean,
): ITtscEvidenceGraphMarkdownReference[] {
  return selectAutoMovieAuthoredContractFiles(kind, layer).discovery.map(
    (file) => ({
      type: "markdown",
      root: "docs",
      files: [file],
      symbol: "h2",
      requireReview: false,
    }),
  );
}

/** Binds each applicable principle to every selected authored unit. */
export function createAutoMovieAuthoredPrincipleReferences(
  kind: AutoMovieProductionKind | null,
  layer: AutoMovieAuthoredDocumentLayer,
  _review: boolean,
): ITtscEvidenceGraphMarkdownReference[] {
  return selectAutoMovieAuthoredContractFiles(kind, layer).principles.map(
    (file) => ({
      type: "markdown",
      root: "docs",
      files: [file],
      symbol: "h2",
      checklist: true,
      noEvidenceExclude: true,
      requireReview: false,
    }),
  );
}

/**
 * Binds whole narrative and delivery documents to their inherited parents.
 *
 * Technical design relationships belong to their consuming H2 units. A second
 * file host would duplicate the same foundation coverage without another owner.
 */
export function createAutoMovieAuthoredFileClaims(
  layer: AutoMovieAuthoredDocumentLayer,
  populationFiles: string[],
  references: ITtscEvidenceGraphReference[],
  enabled: boolean,
): ITtscEvidenceGraphClaim[] {
  if (
    !["treatments", "scripts", "screenplays", "briefs"].includes(layer) ||
    references.length === 0
  )
    return [];
  return [
    {
      name: `${layer} files account for inherited settings, designs, and parent files`,
      type: "markdown",
      root: "docs",
      files: populationFiles,
      symbol: "file",
      disabled: !enabled,
      reference: projectAutoMovieNativeReferences(references),
    },
  ];
}
