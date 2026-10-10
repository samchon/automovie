/**
 * One document's existing rest, lean and performed arrays supplied to the surface sag calculation. Arrays share source order; distances are metres and softness remains the existing scalar.
 *
 * @author Samchon
 */
export interface IHumanBodySurfaceSagInput {
  /** Document-rest positions in source order. */
  rest: number[];

  /** Matching lean-shape positions. */
  lean: number[];

  /** Current performed positions before sag. */
  skinned: number[];

  /** Unit rest-down directions after performance, per source vertex. */
  hanging: number[];

  /** Existing dimensionless softness value. */
  softness: number;
}
