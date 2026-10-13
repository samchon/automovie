/**
 * Deliberate grammar breaks that suppress only their matching heuristic.
 *
 * Pure geometric facts remain measurable; this marker records why a director chose to keep one otherwise questionable edit.
 *
 * @evidence contracts/common.md#principled-implementation Each intent maps to one matching grammar diagnostic class through GRAMMAR_STYLE_SUPPRESSION, preserving measured geometry while marking the corresponding heuristic break as deliberate.
 * @evidence contracts/common.md#clear-and-simple-design Five closed declarations annotate an authored camera or cut choice instead of adding separate toggles to every grammar measurement routine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An axis-cross intent does not suppress eyeline, jump-cut or pacing findings; intentional style is bounded by its exact diagnostic mapping rather than a blanket review exemption.
 * @evidence contracts/common.md#meaningful-documentation Explains deliberate heuristic suppression and states that geometric observations remain measurable even when the author keeps the edit.
 * @author Samchon
 */
export type AutoMovieGrammarStyleIntent =
  | "axis-cross"
  | "jump-cut"
  | "eyeline-break"
  | "tight-reestablish"
  | "rhythmic-pacing";
