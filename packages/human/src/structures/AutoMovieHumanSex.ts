/**
 * Sex of a person, as a beginner's converter input.
 *
 * Sex selects which population statistics a converter reads: adult means, growth curves and the sex-typical proportions that measured attractiveness keeps rather than averages (shoulder breadth for men, a narrow waist at an ordinary hip for women). Modeling never reads it. A detailed identity carries the resulting measurements, so any figure between the two statistical means is reachable by measurements alone.
 *
 * @author Samchon
 */
export type AutoMovieHumanSex =
  /** Female population statistics. */
  | "female"

  /** Male population statistics. */
  | "male";
