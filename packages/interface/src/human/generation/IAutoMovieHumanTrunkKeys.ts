/**
 * The fold, bust, waist and high-hip landmark heights moved by trunk courses.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkKeys in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkKeys {
  /** The landmark heights the courses move. */
  export type Heights = Record<"fold" | "bust" | "waist" | "highHip", number>;
}
