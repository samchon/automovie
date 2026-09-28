/**
 * Shape-dependent joint landmarks in the common right-handed, Y-up,
 * Z-forward body and face frame, in metres.
 *
 * The current MPFB study uses centroids of its source joint cubes as points;
 * its extraction receipt records their origin and the common collar frame.
 * `evaluateHumanBodyShape` applies the same endpoint names to landmarks and
 * skin so `resolveHumanBodySkeleton` places pivots after shape evaluation.
 * Sparse `[landmark, dx, dy, dz]` rows index `ids`, and a basis revision must
 * change when these positions or rows change. A landmark is a rig estimate,
 * not an independently imaged articular centre.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisLandmarks {
  /** Stable names used by joints and authored shape endpoints. */
  ids: string[];

  /** Flat XYZ per landmark, in the basis frame. */
  positions: number[];

  /** Sparse rows per endpoint name, strictly increasing by landmark. */
  targets: Record<string, number[]>;
}
