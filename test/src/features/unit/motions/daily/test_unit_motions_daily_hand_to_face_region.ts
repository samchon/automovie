import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHandToFaceRows,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  handToFaceRegion,
  handToFaceRows,
  handToFaceSheet,
  poseBones,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

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
 * The body is built whole (`humanFixtureBody`): the region is placed by forward
 * kinematics over the rig and the surfaces.
 *
 * Scenarios, the average man standing quiet, the drinking row aimed at the
 * mouth:
 *
 * 1. Read with `level` the mouth's normal is the horizontal part of the plain
 *    reading's, of unit length, at the same point.
 * 2. With no region the place is the held sheet's.
 */
export async function test_unit_motions_daily_hand_to_face_region(): Promise<void> {
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
