import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanTouchStance,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTouchStance } from "../compose/AutoMovieMotionHumanTouchStance";
import { pickUpAdjust } from "../handling/pickUpAdjust";
import type { pickUpPosture } from "../handling/pickUpPosture";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A touch reaches from its existing base when it can. A grounded performer
 * with an external target can take one step when the planted reach refuses.
 * The arm keeps the very same target and the step uses the pick-up's reach
 * adjustment, on the reach and return portions of the touch's clock.
 *
 * @param props The touch's standing reach and wrist goal.
 * @param mayStep Whether both feet bear the touch and the target is external.
 * @returns The stance and the corresponding base builder.
 * @throws {HumanRefusal} A planted-reach refusal when no allowed step closes it.
 */
export function touchStance(
  props: IAutoMovieMotionHumanTouchStance.IProps,
  mayStep: boolean,
): touchStance.IChosen {
  try {
    return {
      stance: AutoMovieMotionHumanTouchStance.solve(props),
      base: planted,
    };
  } catch (error) {
    if (
      !mayStep ||
      !(error instanceof HumanRefusal) ||
      error.kind !== "reach" ||
      error.axis !== "target"
    )
      throw error;
    const {
      body,
      standing,
      side,
      share,
      wrist,
    }: IAutoMovieMotionHumanTouchStance.IProps = props;
    const length: number = body.measure.upperArm + body.measure.forearm;
    const feet: IAutoMovieMotionHumanRise.Stance | undefined = props.feet;

    if (feet === undefined) throw error;
    const placements: NonNullable<IAutoMovieMotionHumanTouchStance.IProps["placements"]> =
      (posture: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanRise.Stance => ({
        left: {
          ankle: posture.limbs.leftLeg?.point ?? feet.left.ankle,
          rotation: posture.limbs.leftLeg?.rotation ?? feet.left.rotation,
        },
        right: {
          ankle: posture.limbs.rightLeg?.point ?? feet.right.ankle,
          rotation: posture.limbs.rightLeg?.rotation ?? feet.right.rotation,
        },
      });
    const candidate = (
      posture: IAutoMovieMotionHumanPosture,
      heels?: IAutoMovieMotionHumanTouchStance.IProps["heels"],
    ): IAutoMovieMotionHumanTouchStance.IStance =>
      AutoMovieMotionHumanTouchStance.solve({
        ...props,
        standing: posture,
        feet: placements(posture),
        placements,
        ...(heels === undefined ? {} : { heels }),
      });
    const accept = (posture: IAutoMovieMotionHumanPosture): boolean => {

      try {
        candidate(posture);
        return true;
      } catch (failure) {
        if (failure instanceof HumanRefusal && failure.kind === "reach" && failure.axis === "target")
          return false;
        throw failure;
      }
    };
    const stride: pickUpPosture.IStance | null = pickUpAdjust.stepped(
      { body },
      side,
      wrist(standing, 0),
      {
        posture: standing,
        at: (): IAutoMovieMotionHumanPosture => standing,
        lower: (
          posture: IAutoMovieMotionHumanPosture,
        ): IAutoMovieMotionHumanPosture => posture,
      },
      undefined,
      share * length,
      accept,
    );
    if (stride === null || stride.step === undefined) throw error;
    const landed: number = stride.step.on;
    const stance: IAutoMovieMotionHumanTouchStance.IStance = candidate(stride.posture,
      (clock: IAutoMovieMotionClock, seconds: number): number => {
        // A foot rolls onto the forefoot after it lands, and returns flat
        // before the reverse swing leaves the ground.
        const ready: number = clock.at("ready");
        const relax: number = clock.at("relax");
        const up: number = clock.at("start") + (ready - clock.at("start")) * landed;
        const flat: number = relax + (clock.at("end") - relax) * (1 - landed);
        return minimumJerk.share((seconds - up) / (ready - up)) -
          minimumJerk.share((seconds - relax) / (flat - relax));
      },
    );
    return {
      stance,
      base: (
        _context: touchStance.IContext,
        clock: IAutoMovieMotionClock,
      ): IAutoMovieMotionHumanActionPlan => {
        const ready: number = clock.at("ready");
        const relax: number = clock.at("relax");
        return {
          duration: clock.duration,
          events: [],
          contacts: pickUpAdjust.plants(
            stride,
            ready,
            relax,
            clock.duration - relax,
            1,
          ),
          posture: (
            seconds,
            _channels,
            resolution,
          ): IAutoMovieMotionHumanPosture =>
            stride.at(
              clock.envelope(["start", "ready"], ["relax", "end"], seconds),
              resolution,
            ),
        };
      },
    };
  }
}

/** Types shared by the touch and its base selection. */
export namespace touchStance {
  /** The entry and optional carrier a base may read. */
  export type IContext = Pick<
    IAutoMovieMotionHumanActionContext,
    "carrier" | "entry"
  >;

  /** The chosen stance and the same base it was solved on. */
  export interface IChosen {
    /** The pose and remaining motions of the shoulder, heels and trunk. */
    stance: IAutoMovieMotionHumanTouchStance.IStance;

    /** Builds the base over the touch's clock and its own support windows. */
    base: (
      context: IContext,
      clock: IAutoMovieMotionClock,
    ) => IAutoMovieMotionHumanActionPlan;
  }
}

/** Builds the ordinary held or carried base. */
function planted(
  context: touchStance.IContext,
  clock: IAutoMovieMotionClock,
): IAutoMovieMotionHumanActionPlan {
  return AutoMovieMotionHumanBase.under(context, clock.duration);
}
