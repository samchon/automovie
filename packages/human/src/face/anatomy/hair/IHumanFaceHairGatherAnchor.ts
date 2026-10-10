import type { IHumanFaceHairGatherAttachment } from "./IHumanFaceHairGatherAttachment";

/**
 * Derived scalp attachment selected by the neutral angular ray and carried to the current face.
 * Point is current head-frame metres; triangle is the original source triangle ordinal.
 * Barycentric weights retain the neutral hit for current transport, not a personal authoring coordinate.
 *
 * @author Samchon
 */
export interface IHumanFaceHairGatherAnchor extends IHumanFaceHairGatherAttachment {
  /** Neutral barycentric weights in source-corner order. */
  weights: [number, number, number];
}
