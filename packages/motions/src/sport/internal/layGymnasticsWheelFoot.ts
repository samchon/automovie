import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanFootRelax } from "../../compose/internal/AutoMovieMotionHumanFootRelax";
import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * The laid foot of a wheel's bearing window (`GymnasticsWheelPlants`): the foot
 * bears on its ball where it came down, pivots there as the body turns over it
 * (a round-off's quarter turn, read off the posture's heading), and where its
 * shank leans past the ankle's range its heel rises about the ball and it rolls
 * onto the edge its window declares (`AutoMovieMotionHumanFootRelax`,
 * `HumanFoot.edge`). A rolled forefoot whose colliders would reach below the
 * floor is raised by as much, so the foot rests on the floor rather than in it.
 * The plants read it once per key.
 *
 * @param body The body.
 * @param side The foot.
 * @param down The carried foot where its window opens.
 * @param yaw The posture's heading there, degrees.
 * @param edge The edge the window declares held, if any.
 * @returns The leg goal at a posture.
 */
export function layGymnasticsWheelFoot(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  down: IAutoMovieResolvedBone,
  yaw: number,
  edge?: IAutoMovieVector3,
): (posture: IAutoMovieMotionHumanPosture) => IAutoMovieHumanLimbGoal {
  const heading: number = HumanFoot.heading(down.worldRotation);
  const ball: IAutoMovieVector3 = HumanFoot.point(body, side, "ball", {
    ankle: down.worldPosition,
    rotation: HumanFoot.rotation(heading, 0),
  });
  const bones: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([`${side}Foot`, `${side}Toes`]);
  const minima: ReturnType<typeof HumanColliders.prepareMinima> =
    HumanColliders.prepareMinima(body, [bones]);
  return (posture: IAutoMovieMotionHumanPosture): IAutoMovieHumanLimbGoal => {
    const placed: IAutoMovieMotionHumanFoot.IPlacement =
      AutoMovieMotionHumanFootRelax(
        body,
        posture,
        side,
        HumanFoot.pivot(
          body,
          side,
          "ball",
          ball,
          heading + (posture.yaw - yaw),
          0,
        ),
        1,
        true,
        true,
        edge,
      );
    const low: number = minima(
      poseBones(
        body,
        resolveHumanPosture(body, {
          ...posture,
          limbs: {
            [`${side}Leg`]: AutoMovieMotionHumanLeg.goal(
              body,
              posture,
              side,
              placed,
              true,
            ),
          },
        }),
        undefined,
        bones,
      ),
    )[0]!;
    return AutoMovieMotionHumanLeg.goal(
      body,
      posture,
      side,
      low < 0 && edge === undefined
        ? { ...placed, ankle: { ...placed.ankle, y: placed.ankle.y - low } }
        : placed,
      true,
    );
  };
}
