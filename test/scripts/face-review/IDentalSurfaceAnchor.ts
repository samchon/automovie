/**
 * A registered point referenced to the dentition's resident surface vertices. Weights form
 * an exact nonnegative partition of unity; the measurement evaluator reads
 * the referenced coordinates without moving them. This is registration
 * metadata for an offline measurement, not a document's shaping control.
 * The registrar establishes its anatomical identity and geometric support.
 * An affine combination alone proves neither clinical identity nor that the
 * point lies on a particular triangle.
 *
 * @author Samchon
 */
export interface IDentalSurfaceAnchor {
  /** Resident vertex indices in the exact registered dentition. */
  vertices: readonly number[];

  /** Nonnegative interpolation weights summing exactly to one. */
  weights: readonly number[];
}
