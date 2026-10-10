import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One source-owned native boundary cycle and its exact seating constraints.
 * The source publisher owns the cycle's native-edge incidence and order; this
 * input supplies no replacement path, projection or personally authored curve.
 *
 * Positions and displacement pins share the existing head-local metre frame.
 * Source sample identities identify aliases exactly. At least one cycle sample
 * must have a pin; one pin defines a constant displacement around the cycle.
 * Pins elsewhere are permitted and do not constrain this boundary.
 *
 * @author Samchon
 */
export interface IHumanFaceLidBoundaryPinsInput {
  /** Immutable flat native XYZ positions, in head-local metres. */
  positions: readonly number[];

  /** Canonical source sample identity of every resident vertex. */
  samples: readonly number[];

  /** Ordered closed native cycle, without a repeated closing vertex. */
  boundaryVertices: readonly number[];

  /** Existing exact station displacements in head-local metres. */
  pins: ReadonlyMap<number, IAutoMovieVector3>;
}
