import { DEFAULT_HUMANOID_ROM, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../../compose/internal/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { pickUpAdjustShoulder } from "./pickUpAdjustShoulder";
import { pickUpAdjustStepped } from "./pickUpAdjustStepped";
import { pickUpAdjustTimed } from "./pickUpAdjustTimed";
import type { pickUpPosture } from "./pickUpPosture";

/**
 * How a standing reach adapts its body before its arm refuses a grip it still
 * misses (`pickUp`): the trunk turns toward the grip, and then one foot takes
 * one adjustment step toward it. Further than one step is a walk, the
 * composition's own.
 */
export namespace pickUpAdjust {
  /**
   * The longest adjustment step a reach takes, metres for a body of `STATURE`:
   * the median step of healthy adults reaching with a step to a target at 130
   * percent of the arm's length, 423.96 mm (Tomita et al. 2024, Neurorehabil
   * Neural Repair 38:176, Table 3, 13 adults aged 64.7 years); a body's own is
   * scaled by its stature over `STATURE`.
   */
  export const STEP: number = 0.42396;

  /**
   * The healthy control group's mean stature, metres, from Tomita et al.
   * (2024), Table 1.
   */
  export const STATURE: number = 1.714;

  /**
   * The shares of the reach's time at which an adjustment step's foot leaves
   * the floor and lands: 262.51 ms after the hand sets off and 454.62 ms later,
   * of a 993.46 ms reach with a step (Tomita et al. 2024, Tables 2 and 3,
   * medians).
   */
  export const STEPPING: readonly [number, number] = [
    262.51 / 993.46,
    (262.51 + 454.62) / 993.46,
  ];

  /**
   * A stance turned toward a grip its arm still misses: the trunk twists on the
   * pelvis toward the grip, the chest and the lumbar spine sharing the turn
   * (`AutoMovieMotionHumanTrunk.CHEST`), as far as their axial rotation allows
   * (DEFAULT_HUMANOID_ROM): the least turn that brings the shoulder within the
   * arm of the wrist's place on the grip, or else the turn that brings it
   * nearest. A person whose hand cannot reach a grip turns toward it first.
   *
   * @param context The action's context.
   * @param side The reaching arm.
   * @param grip Where the wrist must go on the grip, world metres.
   * @param stance The stance to turn: the entry's, or the entry lowered.
   * @returns The turned stance, its turn growing with the share of the way
   *   down.
   * @throws {Error} When the range-of-motion table gives the chest or the spine
   *   no twist.
   */
  export function turned(
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    grip: IAutoMovieVector3,
    stance: pickUpPosture.IStance,
  ): pickUpPosture.IStance {
    const range: (bone: TurnedRangeBone) => IAutoMovieAngleRange = (
      bone: TurnedRangeBone2,
    ): IAutoMovieAngleRange => {
      const twist: IAutoMovieAngleRange | null | undefined =
        DEFAULT_HUMANOID_ROM[bone]?.twist;
      if (twist === null || twist === undefined)
        throw new Error(`The range-of-motion table gives the ${bone} no twist`);
      return twist;
    };
    const share: Readonly<Record<ShareEntryItem, number>> = {
      chest: AutoMovieMotionHumanTrunk.CHEST,
      spine: 1 - AutoMovieMotionHumanTrunk.CHEST,
    };
    const held: (bone: TurnedHeldBone) => number = (
      bone: TurnedHeldBone2,
    ): number => stance.posture.joints[bone]?.[2] ?? 0;
    // The turn either way the two joints allow with what they hold.
    const most: number = Math.min(
      ...(["chest", "spine"] as const).map(
        (bone: TurnedMostBone): number =>
          (range(bone).max - held(bone)) / share[bone],
      ),
    );
    const least: number = Math.max(
      ...(["chest", "spine"] as const).map(
        (bone: TurnedLeastBone): number =>
          (range(bone).min - held(bone)) / share[bone],
      ),
    );
    const twist: (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
    ): IAutoMovieMotionHumanPosture => {
      if (degrees === 0) return posture;
      const add: (bone: TwistAddBone) => [number, number, number] = (
        bone: TwistAddBone2,
      ): [number, number, number] => {
        const at: readonly [number, number, number] = posture.joints[bone] ?? [
          0, 0, 0,
        ];
        return [at[0], at[1], at[2] + share[bone] * degrees];
      };
      return {
        ...posture,
        joints: { ...posture.joints, chest: add("chest"), spine: add("spine") },
      };
    };
    const readShoulder: ReturnType<typeof HumanTrunk.prepareResolve> =
      HumanTrunk.prepareResolve(
        context.body,
        new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
      );
    let prepared: ReturnType<typeof prepareHumanPoseResolution> | undefined =
      prepareHumanPoseResolution();
    const far: (degrees: number) => number = (degrees: number): number =>
      Vector3.length(
        Vector3.subtract(
          grip,
          pickUpAdjustShoulder(
            side,
            twist(stance.posture, degrees),
            readShoulder,
            prepared,
          ),
        ),
      );
    const limit: number =
      context.body.measure.upperArm + context.body.measure.forearm;
    // Out from no turn a degree at a time, either way: the first turn that
    // brings the shoulder within the arm is the least, and a turn past it
    // is never read.
    let best: number = 0;
    let nearest: number = far(0);
    for (
      let step: number = 1;
      nearest > limit && step <= Math.max(most, -least);
      step++
    )
      for (const degrees of [step, -step]) {
        if (nearest <= limit) break;
        if (degrees > most || degrees < least) continue;
        const d: number = far(degrees);
        if (d < nearest) {
          nearest = d;
          best = degrees;
        }
      }
    const turn: number = best;
    prepared = undefined;
    return {
      posture: twist(stance.posture, turn),
      at: (
        s: number,
        resolution?: IFK,
        projection?: IROM,
      ): IAutoMovieMotionHumanPosture =>
        twist(stance.at(s, resolution, projection), turn * s),
      lower: (
        posture: IAutoMovieMotionHumanPosture,
        s: number,
        resolution?: IFK,
        projection?: IROM,
      ): IAutoMovieMotionHumanPosture =>
        twist(stance.lower(posture, s, resolution, projection), turn * s),
    };
  }

  /** {@link pickUpAdjustStepped}, read through this namespace. */
  export const stepped: typeof pickUpAdjustStepped = pickUpAdjustStepped;

  /**
   * Both feet's plant windows over a pick up: each planted throughout, but a
   * foot that steps, planted from its landing on the way down to its lifting on
   * the way back, the stance's share mapped to the pick up's seconds through
   * its minimum-jerk descent over the reach and return after the lift.
   *
   * @param stance The stance the pick up took, if any.
   * @param reach The reach's length, seconds.
   * @param end When the lift ends, seconds.
   * @param up The return's length, seconds.
   * @param share The share of the way down the stance holds at the lift's end,
   *   from which the return goes up (`pickUpLift.IRaise.share`): 1 where the
   *   lift does not straighten it.
   * @param planted The feet the entry bears on and the frame each bears on,
   *   when the caller reads its entry: a foot the entry holds off any support
   *   (a seated body's hanging foot) keeps no plant window unless it steps, and
   *   a planted foot keeps its own support frame. Both feet on the ground when
   *   absent.
   * @returns The windows, shares of the pick up's length.
   */
  export function plants(
    stance: pickUpPosture.IStance | null,
    reach: number,
    end: number,
    up: number,
    share: number,
    planted?: ReadonlyMap<
      IAutoMovieMotionHumanContactWindow["part"],
      IAutoMovieMotionHumanContactWindow["support"]
    >,
  ): IAutoMovieMotionHumanContactWindow[] {
    const duration: number = end + up;
    // A time share of the reach, and the second of the return at which the
    // way back, from `share` down to none, passes the share of the way it
    // had then.
    const down: (time: number) => number = (time: number): number =>
      (reach * time) / duration;
    const back: (time: number) => number = (time: number): number =>
      (end + up * pickUpAdjustTimed(1 - AutoMovieEngineMotionSampling.minimumJerkShare(time) / share)) /
      duration;
    return (["left", "right"] as const).flatMap(
      (foot: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow[] => {
        const part: PlantsPart = foot === "left" ? "leftFoot" : "rightFoot";
        const ground: IAutoMovieMotionHumanContactWindow["support"] = {
          kind: "ground",
        };
        const step: pickUpPosture.IStance["step"] = stance?.step;
        if (step === undefined || step.side !== foot) {
          // The foot keeps the entry's contact: its own support frame, or
          // none for a foot the entry holds off any support.
          if (planted === undefined)
            return [{ part, kind: "plant", from: 0, to: 1, support: ground }];
          const kept:
            | IAutoMovieMotionHumanContactWindow["support"]
            | undefined = planted.get(part);
          return kept === undefined
            ? []
            : [{ part, kind: "plant", from: 0, to: 1, support: kept }];
        }
        return [
          ...(step.off > 0
            ? [
                {
                  part,
                  kind: "plant" as const,
                  from: 0,
                  to: down(step.off),
                  support: ground,
                },
              ]
            : []),
          {
            part,
            kind: "plant",
            from: down(step.on),
            to: back(step.on),
            support: ground,
          },
          ...(step.off > 0
            ? [
                {
                  part,
                  kind: "plant" as const,
                  from: back(step.off),
                  to: 1,
                  support: ground,
                },
              ]
            : []),
        ];
      },
    );
  }

  /**
   * The least angle from the facing at which a target is stepped toward with
   * the foot on its side, degrees: every free step to the first lateral
   * direction of a center-out array, 30 degrees off straight ahead, was taken
   * with the ipsilateral leg, while steps straight ahead were taken with either
   * (Charalambous et al. 2024, bioRxiv 10.1101/2024.04.10.588947, Experiment 1,
   * 12 adults: Fig. 1a, regions CA at 12 and RA at 1 and 2 o'clock; Fig. 2a).
   * Nearer the midline no measured band decides, so the foot is chosen by the
   * step itself (`stepped`).
   */
  export const LATERAL: number = 30;
}

/** The alternatives of `PlantsPart`'s site. */
type PlantsPart = "leftFoot" | "rightFoot";

/** The alternatives of `TwistAddBone2`'s site. */
type TwistAddBone2 = "chest" | "spine";

/** The alternatives of `TwistAddBone`'s site. */
type TwistAddBone = "chest" | "spine";

/** The alternatives of `TurnedLeastBone`'s site. */
type TurnedLeastBone = "chest" | "spine";

/** The alternatives of `TurnedMostBone`'s site. */
type TurnedMostBone = "chest" | "spine";

/** The alternatives of `TurnedHeldBone2`'s site. */
type TurnedHeldBone2 = "chest" | "spine";

/** The alternatives of `TurnedHeldBone`'s site. */
type TurnedHeldBone = "chest" | "spine";

/** The alternatives of `ShareEntryItem`'s site. */
type ShareEntryItem = "chest" | "spine";

/** The alternatives of `TurnedRangeBone2`'s site. */
type TurnedRangeBone2 = "chest" | "spine";

/** The alternatives of `TurnedRangeBone`'s site. */
type TurnedRangeBone = "chest" | "spine";

/** Same-person exact FK loan borrowed by an actual adjusted stance invocation. */
type IFK = Parameters<pickUpPosture.IStance["at"]>[1];

type IROM = Parameters<pickUpPosture.IStance["at"]>[2];
