import { AutoMovieEngineKinematics, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanSide, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanRest, IAutoMovieVector3 } from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { handGoals } from "./handGoals";

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
 */
export function restElbowSupport(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  chin: IAutoMovieMotionHumanRest.IGoal,
  elbow: IAutoMovieVector3,
): IAutoMovieMotionHumanRest.IGoal {
  const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const solved: IAutoMovieMotionHumanPosture = handGoals(
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
  const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"]["elbowLeft"] =
    body.surfaces.regions[other === "left" ? "elbowLeft" : "elbowRight"];
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture.seeded(body, solved, undefined, {}, resolution).pose,
    resolution(),
    new Set([frame.bone]),
  );
  const placed: ReturnType<typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace> =
    AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(frame, bones.get(frame.bone)!);
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
