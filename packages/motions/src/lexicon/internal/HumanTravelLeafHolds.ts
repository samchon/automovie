import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTravelLeaf,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import type { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanTravelLeaf } from "./HumanTravelLeaf";

/*
 * Whether the arm keeps the hand on the handle from a posture: its own fit
 * shows the wrist within `HumanTravelLeaf.HOLD` of where the hold asks it.
 *
 * Part of `HumanTravelLeaf.openDoor`'s plan, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `holds`.
 */
export function HumanTravelLeafHolds(
  prepared: HumanTravelLeafHolds.IPrepared,
): HumanTravelLeafHolds.Holds {
  const { context, body, side, grip }: HumanTravelLeafHolds.IPrepared =
    prepared;
  const handBone: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
  const holds: (
    posture: IAutoMovieMotionHumanPosture,
    t: number,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection: ReturnType<typeof prepareHumanPostureProjection>,
  ) => boolean = (
    posture: IAutoMovieMotionHumanPosture,
    t: number,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection: ReturnType<typeof prepareHumanPostureProjection>,
  ): boolean => {
    const goal: IAutoMovieHumanLimbGoal = HumanMountRider.hold(
      body,
      side,
      posture,
      grip(context.start + t),
      1,
      {},
    ).arm;
    const pose: ReturnType<typeof resolveHumanPosture.seeded>["pose"] =
      resolveHumanPosture.seeded(
        body,
        { ...posture, limbs: { [`${side}Arm`]: goal } },
        undefined,
        {},
        resolution,
        handBone,
        projection,
      ).pose;
    const wrist: IAutoMovieVector3 = poseBones(
      body,
      pose,
      resolution(),
      handBone,
    ).get(`${side}Hand`)!.worldPosition;
    return (
      Vector3.length(Vector3.subtract(wrist, goal.point)) <=
      HumanTravelLeaf.HOLD
    );
  };
  return holds;
}

/*
 * The `holds` of `HumanTravelLeaf.openDoor`'s plan and what it reads.
 */
export namespace HumanTravelLeafHolds {
  /*
   * Whether the hand keeps the handle from a posture at a second.
   */
  export type Holds = (
    posture: IAutoMovieMotionHumanPosture,
    t: number,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection: ReturnType<typeof prepareHumanPostureProjection>,
  ) => boolean;

  /*
   * What `HumanTravelLeaf.openDoor`'s plan prepared for its `holds`.
   */
  export interface IPrepared {
    /*
     * The plan's action context.
     */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTravelLeaf.IParams>;

    /*
     * The plan's body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The opening hand.
     */
    side: AutoMovieHumanSide;

    /*
     * The handle's hold at a film second.
     */
    grip: (film: number) => Parameters<typeof HumanMountRider.hold>[3];
  }
}
