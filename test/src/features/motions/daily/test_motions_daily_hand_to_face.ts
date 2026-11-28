import { AutoMovieEnginePhysics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHandToFaceRows, IAutoMovieMotionHumanPosture, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanTrunk
} from "../../../../../packages/motions/src/everyday/internal/HumanTrunk";
import {
  coverFace
} from "../../../../../packages/motions/src/daily/internal/coverFace";
import {
  handToFaceRegion
} from "../../../../../packages/motions/src/daily/internal/handToFaceRegion";
import {
  handToFaceRows
} from "../../../../../packages/motions/src/daily/internal/handToFaceRows";
import {
  handToFaceSheet
} from "../../../../../packages/motions/src/daily/internal/handToFaceSheet";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  wipeTears
} from "../../../../../packages/motions/src/daily/internal/wipeTears";
import { AutoMovieMotionHumanTouchEffector } from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanTouchEffector";
import { handToFacePhone } from "../../../../../packages/motions/src/daily/internal/handToFacePhone";
import { HumanColliders } from "../../../../../packages/motions/src/posture/internal/HumanColliders";
import { HumanHand } from "../../../../../packages/motions/src/posture/internal/HumanHand";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

namespace part_hand_to_face_region {
  /** A place a hand-to-face task aims a hand at. */
  type IPlace = ReturnType<ReturnType<ReturnType<typeof handToFaceRegion>>>;

  /** Rounding of a forward-kinematics chain, metres and shares. */
  const ROUNDING: number = 1e-9;

  /**
   * `handToFaceRegion` reads where a hand-to-face task aims a hand: the face
   * region its row names, on the performer's own bones, its normal laid level
   * (the horizontal part, made unit) when the row stands its effector upright;
   * the sheet held before the eyes (`handToFaceSheet`) when the row names no
   * region.
   *
   * The body is built whole (`humanFixtureBody`): the region is placed by
   * forward kinematics over the rig and the surfaces.
   *
   * Scenarios, the average man standing quiet, the drinking row aimed at the
   * mouth:
   *
   * 1. Read with `level` the mouth's normal is the horizontal part of the plain
   *    reading's, of unit length, at the same point.
   * 2. With no region the place is the held sheet's.
   */
  export async function verify(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const context: IAutoMovieMotionHumanActionContext<object> =
      motionActionContext(body, {});
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const row: IAutoMovieMotionHumanHandToFaceRows.IRow =
      handToFaceRows.ROWS.drink;
    const plain: IPlace = handToFaceRegion(
      context,
      { ...row, level: false },
      bones,
    )("right", "mouth")(context.entry.posture, 0);
    const level: IPlace = handToFaceRegion(
      context,
      { ...row, level: true },
      bones,
    )("right", "mouth")(context.entry.posture, 0);
    const across: number = Math.hypot(plain.normal.x, plain.normal.z);
    const flat: IAutoMovieVector3 = {
      x: plain.normal.x / across,
      y: 0,
      z: plain.normal.z / across,
    };
    TestValidator.predicate(
      "levelled",
      vclose(level.point, plain.point, ROUNDING) &&
        vclose(level.normal, flat, ROUNDING) &&
        nclose(Math.hypot(level.normal.x, level.normal.z), 1, ROUNDING),
    );
    TestValidator.predicate(
      "the sheet",
      vclose(
        handToFaceRegion(context, row, bones)("right", null)(
          context.entry.posture,
          0,
        ).point,
        handToFaceSheet(context, context.entry.posture, "right").point,
        ROUNDING,
      ),
    );
  }
}

namespace part_hand_to_face_sheet {
  /** Rounding of a forward-kinematics chain, metres and degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * `handToFaceSheet` places a held sheet where the holding hand, its upper arm
   * hanging and its forearm swung up about the elbow, meets the reading
   * distance from the eyes (`READING`, 0.362 m, Bababekova et al. 2011), in the
   * vertical plane through its shoulder along the heading, facing back at the
   * eyes; `head` flexes the head the measured 35 degrees, or more where the
   * line of sight falls further below the head than the eyes can turn.
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
  export async function verify(): Promise<void> {
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
}

namespace part_rows {
  /**
   * `coverFace` and `wipeTears` are rows of `handToFace`, each fixing its own
   * preset.
   *
   * Scenarios:
   *
   * 1. Both are named for themselves and belong to the `handToFace` family.
   */
  export function verify(): void {
    TestValidator.equals(
      "the rows",
      [coverFace.name, coverFace.family, wipeTears.name, wipeTears.family],
      ["coverFace", "handToFace", "wipeTears", "handToFace"],
    );
  }
}

async function checkPhoneSupport(): Promise<void> {
  const row = handToFaceRows.ROWS.phone;
  for (const name of ["m-average", "f-small"] as const) {
    const body = await humanFixtureBody(name);
    for (const side of ["left", "right"] as const) {
      const joints: IAutoMovieJointPose[] = Object.entries(HumanHand.shape(side, row.effector.shape)).map(
        ([bone, angles]): IAutoMovieJointPose => ({ bone: bone as AutoMovieHumanoidBone, flexion: angles![0], abduction: angles![1], twist: angles![2] }),
      );
      const requested: Set<AutoMovieHumanoidBone> = new Set(joints.map((joint) => joint.bone));
      requested.add(side === "left" ? "leftHand" : "rightHand");
      const bones = poseBones(body, { skeleton: body.skeleton.id, root: null, joints }, undefined, requested);
      const ends: number[] = HumanColliders.placed(body, bones).flatMap((part) =>
        part.shapes.map((shape) => AutoMovieEnginePhysics.physicalShapeBounds(part.pose, shape).min.y),
      );
      const tool = handToFacePhone(body, side, row.effector);
      const point: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(body, bones, side, tool);
      const stated: number = body.measure.hand * row.effector.tool!.palm!;
      TestValidator.predicate(
        name + " " + side + " implied phone stands beyond the actual palm-side skin",
        nclose(Math.min(...ends) - point.y, stated, 1e-9),
      );
      TestValidator.predicate(
        name + " " + side + " implied handset uses the same laid hand directions",
        tool.shape === row.effector.shape && tool.facing === row.effector.facing && tool.along === row.effector.along,
      );
    }
  }
}

/**
 * Check face-region and held-sheet target placement and preset dispatch.
 *
 * Scenarios:
 *
 * 1. Level the mouth normal while preserving its point. When the preset has
 *    no region, use the held-sheet target.
 * 2. Place the sheet at reading distance in the right shoulder plane facing
 *    the eyes, and check the minimum head flexion.
 * 3. Identify the cover-face and wipe-tears rows by their own names and
 *    shared family.
 * 4. Place the unheld phone beyond the posed hand's palm-side support on both hands.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the displayed surface, anatomical frame, two typed presets and implied phone support.
 * @evidence contracts/development/testing.md#behavioral-verification The region and sheet readers use a posed canonical body, and the preset check inspects the registered rows. The phone case poses both hands for the two stored bodies and reads the actual effector point from their resolved bones.
 * @evidence contracts/development/testing.md#independent-expectations The face normal is reconstructed by horizontal projection. The measured eyes and shoulder supply distance, plane and facing expectations. The world-axis collider bounds of the posed hand give the phone's support plane independently of the support mapping used by the law.
 */
export async function test_motions_daily_hand_to_face(): Promise<void> {
  await part_hand_to_face_region.verify();
  await part_hand_to_face_sheet.verify();
  part_rows.verify();
  await checkPhoneSupport();
}
