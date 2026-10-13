/**
 * Deliberate grammar breaks that suppress only their matching heuristic.
 *
 * Pure geometric facts remain measurable; this marker records why a director
 * chose to keep one otherwise questionable edit.
 */
export type AutoMovieGrammarStyleIntent =
  | "axis-cross"
  | "jump-cut"
  | "eyeline-break"
  | "tight-reestablish"
  | "rhythmic-pacing";
