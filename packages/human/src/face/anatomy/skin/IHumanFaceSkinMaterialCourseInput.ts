import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";

/**
 * Immutable source geometry, registered support and an internal relief guide.
 * The first registered support vertex selects its first native incident facet
 * as an authored chart-frame convention. Every support identity must survive
 * the chart inverse; dimensions may place guide points off the source skin.
 *
 * @evidence contracts/common.md#principled-implementation Native support identities define the chart branch independently of guide width and distance queries.
 * @evidence contracts/common.md#clear-and-simple-design Carries the material-course compiler's geometry and source registration together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Internal registered vertices and authored guide dimensions introduce no personal sculpt resource.
 * @evidence contracts/common.md#meaningful-documentation States immutable ownership, seed convention and off-surface guide meaning.
 * @evidence contracts/modeling.md#spatial-conventions Positions and guide points are head-frame metres; indices retain native winding.
 * @evidence contracts/modeling.md#shared-boundaries The host, positions and indices describe the same source state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries an existing skin course input.
 * @evidenceExclude contracts/modeling.md#parameter-channels The relief owner defines numerical traits.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The relief owners observe their skin.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source landmark registration remains with the relief owner.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart compiler admits native support.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no public shaping input.
 * @author Samchon
 */
export interface IHumanFaceSkinMaterialCourseInput {
  /** Immutable current native XYZ positions in metres. */
  positions: readonly number[];

  /** Native triangle winding over these positions. */
  indices: readonly number[];

  /** Current-state position and normal owner. */
  host: IHumanFaceSkinHost;

  /** Ordered anatomical registration vertices, with the seed identity first. */
  supportVertices: readonly number[];

  /** Internal source-relative guide, including authored off-surface dimensions. */
  guide: readonly (readonly number[])[];
}
