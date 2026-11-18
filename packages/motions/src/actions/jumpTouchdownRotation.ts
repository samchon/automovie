import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAudit } from "../audit/AutoMovieMotionHumanAudit";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { jumpLanding } from "./jumpLanding";

/**
 * Admit the actual airborne endpoint against the planned turned footprints.
 * The same rigid-turn check works for a solved trajectory or an authored one.
 *
 * @param body The body used to place the sole contact landmarks.
 * @param landed The landing's world footprints and touchdown root.
 * @param centre The planned touchdown COM in world metres.
 * @param headingChange Signed degrees from flight heading to landing heading.
 * @param subject The performer, for a located refusal.
 * @returns The endpoint check called when the flight pass hands back its turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how a real flight endpoint is compared with the planted phase in world units.
 * @evidence contracts/development/implementation.md#principled-implementation A rotation error of θ moves a point at radius r by at most 2r sin(θ/2). The difference between authored and returned rotation centres adds the drift of the centre displacement under the returned turn. The project continuity limit bounds their sum for the root and the sole landmarks.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reduce the known terminal geometry to one radius, then check one rotation returned by flight planning.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses the actual residual against the existing motion continuity budget without modifying the computed flight, its angular momentum or the ground targets.
 * @evidence contracts/development/implementation.md#efficient-algorithms Evaluates six sole landmarks and the root once. The returned check reads one quaternion and one pivot, with no pose sampling or search.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The radius uses the landing's existing footprint placement and the same COM as the ballistic path, computed before the flight pass.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the chosen turn, centre, radius and subject with the jump plan. No body, pose or sample history is retained by the check.
 */
export function jumpTouchdownRotation(
  body: IAutoMovieMotionHumanBody,
  landed: jumpLanding.ILanding,
  centre: IAutoMovieVector3,
  headingChange: number,
  subject: string,
): (actual: IAutoMovieHumanPostureRotation) => void {
  const turn: IAutoMovieQuaternion = HumanFrame.turn(headingChange);
  let radius: number = Vector3.length(Vector3.subtract(centre, landed.touched));
  for (const side of ["left", "right"] as const)
    for (const point of ["heel", "mtp", "toe"] as const)
      radius = Math.max(
        radius,
        Vector3.length(
          Vector3.subtract(
            centre,
            HumanFoot.point(body, side, point, landed.feet[side]),
          ),
        ),
      );

  return (actual: IAutoMovieHumanPostureRotation): void => {
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
    const displacement: number = pivotDrift + 2 * radius * Math.sin(angle / 2);
    if (!(displacement <= AutoMovieMotionHumanAudit.LIMITS.jump))
      throw new HumanRefusal({
        kind: "reach",
        axis: "turns",
        value: displacement,
        reason:
          "the flight's terminal rotation cannot meet its turned landing within the continuity limit",
        fix: "choose a compatible flight and landing outcome",
        performer: subject,
        act: "jump",
      });
  };
}
