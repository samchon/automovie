import type { IAutoMovieHumanHeadMeasurement } from "../../../common/measure/IAutoMovieHumanHeadMeasurement";
import { readHumanHeadMeasurement } from "../../../common/measure/readHumanHeadMeasurement";
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
  const regions =
    rule.kind === "head-breadth" || rule.kind === "head-circumference"
      ? [rule.rightEar, rule.leftEar]
      : [];
  const head = readHumanFaceHeadSkin(context, landmarks, regions);
  if ("reason" in head) return head;
  return readHumanHeadMeasurement(head, rule).metres * 1000;
}
