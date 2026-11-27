/**
 * Machine-readable film-grammar diagnostic families that `readFilmGrammar`
 * files on an edited sequence.
 *
 * - `grammar-axis-crossed` (error): the camera crossed the action axis between
 *   two cuts, flipping the subjects' half-plane.
 * - `grammar-jump-cut` (warning): two consecutive shots share a shot size and
 *   their camera angle changes less than the minimum cut angle.
 * - `grammar-eyeline` (warning): the screen relation of a look across a cut is
 *   not the same one, or the opposite one for a reverse, as before it.
 * - `grammar-screen-direction` (error): a subject's direction of travel flips on
 *   screen across a cut.
 * - `grammar-shot-size` (warning): a shot's measured size disagrees with its
 *   declared size.
 * - `grammar-reestablish` (warning): a subject moves farther than the reestablish
 *   distance across a cut into a shot tighter than wide.
 * - `grammar-pacing` (advisory): filed once per non-empty sequence on its last
 *   shot, stating the edited durations and their average.
 *
 * `AutoMovieEngineGrammarStyleSuppression` lets a declared style intent except exactly one
 * of `grammar-axis-crossed`, `grammar-jump-cut`, `grammar-eyeline`,
 * `grammar-reestablish` and `grammar-pacing`; the shot-size and
 * screen-direction families have no suppressing intent.
 */
export type AutoMovieGrammarDiagnosticCode =
  | "grammar-axis-crossed"
  | "grammar-jump-cut"
  | "grammar-eyeline"
  | "grammar-screen-direction"
  | "grammar-shot-size"
  | "grammar-reestablish"
  | "grammar-pacing";
