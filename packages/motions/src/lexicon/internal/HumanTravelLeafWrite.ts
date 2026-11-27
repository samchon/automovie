import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTravelLeaf,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { HumanMountRider } from "./HumanMountRider";
import { HumanTravelLeaf } from "./HumanTravelLeaf";

/*
 * Read the body and handle on the action clock, with optional closed digits.
 *
 * Part of `HumanTravelLeaf.openDoor`'s plan, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `write`.
 */
export function HumanTravelLeafWrite(
  prepared: HumanTravelLeafWrite.IPrepared,
): HumanTravelLeafWrite.Write {
  const {
    context,
    body,
    side,
    grip,
    shown,
    closed,
  }: HumanTravelLeafWrite.IPrepared = prepared;
  const bare: IAutoMovieMotionHumanPosture["joints"] = {};
  const write = (
    at: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    fingers?: IAutoMovieMotionHumanPosture["joints"],
  ): IAutoMovieMotionHumanPosture => {
    const heldDemand: boolean =
      channels === undefined ||
      channels.includes(`${side}Arm`) ||
      channels.includes(`${side}Hand`);
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const posture: IAutoMovieMotionHumanPosture = shown(
      at,
      heldDemand ? undefined : channels,
      read,
      projection,
    );
    if (!heldDemand) return posture;
    const held: ReturnType<typeof HumanMountRider.hold> = HumanMountRider.hold(
      body,
      side,
      posture,
      grip(context.start + at),
      fingers === undefined
        ? AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, at / HumanTravelLeaf.TAKE))
        : 1,
      fingers === undefined ? closed : bare,
      read,
      projection,
    );
    return {
      ...posture,
      joints: { ...posture.joints, ...(fingers ?? held.fingers) },
      limbs: { ...posture.limbs, [`${side}Arm`]: held.arm },
    };
  };
  return write;
}

/*
 * The `write` of `HumanTravelLeaf.openDoor`'s plan and what it reads.
 */
export namespace HumanTravelLeafWrite {
  /*
   * The body and handle at an action second.
   */
  export type Write = (
    at: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    fingers?: IAutoMovieMotionHumanPosture["joints"],
  ) => IAutoMovieMotionHumanPosture;

  /*
   * What `HumanTravelLeaf.openDoor`'s plan prepared for its `write`.
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

    /*
     * The plan's `shown`.
     */
    shown: IAutoMovieMotionHumanActionPlan["posture"];

    /*
     * The digits closed on the handle as the hand takes it.
     */
    closed: IAutoMovieMotionHumanPosture["joints"];
  }
}
