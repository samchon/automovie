/**
 * Machine-readable film-grammar diagnostic families.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-continuity-finding AutoMovieGrammarDiagnosticCode supports deterministic continuity findings: Machine-readable film-grammar diagnostic families.
 * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-findings Names line crosses, eyeline breaks, screen-direction flips, and related edit observations with stable machine-readable diagnostic codes.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar AutoMovieGrammarDiagnosticCode realizes deterministic continuity-grammar analysis: Machine-readable film-grammar diagnostic families.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Provides stable finding identities for measured camera-grammar failures instead of reducing them to untyped prose.
 */
export type AutoMovieGrammarDiagnosticCode =
  | "grammar-axis-crossed"
  | "grammar-jump-cut"
  | "grammar-eyeline"
  | "grammar-screen-direction"
  | "grammar-shot-size"
  | "grammar-reestablish"
  | "grammar-pacing";
