import type { IAutoMovieHumanHeadMeasurement } from "../../../common/measure/IAutoMovieHumanHeadMeasurement";
import type { IAutoMovieHumanHeadSkin as ImportedIAutoMovieHumanHeadSkin } from "../../../common/measure/IAutoMovieHumanHeadSkin";
import { readHumanHeadMeasurement } from "../../../common/measure/readHumanHeadMeasurement";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceHeadSkin } from "./readHumanFaceHeadSkin";

/**
 * Read one ANSUR II head rule (`HUMAN_HEAD_MEASUREMENTS`) on the build's final skin, in millimetres: the same instrument the person editor reads the head with (`readHumanHeadMeasurement`), handed the face's final posed skin with the basis's named skin points and areas.
 *
 * The skin comes from `readHumanFaceHeadSkin`. Every point and area the rule names is looked up first: one the basis does not declare returns the gap "missing landmark: <name>" or "missing region: <name>" instead of reading, so a basis without the head view's registrations (the standalone face editor's) reports the rule unavailable by name.
 *
 * @evidence contracts/common.md#principled-implementation Required named source landmarks/regions qualify the shared head instrument before its metre result converts to millimetres.
 * @evidence contracts/common.md#clear-and-simple-design Face and Person head measurements delegate to the same rule owner and final-skin seam.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent registrations remain gaps rather than inferred landmarks; direct instrument refusal propagates for report assembly to classify.
 * @evidence contracts/common.md#meaningful-documentation Requested rule units convert once and the instrument's geometry qualification remains unchanged.
 * @evidence contracts/performance.md#efficient-algorithms Registration checks and current-skin copying add to the selected head instrument's actual cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical readHumanHeadMeasurement avoids a second face-only implementation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned temporary skin copies leave after the scalar read; source registration remains borrowed.
 *
 * @author Samchon
 */
export function readHumanFaceHeadMeasurement(
  context: IHumanFaceMeasurementContext,
  rule: IAutoMovieHumanHeadMeasurement,
): number | IHumanFaceMeasurementGap {
  const landmarks: string[] =
    rule.kind === "landmark-distance"
      ? [rule.from, rule.to]
      : rule.kind === "tragion-top"
        ? [rule.tragion]
        : rule.kind === "head-breadth"
          ? []
          : [rule.glabella, rule.tragion];
  const regions: string[] =
    rule.kind === "head-breadth" || rule.kind === "head-circumference"
      ? [rule.rightEar, rule.leftEar]
      : [];
  const head: ImportedIAutoMovieHumanHeadSkin | IHumanFaceMeasurementGap =
    readHumanFaceHeadSkin(context, landmarks, regions);
  if ("reason" in head) return head;
  return readHumanHeadMeasurement(head, rule).metres * 1000;
}
