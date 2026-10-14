import type { AutoMovieDiagnosticCode, AutoMovieViolationKind } from "@automovie/interface";

const CODE_OF_KIND: Readonly<Record<AutoMovieViolationKind, AutoMovieDiagnosticCode>> = {
  type: "source-scene-content-invalid",
  range: "source-scene-content-invalid",
  rom: "source-scene-content-invalid",
  temporal: "source-scene-content-invalid",
  topology: "source-scene-content-invalid",
  physics: "source-scene-physics-invalid",
  coverage: "source-scene-coverage-incomplete",
};

/**
 * Select the source diagnostic identity for one typed engine violation kind.
 *
 * @evidence contracts/common.md#principled-implementation A total Record over the violation-kind union requires an explicit mapping when the union changes; physics and coverage have separate shipped correction identities while the remaining kinds share content-invalid.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the kind-to-code product policy used by autoMovieSourceContentDiagnostic; severity, address and message remain the finding's facts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No runtime fallback or consumer ID changes the mapping. Shared identities for type, range, rom, temporal and topology are the current explicit policy rather than evidence that their causes are identical.
 * @evidence contracts/common.md#meaningful-documentation States typed input, totality and current grouping; arbitrary unknown strings require upstream validation rather than an invented code here.
 * @evidence contracts/performance.md#efficient-algorithms One property lookup in a fixed seven-entry table takes constant time and allocates no per-call collection.
 * @evidence contracts/performance.md#reuse-equivalent-work The immutable typed mapping is allocated once per loaded module and shared by all conversions; no mutable finding participates in its equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Module-owned storage has seven string entries and no handle or task; calls retain no finding or growing population.
 */
export function autoMovieSourceContentDiagnosticCode(kind: AutoMovieViolationKind): AutoMovieDiagnosticCode {
  return CODE_OF_KIND[kind];
}
