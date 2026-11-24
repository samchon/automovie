import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanTrunk, handToFaceSheet } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a forward-kinematics chain, metres and degrees. */
const ROUNDING: number = 1e-9;

/**
 * `handToFaceSheet` places a held sheet where the holding hand, its upper arm
 * hanging and its forearm swung up about the elbow, meets the reading distance
 * from the eyes (`READING`, 0.362 m, Bababekova et al. 2011), in the vertical
 * plane through its shoulder along the heading, facing back at the eyes; `head`
 * flexes the head the measured 35 degrees, or more where the line of sight
 * falls further below the head than the eyes can turn.
 *
 * The body is built whole (`humanFixtureBody`): the eyes and the shoulder are
 * placed by forward kinematics.
 *
 * Scenarios, the average man standing quiet:
 *
 * 1. The right hand's sheet lies the reading distance from the eyes, in its
 *    shoulder's plane along the heading, facing the eyes.
 * 2. The head flexes at least `HEAD`.
 */
export async function test_unit_motions_daily_hand_to_face_sheet(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context: IAutoMovieMotionHumanActionContext<object> =
    motionActionContext(body, {});
  const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
  const bones: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
    body,
    posture,
  );
  const eyes: IAutoMovieVector3 = {
    x:
      (bones.get("leftEye")!.worldPosition.x +
        bones.get("rightEye")!.worldPosition.x) /
      2,
    y:
      (bones.get("leftEye")!.worldPosition.y +
        bones.get("rightEye")!.worldPosition.y) /
      2,
    z:
      (bones.get("leftEye")!.worldPosition.z +
        bones.get("rightEye")!.worldPosition.z) /
      2,
  };
  const sheet: ReturnType<typeof handToFaceSheet> = handToFaceSheet(
    context,
    posture,
    "right",
  );
  const toEyes: IAutoMovieVector3 = {
    x: eyes.x - sheet.point.x,
    y: eyes.y - sheet.point.y,
    z: eyes.z - sheet.point.z,
  };
  const distance: number = Math.hypot(toEyes.x, toEyes.y, toEyes.z);
  TestValidator.predicate(
    "the sheet",
    nclose(distance, handToFaceSheet.READING, ROUNDING) &&
      nclose(
        sheet.point.x,
        bones.get("rightUpperArm")!.worldPosition.x,
        ROUNDING,
      ) &&
      vclose(
        sheet.normal,
        {
          x: toEyes.x / distance,
          y: toEyes.y / distance,
          z: toEyes.z / distance,
        },
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "the head",
    handToFaceSheet.head(context, posture, "right") >= handToFaceSheet.HEAD,
  );
}
