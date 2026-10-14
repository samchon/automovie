import type { AutoMovieViolationKind } from "@automovie/interface";

/**
 * Classification and attributed message carried from a source-domain validator.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the engine's kind and severity together with the caller's source-addressed correction message, so advice does not become a refusal during diagnostic conversion.
 * @evidence contracts/common.md#clear-and-simple-design One small carrier connects productionEnvironmentValidation and productionShotRuntime to autoMovieSourceContentDiagnostic without moving domain validation into the diagnostic adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape adds no consumer flags or severity default; each producer must supply actual classification and its attributed message.
 * @evidence contracts/common.md#meaningful-documentation Documents classification ownership and the distinction between blocking errors and reviewable warnings; it carries no structured validator path separately from its message.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface selects no algorithm or allocation strategy; source folds and the diagnostic adapter own its instances.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The finding type declares no cache or shared computation; each validation occurrence has its own attribution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type declares no resident store, handle or task; the producing attempt owns finding arrays.
 * @author Samchon
 */
export interface IAutoMovieSourceContentFinding {
  /** Engine tier selecting the source diagnostic identity. */
  kind: AutoMovieViolationKind;

  /** Errors invalidate the scope; warnings expose a risk without refusing it. */
  severity: "error" | "warning";

  /** Caller-composed address, violated requirement and local correction. */
  message: string;
}
