import { coverFace, wipeTears } from "@automovie/motions/internal";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHandToFaceRows,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanTrunk,
  handToFaceDrinkable,
  handToFaceMirrored,
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

namespace part_hand_to_face_drinkable {
  /**
   * `handToFaceDrinkable` holds where the held thing's use is to be drunk at the
   * region touched: a use at the mouth drinks at the mouth, a use at a named
   * region drinks there, and no use, no place or a use ahead drinks nowhere.
   *
   * Scenarios:
   *
   * 1. A cup used at the mouth drinks at the mouth and not at the chin; a use at the
   *    chin drinks at the chin; no use, a use with no place and a use ahead drink
   *    nowhere.
   */
  export function verify(): void {
    TestValidator.equals(
      "drinkable",
      [
        handToFaceDrinkable(
          { line: "forearm", tip: "rim", at: "mouth" },
          "mouth",
        ),
        handToFaceDrinkable(
          { line: "forearm", tip: "rim", at: "mouth" },
          "chin",
        ),
        handToFaceDrinkable(
          { line: "forearm", tip: "rim", at: { region: "chin" } },
          "chin",
        ),
        handToFaceDrinkable(undefined, "mouth"),
        handToFaceDrinkable({ line: "forearm", tip: "rim" }, "mouth"),
        handToFaceDrinkable(
          { line: "forearm", tip: "rim", at: "ahead" },
          "mouth",
        ),
      ],
      [true, false, true, false, false, false],
    );
  }
}

namespace part_hand_to_face_mirrored {
  /**
   * `handToFaceMirrored` gives the region a row names for a hand: the right
   * hand's own, mirrored for the left by swapping a trailing `Right` and `Left`.
   *
   * Scenarios:
   *
   * 1. The right hand keeps the row's region.
   * 2. The left hand mirrors a sided region both ways.
   * 3. A midline region is the same for either hand.
   */
  export function verify(): void {
    TestValidator.equals(
      "the right hand",
      handToFaceMirrored("templeRight", "right"),
      "templeRight",
    );
    TestValidator.equals(
      "the left hand mirrored",
      [
        handToFaceMirrored("templeRight", "left"),
        handToFaceMirrored("templeLeft", "left"),
      ],
      ["templeLeft", "templeRight"],
    );
    TestValidator.equals(
      "a midline region",
      handToFaceMirrored("noseBridge", "left"),
      "noseBridge",
    );
  }
}

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

/**
 * `handToFace`'s unit contract: its regions, sheet, mirroring and drinkables.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `rows`: the cover face and wipe tears rows ride hand to face.
 * - `hand_to_face_drinkable`: `handToFaceDrinkable` holds where the held thing's
 *   use is to be drunk at the region touched:
 * - `hand_to_face_mirrored`: `handToFaceMirrored` gives the region a row names
 *   for a hand:
 * - `hand_to_face_region`: `handToFaceRegion` reads where a hand-to-face task
 *   aims a hand:
 * - `hand_to_face_sheet`: `handToFaceSheet` places a held sheet where the holding
 *   hand, its upper arm hanging and its forearm swung up about the elbow, meets
 *   the reading distance from the eyes (`READING`, 0.362 m, Bababekova et al.
 */
export async function test_unit_motions_daily_hand_to_face(): Promise<void> {
  part_hand_to_face_drinkable.verify();
  part_hand_to_face_mirrored.verify();
  await part_hand_to_face_region.verify();
  await part_hand_to_face_sheet.verify();
  part_rows.verify();
}
