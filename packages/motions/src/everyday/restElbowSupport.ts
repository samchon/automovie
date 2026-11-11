import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { handGoals } from "./handGoals";
import type { rest } from "./rest";

/**
 * The supporting hand's rest goal: its palm under the other arm's elbow (the
 * olecranon region) as that arm holds its chin-rest goal, fingers toward the
 * outside of that elbow.
 *
 * @param body The body.
 * @param posture The standing posture.
 * @param side The supporting hand.
 * @param chin The other hand's chin-rest goal.
 * @param elbow The supporting arm's bend hint, world metres.
 * @returns The goal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which surface lies where and what the place depends on.
 * @evidence contracts/development/implementation.md#principled-implementation The supported arm is solved for its own goal first, so the palm is laid on the elbow that arm really has.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One arm solve, one region placement and one hand turn.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The elbow is read from the solved pose, never estimated from the hint.
 * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `handGoals` for the supported arm and the engine's surface placement for its elbow.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function restElbowSupport(
  body: IHumanBody,
  posture: IHumanPosture,
  side: HumanHand.Side,
  chin: rest.IGoal,
  elbow: IAutoMovieVector3,
): rest.IGoal {
  const other: HumanHand.Side = side === "left" ? "right" : "left";
  const solved: IHumanPosture = handGoals(
    body,
    {
      ...posture,
      joints: { ...posture.joints, ...HumanHand.shape(other, chin.shape) },
    },
    [
      {
        side: other,
        surface: chin.surface,
        shape: chin.shape,
        point: chin.point,
        rotation: chin.rotation,
        bend: chin.elbow,
      },
    ],
  );
  const bones = poseBones(body, resolveHumanPosture(body, solved));
  const frame =
    body.surfaces.regions[other === "left" ? "elbowLeft" : "elbowRight"];
  const placed = resolveAutoMovieHumanoidSurfaces.place(
    frame,
    bones.get(frame.bone)!,
  );
  const outward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
    { x: other === "left" ? 1 : -1, y: 0, z: 0 },
  );
  return {
    surface: "palm",
    shape: "relaxed",
    point: placed.point,
    rotation: HumanHand.rotation(side, {
      fingers: outward,
      palm: Vector3.scale(placed.normal, -1),
    }),
    elbow,
  };
}
