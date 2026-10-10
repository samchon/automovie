/**
 * Signed-query data consumed by the contact gradient calculation.
 * The engine owns the geometric hit; this projection adds no surface or side.
 *
 * @author Samchon
 */
export interface IHumanFaceContactHit {
  /** Nearest point in basis metres. */
  point: number[];
  /** Oriented geometric normal or feature pseudonormal. */
  normal: number[];
  /** Unsigned nearest distance, metres. */
  distance: number;
  /** Oriented nearest distance, metres. */
  signedDistance: number;
  /** Engine feature identity, read to distinguish a face from an edge or vertex. */
  feature: string;
}
