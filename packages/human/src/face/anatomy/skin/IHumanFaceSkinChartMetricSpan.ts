import type { IHumanFaceProjectedSkinSpan } from "./IHumanFaceProjectedSkinSpan";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";

/**
 * A native chart interval and its physical arc station.
 * The same head-frame endpoints determine length, Euclidean distance and
 * barycentric frame lookup; chart coefficient distance is not substituted.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChartMetricSpan
  extends IHumanFaceSkinChartSpan, IHumanFaceProjectedSkinSpan {}
