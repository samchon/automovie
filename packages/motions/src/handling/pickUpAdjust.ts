import {
  DEFAULT_HUMANOID_ROM,
  Vector3,
  bracketedBisection,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { walkReach } from "../actions/walkReach";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { bendLower } from "../everyday/bendLower";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import type { pickUpPosture } from "./pickUpPosture";
import { pickUpStepReach } from "./pickUpStepReach";

/** A ready stance and the distance its adjustment foot travels, metres. */
interface IStep {
  /** Foot travel along the floor, metres. */
  length: number;

  /** The body and its retained step schedule. */
  stance: pickUpPosture.IStance;
}

/** The requested adjustment may lie beyond a single step. */
type Step = IStep | null;

/** The least foot travel, if its reach intersects the permitted course. */
type Travel = pickUpStepReach.Distance;

/** The opposite ankle is absent when the entry has no placement for it. */
type Ankle = IAutoMovieHumanLimbGoal | undefined;

/** Whether another admitted reach adjustment can use the stepped base. */
type Accept = (posture: IAutoMovieMotionHumanPosture) => boolean;
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
          shoulder(
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

  /**
   * A stance that takes one adjustment step toward a grip its arm still misses,
   * a foot stepping toward the wrist's place: the least step whose half, the
   * pelvis riding midway between the feet, brings the shoulder within the arm,
   * up to `STEP`. The foot leaves and lands at `STEPPING` of the reach's time
   * on a minimum-jerk path lifted by the walk's mid-swing clearance; the other
   * foot stays planted. A target `LATERAL` or more from the facing is stepped
   * toward with the foot on its side; nearer the midline, where people choose
   * either foot, with the foot whose step reaches shorter, the one that leaves
   * the most of `STEP` unused, and the reaching side's where both reach alike.
   * A grip one step does not bring within reach is none of a reach's: the
   * person steps closer first.
   *
   * @param context The action's body.
   * @param side The reaching arm.
   * @param wrist Where the wrist must go on the grip, world metres.
   * @param stance The stance to step from.
   * @param lifted Where the wrist must also come by the lift's end, world
   *   metres: the step then brings the shoulder within `bendLower.REACH` of the
   *   arm of it, the arm near and not at full extension, or else within the arm
   *   (`pickUpStance`). The grip alone when absent.
   * @param reach How near the shoulder must come to the wrist, metres. The
   *   arm's length when absent.
   * @param accept Optional admission of the actual stepped base, including
   *   another reach adjustment. If the direct step fails, success must stay
   *   monotone up to the permitted maximum.
   * @returns The stepped stance, or null when one step does not reach or the
   *   stance places no foot.
   */
  export function stepped(
    context: Pick<IAutoMovieMotionHumanActionContext<object>, "body">,
    side: AutoMovieHumanSide,
    wrist: IAutoMovieVector3,
    stance: pickUpPosture.IStance,
    lifted?: IAutoMovieVector3,
    reach?: number,
    accept?: Accept,
  ): pickUpPosture.IStance | null {
    const readShoulder: ReturnType<typeof HumanTrunk.prepareResolve> =
      HumanTrunk.prepareResolve(
        context.body,
        new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
      );
    const readHips: ReturnType<typeof HumanTrunk.prepareResolve> =
      HumanTrunk.prepareResolve(
        context.body,
        new Set<AutoMovieHumanoidBone>(["leftUpperLeg", "rightUpperLeg"]),
      );
    const from: IAutoMovieVector3 = shoulder(
      side,
      stance.posture,
      readShoulder,
    );
    const flat: IAutoMovieVector3 = {
      x: wrist.x - from.x,
      y: 0,
      z: wrist.z - from.z,
    };
    if (Vector3.length(flat) < 1e-9) return null;
    const toward: IAutoMovieVector3 = Vector3.normalize(flat);
    const arm: number =
      context.body.measure.upperArm + context.body.measure.forearm;
    const longest: number = (STEP * context.body.measure.stature) / STATURE;
    const clearance: number =
      walk.walking(walk.FROUDE.normal).lift * context.body.measure.hipHeight;

    // A target to the side is stepped toward with the foot on its side;
    // nearer the midline either foot is tried, the reaching side's first.
    const yaw: number = (stance.posture.yaw * Math.PI) / 180;
    const across: number = Vector3.dot(toward, {
      x: Math.cos(yaw),
      y: 0,
      z: -Math.sin(yaw),
    });
    const feet: readonly AutoMovieHumanSide[] =
      Math.abs(across) >= Math.sin((LATERAL * Math.PI) / 180)
        ? [across > 0 ? "left" : "right"]
        : [side, side === "left" ? "right" : "left"];

    // The places the step must bring within reach, each with its reach:
    // the grip within the arm, and the lifted place near full extension or
    // else within the arm.
    const wristReach: pickUpStepReach.IReach = [wrist, reach ?? arm];
    const reaches: readonly (readonly pickUpStepReach.IReach[])[] =
      lifted === undefined
        ? [[wristReach]]
        : [
            [wristReach, [lifted, bendLower.REACH * arm]],
            [wristReach, [lifted, arm]],
          ];
    const hips: ReturnType<typeof HumanTrunk.resolve> = readHips(
      stance.posture,
    );
    const short: ReturnType<typeof walkReach.prepareShort> =
      walkReach.prepareShort(context.body);
    let best: Step = null;
    for (const foot of feet) {
      const taken: Step = take(foot);
      if (taken !== null && (best === null || taken.length < best.length))
        best = taken;
    }
    return best === null ? null : best.stance;

    /**
     * The least step of a foot that reaches, and its stance; null when one step
     * does not.
     */
    function take(foot: AutoMovieHumanSide): Step {
      const leg: Leg = `${foot}Leg`;
      if (stance.posture.limbs[leg] === undefined) return null;
      const fixed: AutoMovieHumanSide = foot === "left" ? "right" : "left";
      const fixedLeg: Leg = `${fixed}Leg`;

      // The body with its foot moved `length` along the floor, a share of it.
      const step: (
        posture: IAutoMovieMotionHumanPosture,
        length: number,
        share: number,
        resolution?: IFK,
      ) => IAutoMovieMotionHumanPosture = (
        posture: IAutoMovieMotionHumanPosture,
        length: number,
        share: number,
        resolution?: IFK,
      ): IAutoMovieMotionHumanPosture => {
        if (length <= 0 || share <= 0) return posture;
        const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[leg];
        if (goal === undefined) return posture;

        // The foot's own progress, by the reach's time at this share of the
        // way.
        const u: number = Math.min(
          1,
          Math.max(
            0,
            (timed(share) - STEPPING[0]) / (STEPPING[1] - STEPPING[0]),
          ),
        );
        const moved: number = length * minimumJerk.share(u);
        const shifted: IAutoMovieVector3 = Vector3.add(
          posture.root,
          Vector3.scale(toward, (length * share) / 2),
        );

        // The pelvis comes down as far as either planted leg asks to reach
        // its foot, as a walk's does (`walkReach.short`).
        const ankle: Ankle = posture.limbs[fixedLeg];
        const drop: number =
          ankle === undefined
            ? 0
            : Math.max(
                0,
                short(
                  readHips({ ...posture, root: shifted }, resolution).get(
                    `${fixed}UpperLeg`,
                  )!.worldPosition,
                  ankle.point,
                ),
              );
        return {
          ...posture,
          root: { ...shifted, y: shifted.y - drop },
          limbs: {
            ...posture.limbs,
            [leg]: {
              ...goal,
              point: {
                x: goal.point.x + toward.x * moved,
                y: goal.point.y + clearance * Math.sin(Math.PI * u),
                z: goal.point.z + toward.z * moved,
              },
            },
          },
        };
      };

      // How far past its reach the furthest place lies, metres.
      const ankle: Ankle = stance.posture.limbs[fixedLeg];
      const hip: IAutoMovieVector3 = hips.get(
        `${fixed}UpperLeg`,
      )!.worldPosition;
      const dropAt: (length: number) => number = (length: number): number =>
        ankle === undefined || length <= 0
          ? 0
          : Math.max(
              0,
              short(Vector3.addScaled(hip, toward, length / 2), ankle.point),
            );
      const gap: (
        places: readonly pickUpStepReach.IReach[],
        length: number,
      ) => number = (
        places: readonly pickUpStepReach.IReach[],
        length: number,
      ): number => {
        const at: IAutoMovieVector3 = Vector3.addScaled(
          from,
          toward,
          length / 2,
        );
        at.y -= dropAt(length);
        return Math.max(
          ...places.map(
            ([place, limit]: pickUpStepReach.IReach): number =>
              Vector3.length(Vector3.subtract(place, at)) - limit,
          ),
        );
      };
      let length: Travel = null;
      for (const places of reaches) {
        const direct: Travel = pickUpStepReach(from, toward, places, longest);
        if (direct !== null && dropAt(direct) === 0) {
          length = direct;
          break;
        }
        if (gap(places, longest) <= 0) {
          // The planted leg bends the shoulder path away from the horizontal
          // solution. Refine the feasible length to a tenth of a millimetre.
          length = bracketedBisection(
            (tried: number): boolean => gap(places, tried) > 0,
            0,
            longest,
            1e-4,
          );
          break;
        }
      }
      if (
        accept !== undefined &&
        length !== null &&
        !accept(step(stance.posture, length, 1))
      )
        length = null;
      if (
        length === null &&
        accept !== undefined &&
        accept(step(stance.posture, longest, 1))
      )
        length = bracketedBisection(
          (tried: number): boolean => !accept(step(stance.posture, tried, 1)),
          0,
          longest,
          1e-4,
        );
      if (length === null) return null;
      const travel: number = length;
      return {
        length: travel,
        stance: {
          posture: step(stance.posture, travel, 1),
          at: (
            s: number,
            resolution?: IFK,
            projection?: IROM,
          ): IAutoMovieMotionHumanPosture =>
            step(stance.at(s, resolution, projection), travel, s, resolution),
          lower: (
            posture: IAutoMovieMotionHumanPosture,
            s: number,
            resolution?: IFK,
            projection?: IROM,
          ): IAutoMovieMotionHumanPosture =>
            step(
              stance.lower(posture, s, resolution, projection),
              travel,
              s,
              resolution,
            ),
          step: { side: foot, off: STEPPING[0], on: STEPPING[1] },
        },
      };
    }
  }

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
      (end + up * timed(1 - minimumJerk.share(time) / share)) / duration;
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

  /**
   * The time share at which a minimum-jerk progress has gone a share of its way
   * (`minimumJerk.time`).
   */
  const timed = minimumJerk.time;

  /**
   * Actual holding shoulder through its same-body fixed-name reader, world
   * metres.
   */
  const shoulder = (
    side: AutoMovieHumanSide,
    posture: IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof HumanTrunk.prepareResolve>,
    resolution?: IFK,
  ): IAutoMovieVector3 =>
    read(posture, resolution).get(`${side}UpperArm`)!.worldPosition;
}

/** A leg goal addressed by the side of its support. */
type Leg = `${AutoMovieHumanSide}Leg`;

/** Same-person exact FK loan borrowed by an actual adjusted stance invocation. */
type IFK = Parameters<pickUpPosture.IStance["at"]>[1];

type IROM = Parameters<pickUpPosture.IStance["at"]>[2];
