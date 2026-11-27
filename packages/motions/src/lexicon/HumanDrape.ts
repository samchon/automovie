import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanDrape,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { mixHumanPosture } from "../posture/internal/mixHumanPosture";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { humanDrapeLying } from "./internal/humanDrapeLying";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrape>;

/** Admit the times, lay the posture once, then sample. */
function planHumanDrape(context: Context): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanDrape = context.params;
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame(
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
  const drape: humanDrapeLying.IDrape = humanDrapeLying(
    params,
    context.body.measure.chestDepth,
    from,
  );
  const { lay, duration, lying } = drape;
  return {
    duration,
    events: drape.events,
    contacts: drape.contacts,
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
