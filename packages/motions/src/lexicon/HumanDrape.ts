import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanDrape,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { HumanMountedFrame } from "./HumanMountedFrame";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrape>;

/**
 * The hanging joints, degrees: hips folded so the legs hang, shoulders flexed
 * so the arms hang, the neck bent (provisional).
 */
const HANGING: IAutoMovieMotionHumanPosture["joints"] = {
  leftUpperLeg: [90, 0, 0],
  rightUpperLeg: [90, 0, 0],
  leftLowerLeg: [10, 0, 0],
  rightLowerLeg: [10, 0, 0],
  leftUpperArm: [90, 0, 0],
  rightUpperArm: [90, 0, 0],
  leftLowerArm: [10, 0, 0],
  rightLowerArm: [10, 0, 0],
  neck: [30, 0, 0],
};

/**
 * Admit the times, lay the posture once, then sample.
 */
function planHumanDrape(context: Context): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanDrape = context.params;
  const lay: number = params.lay ?? 0.6;
  HumanBound.above("duration", params.duration, 0, "s");
  HumanBound.least("lay", lay, 0, "s");
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame.of(
    context.prop(params.on),
    params.on,
    params.frame,
  );
  const origin: IAutoMovieRigidTransform = carrier(context.start);
  const from: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
    context.entry.posture,
    origin,
    HumanMountedFrame.LOCAL,
  );
  const sign: number = (params.head ?? "left") === "left" ? 1 : -1;
  const lying: IAutoMovieMotionHumanPosture = {
    ...from,
    root: { x: 0, y: context.body.measure.chestDepth / 2, z: 0 },
    yaw: sign * 90,
    pitch: 90,
    roll: 0,
    joints: { ...HANGING },
    limbs: {},
  };
  const duration: number = lay + params.duration;
  return {
    duration,
    events: [{ name: "laid", share: lay / duration }],
    contacts: [
      {
        part: "seat",
        kind: "bear",
        from: lay / duration,
        to: 1,
        support: { kind: "prop", subject: params.on },
      },
    ],
    base: { kind: "lying" },
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const shown: IAutoMovieMotionHumanPosture =
        lay === 0
          ? lying
          : mixHumanPosture(
              from,
              lying,
              minimumJerk.share(Math.min(1, t / lay)),
            );
      return HumanMountedFrame.move(
        shown,
        HumanMountedFrame.LOCAL,
        carrier(context.start + t),
      );
    },
  };
}

/**
 * A limp body laid across a saddle (`IAutoMovieMotionHumanDrape`): in the
 * carrier contact's frame the body lies face down across the seat, its trunk
 * level and pointing to the head's side, the hips resting on the seat a trunk's
 * half depth above it and folded so the legs hang down the other side, the arms
 * and head hanging; it comes to lie so from the entry over `lay` by a
 * minimum-jerk share and is carried by the contact. Register `HumanDrape` to
 * use it.
 *
 * The author gives `seconds` of the drape after the laying movement; no natural
 * value is defined (provisional).
 */
export const HumanDrape: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanDrape> =
  {
    name: "drape",
    interrupts: {},
    plan: planHumanDrape,
  };
