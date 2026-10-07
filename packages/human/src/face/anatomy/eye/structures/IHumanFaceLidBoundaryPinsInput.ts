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
 * @evidence contracts/common.md#principled-implementation A source-owned ordered cycle and existing exact pins determine piecewise-linear displacement along its native-edge arc length, including the closing edge.
 * @evidence contracts/common.md#clear-and-simple-design Topology, sample identity and exact displacement constraints are separate inputs with one boundary owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The input preserves source incidence rather than finding a corrective path or spatially welding aliases.
 * @evidence contracts/common.md#meaningful-documentation States cycle ownership, units, alias identity, single-pin meaning and off-cycle pin behavior.
 * @evidence contracts/modeling.md#spatial-conventions Positions and displacement pins use the same existing head-local metre frame, origin and axes.
 * @evidence contracts/modeling.md#shared-boundaries The source publisher supplies the shared native cycle and the seating owner supplies its exact constraints.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Supplies constraints for existing skin and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries resolved constraints rather than anatomical channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Supplies existing native edges and emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The seating consumer observes its assembled boundary.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries a source interpolation convention and no anatomical measurement or constitutive law.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This internal source cycle is not a public human authoring input.
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
