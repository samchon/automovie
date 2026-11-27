import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFlight,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAudit } from "../../audit/AutoMovieMotionHumanAudit";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import type { jumpLanding } from "./jumpLanding";

/**
 * Set an angular target for the physical solve and admit the handed-back
 * airborne endpoint against the planned planted footprints.
 *
 * @param body The body used to place the sole contact landmarks.
 * @param landed The landing's world footprints and touchdown root.
 * @param centre The planned touchdown COM in world metres.
 * @param headingChange Signed degrees from flight heading to landing heading.
 * @param subject The performer, for a located refusal.
 * @returns The terminal target and its check on the returned rotation.
 */
export function jumpTouchdownRotation(
  body: IAutoMovieMotionHumanBody,
  landed: jumpLanding.ILanding,
  centre: IAutoMovieVector3,
  headingChange: number,
  subject: string,
): jumpTouchdownRotation.IRequirement {
  const turn: IAutoMovieQuaternion = HumanFrame.turn(headingChange);
  let radius: number = Vector3.length(Vector3.subtract(centre, landed.touched));
  for (const side of ["left", "right"] as const)
    for (const point of ["heel", "ball", "toe"] as const)
      radius = Math.max(
        radius,
        Vector3.length(
          Vector3.subtract(
            centre,
            HumanFoot.point(body, side, point, landed.feet[side]),
          ),
        ),
      );

  const limit: number = AutoMovieMotionHumanAudit.LIMITS.jump;
  const angularTolerance: number =
    (2 * Math.asin(Math.min(1, limit / (4 * radius)))) / Math.sqrt(3);
  return {
    turnedLanding: headingChange !== 0,
    angularTolerance,
    check: (actual: IAutoMovieHumanPostureRotation): void => {
      const angle: number = Quaternion.angle(actual.turn, turn);
      const pivotDelta: IAutoMovieVector3 = Vector3.subtract(
        actual.about,
        centre,
      );
      const pivotDrift: number = Vector3.length(
        Vector3.subtract(
          pivotDelta,
          Quaternion.rotateVector(actual.turn, pivotDelta),
        ),
      );
      const displacement: number =
        pivotDrift + 2 * radius * Math.sin(angle / 2);
      if (!(displacement <= limit))
        throw new HumanRefusal({
          kind: "reach",
          axis: "turns",
          value: displacement,
          reason:
            "the flight's terminal rotation cannot meet its planted landing within the continuity limit",
          fix: "choose a compatible flight and landing outcome",
          performer: subject,
          act: "jump",
        });
    },
  };
}

/** Geometry and read-back for a planted touchdown on the native jump's clock. */
export namespace jumpTouchdownRotation {
  /**
   * Native jump ending at a planted stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the turned ground phase, physical shooting angle and actual handed-back rotation.
   * @evidence contracts/development/design.md#principled-representation Holds the target and read-back check derived from the same known landing geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The shape is the flight record's own `IAutoMovieMotionHumanFlight.ITouchdown`; the jump writes it on the native flight request it declares (`touchdown`), where the flight pass reads it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The required angle is a target for the original solver and grants no ability to override the physical result.
   */
  export type IRequirement = IAutoMovieMotionHumanFlight.ITouchdown;
}
