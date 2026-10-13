/**
 * One reading of how long a source unit is on the ground.
 *
 * Several readings may sit on one frame; only the one the frame's `scale`
 * names is used to convert points to metres. A candidate's confidence is
 * recorded for the reader and is not consulted by promotion.
 *
 * @evidence contracts/common.md#principled-implementation One finite positive metres-per-unit reading with a confidence and a basis; `designFrameScale` uses only the candidate the frame's `scale` names, and promotion's confidence floor applies to semantic candidates, never to this value.
 * @evidence contracts/common.md#clear-and-simple-design Four fields; the choice between readings is stored once on the frame, so a candidate never marks itself as chosen.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No basis value is interpreted; validation requires a non-blank basis, a finite positive scale, a confidence within inclusive `[0, 1]`, and an id unique within its frame.
 * @evidence contracts/common.md#meaningful-documentation States the id scope, that the scale is metres per source unit, the confidence range and that it does not gate promotion, and example bases.
 * @author Samchon
 */
export interface IAutoMovieDesignScaleCandidate {
  /** Stable candidate identity within the frame. */
  id: string;

  /** Metres per one source unit; strictly positive. */
  metersPerUnit: number;

  /** Inclusive `[0, 1]` confidence in this reading. */
  confidence: number;

  /** Where the reading came from, such as `scale-bar` or `dimension-string`. */
  basis: string;
}
