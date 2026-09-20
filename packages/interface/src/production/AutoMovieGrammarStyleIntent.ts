/**
 * Deliberate grammar breaks that suppress only their matching heuristic.
 *
 * Pure geometric facts remain measurable; this marker records why a director
 * chose to keep one otherwise questionable edit.
 *
 * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-style-drift Exposes `AutoMovieGrammarStyleIntent` as the portable data boundary for the production design style drift requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-design-reference-realization Types `AutoMovieGrammarStyleIntent` for the narrative intent design reference realization system contract.
 */
export type AutoMovieGrammarStyleIntent =
  | "axis-cross"
  | "jump-cut"
  | "eyeline-break"
  | "tight-reestablish"
  | "rhythmic-pacing";
