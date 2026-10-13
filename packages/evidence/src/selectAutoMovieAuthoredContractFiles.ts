import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieProductionKind } from "./AutoMovieProductionKind";


/**
 * Selects shared contracts by the work an authored layer actually produces.
 *
 * Construction principles govern the narrative ladder's meaning and form.
 * Audience-language naturalness rules are deferred to screenplay
 * naturalness. Research, settings, and design select their technical contracts
 * in every production shape. The complete inventory still ships with every
 * production.
 *
 *
 * @evidence contracts/common.md#principled-implementation Layer role selects core, story, delivery or design discovery, principle and obligation paths, with film settings receiving the subject obligation.
 * @evidence contracts/common.md#clear-and-simple-design One selector owns the concrete shipped contract inventory by authored work type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Narrative audience-language naturalness is deferred to final screenplay rules; no private fixture path changes selection.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies narrative and technical branch policy while the return separates discovery, principles and obligations.
 * @evidence contracts/performance.md#efficient-algorithms Fixed layer tests and small path arrays require O(1) work relative to production file population.
 * @evidence contracts/performance.md#reuse-equivalent-work Reference producers reuse this selector rather than maintain independent contract matrices; no filesystem cache is involved.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned path arrays escape, retaining no authored source or external resource.
 */
export function selectAutoMovieAuthoredContractFiles(
  kind: AutoMovieProductionKind | null,
  layer: AutoMovieAuthoredDocumentLayer,
): { discovery: string[]; principles: string[]; obligations: string[] } {
  const narrative: boolean = ["treatments", "scripts", "screenplays"].includes(layer);
  const foundation: boolean = layer === "settings" || layer === "research";
  const domain: "core" | "delivery" | "design" | "story" = foundation
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
