import { readHumanHeadMeasurement } from "../../../common/measure/readHumanHeadMeasurement";
import type { IAutoMovieHumanHeadMeasurement } from "../../../common/measure/IAutoMovieHumanHeadMeasurement";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceHeadSkin } from "./readHumanFaceHeadSkin";

/**
 * Read one ANSUR II head rule (`HUMAN_HEAD_MEASUREMENTS`) on the build's final
 * skin, in millimetres: the same instrument the person editor reads the head
 * with (`readHumanHeadMeasurement`), handed the face's final posed skin with
 * the basis's named skin points and areas.
 *
 * The skin comes from `readHumanFaceHeadSkin`. Every point and area the rule
 * names is looked up first: one the basis does not declare returns the gap
 * "missing landmark: <name>" or "missing region: <name>" instead of reading, so a basis without the head view's registrations (the standalone
 * face editor's) reports the rule unavailable by name.
 *
 * @evidence contracts/common.md#principled-implementation The face and the person read the head with one instrument, so a head measurement has one owner.
 * @evidence contracts/common.md#clear-and-simple-design One name check pass and one call of the shared instrument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing point or area returns its gap; nothing is substituted.
 * @evidence contracts/common.md#meaningful-documentation States the instrument, the skin it reads and both gaps.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the basis head frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule table cites each protocol.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader is not an input.
 * @author Samchon
 */
export function readHumanFaceHeadMeasurement(
  context: IHumanFaceMeasurementContext,
  rule: IAutoMovieHumanHeadMeasurement,
): number | IHumanFaceMeasurementGap {
  const landmarks =
    rule.kind === "landmark-distance"
      ? [rule.from, rule.to]
      : rule.kind === "tragion-top"
        ? [rule.tragion]
        : rule.kind === "head-breadth"
          ? []
          : [rule.glabella, rule.tragion];
  const regions = rule.kind === "head-breadth" || rule.kind === "head-circumference" ? [rule.rightEar, rule.leftEar] : [];
  const head = readHumanFaceHeadSkin(context, landmarks, regions);
  if ("reason" in head) return head;
  return readHumanHeadMeasurement(head, rule).metres * 1000;
}
