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

/** The alternatives of `TouchStanceContext`'s site. */
type TouchStanceContext = "carrier" | "entry";

/**
 * A touch's stance, chosen between two candidates in this order as Vahrenkamp
 * et al. 2013's Algorithm 1 tries base poses
 * (`AutoMovieMotionHumanTouchStance.choose`): the existing base, and, for a
 * grounded performer with an external target, one step. The arm keeps the very
 * same target and the step uses the pick-up's reach adjustment, on the reach
 * and return portions of the touch's clock.
 *
 * @param props The touch's standing reach and wrist goal.
 * @param mayStep Whether both feet bear the touch and the target is external.
 * @returns The stance and the corresponding base builder.
 * @throws {HumanRefusal} The planted reach's refusal, followed by the step's,
 *   when neither candidate reaches.
 */
export function touchStance(
  props: IAutoMovieMotionHumanTouchStance.IProps,
  mayStep: boolean,
): touchStance.IChosen {
  const feet: IAutoMovieMotionHumanRise.Stance | undefined = props.feet;
  return AutoMovieMotionHumanTouchStance.choose<
    touchStance.Base,
    touchStance.IChosen
  >({
    candidates:
      mayStep && feet !== undefined ? ["planted", "stepped"] : ["planted"],
    reach: (base: touchStance.Base): touchStance.IChosen =>
      base === "planted"
        ? {
            stance: AutoMovieMotionHumanTouchStance.solve(props),
            base: planted,
          }
        : stepped(props, feet!),
  });
}

/** Types shared by the touch and its base selection. */
export namespace touchStance {
  /** The entry and optional carrier a base may read. */
  export type IContext = Pick<
    IAutoMovieMotionHumanActionContext,
    TouchStanceContext
  >;

  /** The candidate bases a touch's stance is chosen among. */
  export type Base = "planted" | "stepped";

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

/**
 * The stepped candidate: the pick-up's one step toward the wrist's goal whose
 * landed stance reaches, its feet rolling onto the forefeet after they land.
 *
 * @throws {HumanRefusal} A reach refusal when no step of the adjustment lands a
 *   stance that reaches.
 */
function stepped(
  props: IAutoMovieMotionHumanTouchStance.IProps,
  feet: IAutoMovieMotionHumanRise.Stance,
): touchStance.IChosen {
  const {
    body,
    standing,
    side,
    share,
    wrist,
  }: IAutoMovieMotionHumanTouchStance.IProps = props;
  const length: number = body.measure.upperArm + body.measure.forearm;
  const placements: NonNullable<
    IAutoMovieMotionHumanTouchStance.IProps["placements"]
  > = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanRise.Stance => ({
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
    (posture: IAutoMovieMotionHumanPosture): boolean =>
      AutoMovieMotionHumanTouchStance.reaches(candidate, posture),
  );
  if (stride === null || stride.step === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "target",
      value: share * length,
      reason:
        "no step of the pick-up's reach adjustment lands a stance whose arm reaches the target",
      fix: "move the target nearer the performer",
    });
  const landed: number = stride.step.on;
  const stance: IAutoMovieMotionHumanTouchStance.IStance = candidate(
    stride.posture,
    (clock: IAutoMovieMotionClock, seconds: number): number => {
      // A foot rolls onto the forefoot after it lands, and returns flat
      // before the reverse swing leaves the ground.
      const ready: number = clock.at("ready");
      const relax: number = clock.at("relax");
      const up: number =
        clock.at("start") + (ready - clock.at("start")) * landed;
      const flat: number = relax + (clock.at("end") - relax) * (1 - landed);
      return (
        minimumJerk.share((seconds - up) / (ready - up)) -
        minimumJerk.share((seconds - relax) / (flat - relax))
      );
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
