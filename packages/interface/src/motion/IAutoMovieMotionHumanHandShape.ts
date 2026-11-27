/**
 * The finger joints of a named hand shape: the angles
 * `IAutoMovieMotionHumanHand.Shape` stands for on every finger and thumb
 * segment of one hand.
 *
 * The angles themselves are stated with their sources in `HumanHand`'s own
 * document; this module holds their tables and the direction a digit takes
 * under them.
 */
export namespace IAutoMovieMotionHumanHandShape {
  /**
   * A hand shape that carries a meaning of its own: the shapes of the emblems
   * the gesture lexicon adds, beside the four working shapes of
   * `IAutoMovieMotionHumanHand.Shape`.
   *
   * - `thumbUp`: the fist with the thumb straight.
   * - `ok`: the forefinger and the thumb bent into a ring, the others open.
   * - `victory`: the forefinger and the middle finger straight and spread, the
   *   others folded.
   * - `crossed`: the forefinger and the middle finger straight and laid toward
   *   each other, the others folded.
   * - `count1` to `count5`: that many digits straight from the forefinger on, the
   *   thumb last (one convention of several; cultures differ).
   * - `snap`: the middle finger's tip on the thumb's, as before a snap.
   * - `quotes`: the forefinger and the middle finger hooked, the others folded.
   */
  export type Emblem = (readonly [
    "thumbUp",
    "ok",
    "victory",
    "crossed",
    "count1",
    "count2",
    "count3",
    "count4",
    "count5",
    "snap",
    "quotes",
  ])[number];
}
