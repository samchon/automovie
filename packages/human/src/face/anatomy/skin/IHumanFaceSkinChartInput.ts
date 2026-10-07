import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";

/**
 * The current native skin and a registered source-support facet for its chart.
 * The host must own these same positions and winding. The brow assembly
 * chooses the seed from its registered band rather than a personal point.
 *
 * @evidence contracts/common.md#principled-implementation Actual geometry and one native support facet define the chart frame and its inverse topology.
 * @evidence contracts/common.md#clear-and-simple-design Names native geometry, shared frame reader and source seed in one input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no anatomical axis, preferred nearest sheet or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation States current-state identity and source-seed responsibility.
 * @evidence contracts/modeling.md#spatial-conventions Positions are head-frame metres and the seed is a native triangle ordinal.
 * @evidence contracts/modeling.md#shared-boundaries The chart and host consume the same native winding and positions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no anatomical control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow consumer observes the lifted geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The chart is a source geometry convention.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart owner checks native support.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Supplies no personal curve or vertex field.
 * @author Samchon
 */
export interface IHumanFaceSkinChartInput {
  /** Flat native XYZ triples in the host's current head frame. */
  positions: readonly number[];

  /** Complete native triangle winding over those same vertices. */
  indices: readonly number[];

  /** The current immutable host owning point and normal transport. */
  host: IHumanFaceSkinHost;

  /** Actual registered-band support facet, not a guessed region identity. */
  seedTriangle: number;

  /** Registered source-band vertices whose inverse must retain native identity. */
  supportVertices: readonly number[];
}
