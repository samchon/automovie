import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IHumanFaceSkinMaterialGuidePoint } from "./IHumanFaceSkinMaterialGuidePoint";

/**
 * Registered source-reference geometry, current host and native relief guide.
 * Every station names its native vertex; optional reference-metre offsets are
 * registered through the same shape-only native reference. Material identity stays fixed
 * while the current host supplies physical lengths, positions and normals.
 *
 * @evidence contracts/common.md#principled-implementation Native support identities define the chart branch independently of guide width and distance queries.
 * @evidence contracts/common.md#clear-and-simple-design Carries the material-course compiler's geometry and source registration together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Internal registered vertices and authored guide dimensions introduce no personal sculpt resource.
 * @evidence contracts/common.md#meaningful-documentation States source-reference offset and current-host metric ownership.
 * @evidence contracts/modeling.md#spatial-conventions Reference offsets and current positions are head-frame metres; material coordinates are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries The source chart and current host retain the same registered native incidence.
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
  /** Native source reference and its producer-registered material disks. */
  surface: IAutoMovieHumanFaceBasisSurface;

  /** Shape-only reference geometry used once to register finite dimensioned guides. */
  referencePositions: readonly number[];

  /** Exact source-registered course domain, independent of current geometry. */
  domain: string;

  /** Current-state position and normal owner. */
  host: IHumanFaceSkinHost;

  /** Ordered anatomical registration vertices, with the seed identity first. */
  supportVertices: readonly number[];

  /** Ordered registered material stations and explicit source-reference offsets. */
  guide: readonly IHumanFaceSkinMaterialGuidePoint[];
}
