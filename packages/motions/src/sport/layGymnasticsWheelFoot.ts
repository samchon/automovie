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

import { AutoMovieMotionHumanFootRelax } from "../compose/AutoMovieMotionHumanFootRelax";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The laid foot of a wheel's bearing window (`GymnasticsWheelPlants`): the
 * foot bears on its ball where it came down, pivots there as the body turns
 * over it (a round-off's quarter turn, read off the posture's heading), and
 * where its shank leans past the ankle's range its heel rises about the
 * ball and it rolls onto the edge its window declares
 * (`AutoMovieMotionHumanFootRelax`, `HumanFoot.edge`). A rolled forefoot
 * whose colliders would reach below the floor is raised by as much, so the
 * foot rests on the floor rather than in it. The plants read it once per
 * key.
 *
 * @param body The body.
 * @param side The foot.
 * @param down The carried foot where its window opens.
 * @param yaw The posture's heading there, degrees.
 * @param edge The edge the window declares held, if any.
 * @returns The leg goal at a posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the ball, the turn, the rocker, the edge and the floor.
 * @evidence contracts/development/implementation.md#principled-implementation A planted foot keeps its ball and turns about it; past the ankle's range it rolls onto its forefoot's border; the lowest collider of the foot and toes is kept at the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pivot, relax, one collider reading, one raise.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot clear of the floor is not moved.
 * @evidence contracts/development/implementation.md#efficient-algorithms One resolve and one collider reduction per call; the plants call it once per key.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The foot's pivot, the relaxed placement, the leg goal and the collider minima.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the ball, the heading and one collider reader.
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
      AutoMovieMotionHumanFootRelax.of(
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
