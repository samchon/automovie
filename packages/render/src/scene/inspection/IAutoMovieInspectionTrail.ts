/**
 * Where one scene object's origin was at each sampled second, as `sampleAutoMovieInspectionTrails` reads it.
 *
 * @evidence contracts/development/design.md#principled-representation A trail is a sequence of world positions in metres at ascending film seconds, one triple per second, with the stationary verdict stated rather than left for a reader to infer from the numbers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by the sampler and read by `markAutoMovieInspectionTrails`, which draws it at any of its seconds without sampling again.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Positions are a flat list of triples matching `times` one to one; that the lengths agree is kept by the producer.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member holds, its unit and frame.
 */
export interface IAutoMovieInspectionTrail {
  /** The object's inspection path. */
  path: string;

  /** The sampled film seconds, ascending. */
  times: number[];

  /** World position of the object's origin at each second, flat xyz in metres. */
  positions: number[];

  /** Whether every position lies within a micrometre of the first, so the object did not move. */
  stationary: boolean;
}
