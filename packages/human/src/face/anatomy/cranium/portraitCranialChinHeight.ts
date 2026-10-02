import { portraitFacialOvalVertices } from "./portraitFacialOvalVertices";

/**
 * Read the lowest point on the facial-oval boundary. Both trait
 * interpretation and cranial continuation use this same attachment datum;
 * a singled-out chin landmark cannot substitute for an asymmetric lower oval.
 *
 * @evidence contracts/common.md#principled-implementation The attachment datum is the lowest point of the facial-oval boundary, the minimum of the boundary vertices' heights, so an asymmetric lower oval cannot be misread through one named chin landmark; a missing or non-finite height refuses.
 * @evidence contracts/common.md#clear-and-simple-design One minimum over the shared oval list, used by both trait interpretation and cranial continuation so they cannot disagree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case; it reads the resident positions.
 * @evidence contracts/common.md#meaningful-documentation States why the datum is the oval's minimum and who shares it.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame millimetres in, the same unit out.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping portraitCranialChinHeight is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels portraitCranialChinHeight defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry portraitCranialChinHeight decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries portraitCranialChinHeight constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation portraitCranialChinHeight owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source portraitCranialChinHeight carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range portraitCranialChinHeight admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority portraitCranialChinHeight defines no input through which a caller shapes a human form.
 */
export function portraitCranialChinHeight(
  positions: readonly (readonly number[])[],
): number {
  const heights = portraitFacialOvalVertices.map((id) => positions[id]?.[1]);
  if (!heights.every(Number.isFinite))
    throw new Error("The cranial boundary requires finite resident heights.");
  return Math.min(...heights);
}
