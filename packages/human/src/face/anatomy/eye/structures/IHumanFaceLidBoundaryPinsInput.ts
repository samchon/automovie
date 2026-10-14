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
 *
 * @evidence contracts/common.md#principled-implementation One source-owned simple native cycle and canonical sample aliases accompany exact metre displacement pins.
 * @evidence contracts/common.md#clear-and-simple-design The publisher owns incidence/order and createHumanFaceLidBoundaryPins owns arc-length interpolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts At least one resident pin is required; pins elsewhere do not invent a replacement boundary.
 * @evidence contracts/common.md#meaningful-documentation Fields state head-local metre frame, ordered nonrepeated cycle and immutable caller inputs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceLidBoundaryPinsInput is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceLidBoundaryPinsInput declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceLidBoundaryPinsInput itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
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
