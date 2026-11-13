import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Where a hand-to-face task holds a sheet to be read: the one task whose
 * place is not a region of the face but a point on the gaze, split from
 * `handToFace` so each file holds one responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the place is and why it stands apart.
 * @evidence contracts/development/design.md#principled-representation The reading distance and the eyes' depression as named data beside the place they give.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two constants and the place; read by `handToFace` and cited by the lexicon's watch look.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sheet or body is named: the place follows the eyes and the head.
 */
export namespace handToFaceSheet {
  /** The reading distance from the eyes to a held text, metres (Bababekova et al. 2011, mean for text). */
  export const READING: number = 0.362;

  /** The eyes' depression below the head's own line when reading, degrees (provisional). */
  export const GAZE: number = 15;

  /**
   * Where a held sheet is read: on the line from the eyes pitched down by
   * the head's flexion and the eyes' depression, at the reading distance,
   * facing back at the eyes.
   *
   * @param context The body.
   * @param posture The posture so far, whose head carries the eyes.
   * @param side The hand.
   * @returns The place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the line, the distance and the facing.
   * @evidence contracts/development/implementation.md#principled-implementation The eyes' midpoint on the posture's trunk, the reading distance of Bababekova et al. 2011 along the gaze line pitched by the head's flexion and the provisional eye depression.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolve and one line.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The distance and the depression are named constants.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanTrunk.resolve` and `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    context: Pick<IHumanActionContext, "body">,
    posture: IHumanPosture,
    side: HumanHand.Side,
  ): Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal"> {
    const bones = HumanTrunk.resolve(context.body, posture);
    const eyes: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(
        bones.get("leftEye")!.worldPosition,
        bones.get("rightEye")!.worldPosition,
      ),
      0.5,
    );
    const head = posture.joints.head ?? [0, 0, 0];
    const neck = posture.joints.neck ?? [0, 0, 0];
    const down: number = ((head[0] + neck[0] + GAZE) * Math.PI) / 180;
    const line: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
      {
        x: (side === "left" ? 1 : -1) * 0.05,
        y: -Math.sin(down),
        z: Math.cos(down),
      },
    );
    const unit: IAutoMovieVector3 = Vector3.normalize(line);
    return {
      point: Vector3.add(eyes, Vector3.scale(unit, READING)),
      normal: Vector3.scale(unit, -1),
    };
  }
}
