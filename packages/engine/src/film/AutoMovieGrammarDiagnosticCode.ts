/**
 * Machine-readable film-grammar diagnostic families that `readFilmGrammar`
 * files on an edited sequence.
 *
 * - `grammar-axis-crossed` (error): the camera crossed the action axis between
 *   two cuts, flipping the subjects' half-plane.
 * - `grammar-jump-cut` (warning): two consecutive shots share a shot size and
 *   their camera angle changes less than the minimum cut angle.
 * - `grammar-eyeline` (warning): the screen relation of a look across a cut
 *   is not the same one, or the opposite one for a reverse, as before it.
 * - `grammar-screen-direction` (error): a subject's direction of travel flips
 *   on screen across a cut.
 * - `grammar-shot-size` (warning): a shot's measured size disagrees with its
 *   declared size.
 * - `grammar-reestablish` (warning): a subject moves farther than the
 *   reestablish distance across a cut into a shot tighter than wide.
 * - `grammar-pacing` (advisory): filed once per non-empty sequence on its last
 *   shot, stating the edited durations and their average.
 *
 * `GRAMMAR_STYLE_SUPPRESSION` lets a declared style intent except exactly one
 * of `grammar-axis-crossed`, `grammar-jump-cut`, `grammar-eyeline`,
 * `grammar-reestablish` and `grammar-pacing`; the shot-size and
 * screen-direction families have no suppressing intent.
 *
 * @evidence contracts/development/design.md#principled-representation A closed string-literal union naming one editorial rule per member, so `IAutoMovieGrammarDiagnostic.code` and the suppression table are checked exhaustively by the compiler and a consumer branches on the family without parsing text.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One member per measured rule and no severity in the name, since severity is a separate field of the diagnostic; the union lives in its own file because the diagnostic record and the suppression table both import it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No catch-all or free-form member exists, so a new grammar check must add a named family rather than reuse an unrelated code.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, what each family detects and the severity it is filed with, and which families a declared style intent can suppress.
 */
export type AutoMovieGrammarDiagnosticCode =
  | "grammar-axis-crossed"
  | "grammar-jump-cut"
  | "grammar-eyeline"
  | "grammar-screen-direction"
  | "grammar-shot-size"
  | "grammar-reestablish"
  | "grammar-pacing";
