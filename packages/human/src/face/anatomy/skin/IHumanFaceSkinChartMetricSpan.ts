import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";
import type { IHumanFaceProjectedSkinSpan } from "./IHumanFaceProjectedSkinSpan";

/**
 * A native chart interval and its physical arc station.
 * The same head-frame endpoints determine length, Euclidean distance and
 * barycentric frame lookup; chart coefficient distance is not substituted.
 *
 * @evidence contracts/common.md#principled-implementation Actual native endpoints and their accumulated hypot lengths define one physical source course.
 * @evidence contracts/common.md#clear-and-simple-design Joins native support and metric readings without another curve definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No chart-distance proxy or geodesic interpretation enters.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes physical metric from chart coefficients.
 * @evidence contracts/modeling.md#spatial-conventions Positions and lengths remain head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries Native barycentric interval support remains with the inherited frame reader.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The attached consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries geometric length, not clinical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source support and contact owners admit construction.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal curve input.
 * @author Samchon
 */
export interface IHumanFaceSkinChartMetricSpan extends IHumanFaceSkinChartSpan, IHumanFaceProjectedSkinSpan {}
