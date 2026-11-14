import { DEFAULT_HUMANOID_ROM, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { walkReach } from "../actions/walkReach";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { bendLower } from "../everyday/bendLower";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { pickUpPosture } from "./pickUpPosture";

/**
 * How a standing reach adapts its body before its arm refuses a grip it
 * still misses (`pickUp`): the trunk turns toward the grip, and then one
 * foot takes one adjustment step toward it. Further than one step is a
 * walk, the composition's own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two adaptations, their order and their limit.
 * @evidence contracts/development/design.md#principled-representation Each adaptation is a pick up stance (`pickUpPosture.IStance`), so the pick up reads them as it reads a lowering.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The turn, the step and the step's bounds the pick up reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body is named: ranges are the joints' own and the step a share of the stature.
 */
export namespace pickUpAdjust {
  /** The longest adjustment step a reach takes, metres for a body of `STATURE`: the median step of healthy adults reaching with a step to a target at 130 percent of the arm's length, 423.96 mm (Tomita et al. 2024, Neurorehabil Neural Repair 38:176, Table 3, 13 adults aged 64.7 years); a body's own is scaled by its stature over `STATURE`. */
  export const STEP: number = 0.42396;

  /** The stature a step's length is scaled against, metres (provisional: the study gives no height). */
  export const STATURE: number = 1.7;

  /** The shares of the reach's time at which an adjustment step's foot leaves the floor and lands: 262.51 ms after the hand sets off and 454.62 ms later, of a 993.46 ms reach with a step (Tomita et al. 2024, Tables 2 and 3, medians). */
  export const STEPPING: readonly [number, number] = [
    262.51 / 993.46,
    (262.51 + 454.62) / 993.46,
  ];

  /**
   * A stance turned toward a grip its arm still misses: the trunk twists
   * on the pelvis toward the grip, the chest and the lumbar spine sharing
   * the turn (`AutoMovieMotionHumanTrunk.CHEST`), as far as their axial
   * rotation allows (DEFAULT_HUMANOID_ROM): the least turn that brings the
   * shoulder within the arm of the wrist's place on the grip, or else the
   * turn that brings it nearest. A person whose hand cannot reach a grip
   * turns toward it first.
   *
   * @param context The action's context.
   * @param side The reaching arm.
   * @param grip Where the wrist must go on the grip, world metres.
   * @param stance The stance to turn: the entry's, or the entry lowered.
   * @returns The turned stance, its turn growing with the share of the way down.
   * @throws {Error} When the range-of-motion table gives the chest or the spine no twist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what turns, how far and why.
   * @evidence contracts/development/implementation.md#principled-implementation The trunk's twist split between the chest and the spine as the trunk's turn splits it, bounded by both joints' axial ranges with the twist they already hold; the turn is searched a degree at a time for the least that reaches.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The bounds, one search, one closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A table without the trunk's twist is refused, never read as no limit.
   * @evidence contracts/development/implementation.md#efficient-algorithms A shoulder read per degree of the range, once per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure holds the stance and the turn.
   */
  export function turned(
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    grip: IAutoMovieVector3,
    stance: pickUpPosture.IStance,
  ): pickUpPosture.IStance {
    const range = (bone: "chest" | "spine"): IAutoMovieAngleRange => {
      const twist: IAutoMovieAngleRange | null | undefined =
        DEFAULT_HUMANOID_ROM[bone]?.twist;
      if (twist === null || twist === undefined)
        throw new Error(`The range-of-motion table gives the ${bone} no twist`);
      return twist;
    };
    const share: Readonly<Record<"chest" | "spine", number>> = {
      chest: AutoMovieMotionHumanTrunk.CHEST,
      spine: 1 - AutoMovieMotionHumanTrunk.CHEST,
    };
    const held = (bone: "chest" | "spine"): number =>
      stance.posture.joints[bone]?.[2] ?? 0;
    // The turn either way the two joints allow with what they hold.
    const most: number = Math.min(
      ...(["chest", "spine"] as const).map(
        (bone: "chest" | "spine"): number =>
          (range(bone).max - held(bone)) / share[bone],
      ),
    );
    const least: number = Math.max(
      ...(["chest", "spine"] as const).map(
        (bone: "chest" | "spine"): number =>
          (range(bone).min - held(bone)) / share[bone],
      ),
    );
    const twist = (posture: IHumanPosture, degrees: number): IHumanPosture => {
      if (degrees === 0) return posture;
      const add = (bone: "chest" | "spine"): [number, number, number] => {
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
    const far = (degrees: number): number =>
      Vector3.length(
        Vector3.subtract(
          grip,
          shoulder(context, side, twist(stance.posture, degrees)),
        ),
      );
    const limit: number =
      context.body.measure.upperArm + context.body.measure.forearm;
    let best: number = 0;
    let nearest: number = far(0);
    for (let step: number = 1; step <= Math.max(most, -least); step++)
      for (const degrees of [step, -step]) {
        if (degrees > most || degrees < least) continue;
        const d: number = far(degrees);
        if (nearest > limit ? d < nearest : false) {
          nearest = d;
          best = degrees;
        }
      }
    const turn: number = best;
    return {
      posture: twist(stance.posture, turn),
      at: (s: number): IHumanPosture => twist(stance.at(s), turn * s),
      lower: (posture: IHumanPosture, s: number): IHumanPosture =>
        twist(stance.lower(posture, s), turn * s),
    };
  }

  /**
   * A stance that takes one adjustment step toward a grip its arm still
   * misses, a foot stepping toward the wrist's place: the least step whose
   * half, the pelvis riding midway between the feet, brings the shoulder
   * within the arm, up to `STEP`. The foot leaves and lands at `STEPPING`
   * of the reach's time on a minimum-jerk path lifted by the walk's
   * mid-swing clearance; the other foot stays planted. The foot on the
   * target's side steps; straight ahead, within `AHEAD` of the facing, the
   * reaching side's. A grip one step does not bring within reach is none of
   * a reach's: the person steps closer first.
   *
   * @param context The action's context.
   * @param side The reaching arm.
   * @param wrist Where the wrist must go on the grip, world metres.
   * @param stance The stance to step from.
   * @param lifted Where the wrist must also come by the lift's end, world metres: the step then brings the shoulder within `bendLower.REACH` of the arm of it, the arm near and not at full extension, or else within the arm (`pickUpStance`). The grip alone when absent.
   * @returns The stepped stance, or null when one step does not reach or the stance places no foot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which foot steps, where, how far, when and the limit.
   * @evidence contracts/development/implementation.md#principled-implementation One foot's planted goal moved along the floor toward the wrist, the root half as far, the shoulder read on the moved body; the step is solved for the least length that reaches.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The direction, the foot, one solve, one closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A step beyond `STEP` is never taken; the caller refuses instead.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bisection of the step's length, once per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure holds the stance and the step.
   */
  export function stepped(
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    wrist: IAutoMovieVector3,
    stance: pickUpPosture.IStance,
    lifted?: IAutoMovieVector3,
  ): pickUpPosture.IStance | null {
    const from: IAutoMovieVector3 = shoulder(context, side, stance.posture);
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

    // The foot on the target's side steps, people choosing the limb on the
    // side of a target to the side (Charalambous et al. 2024, bioRxiv
    // 10.1101/2024.04.10.588947); straight ahead, within `AHEAD` of the
    // facing, the reaching side's (provisional: no reach study ties the
    // foot to the reaching arm).
    const yaw: number = (stance.posture.yaw * Math.PI) / 180;
    const across: number = Vector3.dot(toward, {
      x: Math.cos(yaw),
      y: 0,
      z: -Math.sin(yaw),
    });
    const feet: readonly ("left" | "right")[] = [
      Math.abs(across) <= Math.sin((AHEAD * Math.PI) / 180)
        ? side
        : across > 0
          ? "left"
          : "right",
    ];

    // The places the step must bring within reach, each with its reach:
    // the grip within the arm, and the lifted place near full extension or
    // else within the arm.
    const reaches: readonly (readonly [IAutoMovieVector3, number][])[] =
      lifted === undefined
        ? [[[wrist, arm]]]
        : [
            [
              [wrist, arm],
              [lifted, bendLower.REACH * arm],
            ],
            [
              [wrist, arm],
              [lifted, arm],
            ],
          ];
    let best: { length: number; stance: pickUpPosture.IStance } | null = null;
    for (const foot of feet) {
      const taken: { length: number; stance: pickUpPosture.IStance } | null =
        take(foot);
      if (taken !== null && (best === null || taken.length < best.length))
        best = taken;
    }
    return best === null ? null : best.stance;

    /** The least step of a foot that reaches, and its stance; null when one step does not. */
    function take(
      foot: "left" | "right",
    ): { length: number; stance: pickUpPosture.IStance } | null {
      const leg: "leftLeg" | "rightLeg" =
        foot === "left" ? "leftLeg" : "rightLeg";
      if (stance.posture.limbs[leg] === undefined) return null;

      // The body with its foot moved `length` along the floor, a share of it.
      const step = (
        posture: IHumanPosture,
        length: number,
        share: number,
      ): IHumanPosture => {
        if (length <= 0 || share <= 0) return posture;
        const goal: IHumanPosture.IGoal | undefined = posture.limbs[leg];
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
        const moved: number = length * minimumJerk(u).s;
        const shifted: IAutoMovieVector3 = Vector3.add(
          posture.root,
          Vector3.scale(toward, (length * share) / 2),
        );

        // The pelvis comes down as far as either planted leg asks to reach
        // its foot, as a walk's does (`walkReach.short`).
        const hips: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
          context.body,
          { ...posture, root: shifted },
        );
        const drop: number = Math.max(
          0,
          ...(["left", "right"] as const).map(
            (s: "left" | "right"): number => {
              const ankle: IHumanPosture.IGoal | undefined =
                posture.limbs[s === "left" ? "leftLeg" : "rightLeg"];
              return ankle === undefined || s === foot
                ? 0
                : walkReach.short(
                    context.body,
                    hips.get(`${s}UpperLeg`)!.worldPosition,
                    ankle.point,
                  );
            },
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
      const gap = (
        places: readonly [IAutoMovieVector3, number][],
        length: number,
      ): number => {
        const at: IAutoMovieVector3 = shoulder(
          context,
          side,
          step(stance.posture, length, 1),
        );
        return Math.max(
          ...places.map(([place, reach]: [IAutoMovieVector3, number]): number =>
            Vector3.length(Vector3.subtract(place, at)) - reach,
          ),
        );
      };
      const places: readonly [IAutoMovieVector3, number][] | undefined =
        reaches.find(
          (candidate: readonly [IAutoMovieVector3, number][]): boolean =>
            gap(candidate, longest) <= 0,
        );
      if (places === undefined) return null;
      let low: number = 0;
      let high: number = longest;
      for (let i: number = 0; i < 30 && high - low > 1e-4; i++) {
        const middle: number = (low + high) / 2;
        if (gap(places, middle) <= 0) high = middle;
        else low = middle;
      }
      const length: number = high;
      return {
        length,
        stance: {
          posture: step(stance.posture, length, 1),
          at: (s: number): IHumanPosture => step(stance.at(s), length, s),
          lower: (posture: IHumanPosture, s: number): IHumanPosture =>
            step(stance.lower(posture, s), length, s),
          step: { side: foot, off: STEPPING[0], on: STEPPING[1] },
        },
      };
    }
  }

  /**
   * Both feet's plant windows over a pick up: each planted throughout, but
   * a foot that steps, planted from its landing on the way down to its
   * lifting on the way back, the stance's share mapped to the pick up's
   * seconds through its minimum-jerk descent over the reach and return
   * after the lift.
   *
   * @param stance The stance the pick up took, if any.
   * @param reach The reach's length, seconds.
   * @param end When the lift ends, seconds.
   * @param up The return's length, seconds.
   * @param share The share of the way down the stance holds at the lift's end, from which the return goes up (`pickUpLift.IRaise.share`): 1 where the lift does not straighten it.
   * @returns The windows, shares of the pick up's length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each window and how the shares map to seconds.
   * @evidence contracts/development/implementation.md#principled-implementation The stance's share of the way is minimum-jerk in time, so the second of a share is its inverse, found by bisection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One window per foot that stands, three for one that steps.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot that never steps is planted throughout, as before.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A few bisections per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns new windows and retains nothing.
   */
  export function plants(
    stance: pickUpPosture.IStance | null,
    reach: number,
    end: number,
    up: number,
    share: number,
  ): IHumanContactWindow[] {
    const duration: number = end + up;
    // A time share of the reach, and the second of the return at which the
    // way back, from `share` down to none, passes the share of the way it
    // had then.
    const down = (time: number): number => (reach * time) / duration;
    const back = (time: number): number =>
      (end + up * timed(1 - minimumJerk(time).s / share)) / duration;
    return (["left", "right"] as const).flatMap(
      (foot: "left" | "right"): IHumanContactWindow[] => {
        const part: "leftFoot" | "rightFoot" =
          foot === "left" ? "leftFoot" : "rightFoot";
        const ground: IHumanContactWindow["support"] = { kind: "ground" };
        const step: pickUpPosture.IStance["step"] = stance?.step;
        if (step === undefined || step.side !== foot)
          return [{ part, kind: "plant", from: 0, to: 1, support: ground }];
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

  /** How far from the facing, degrees, a target still lies straight ahead for the choice of the stepping foot (provisional). */
  export const AHEAD: number = 15;

  /** The time share at which a minimum-jerk progress has gone a share of its way, by bisection. */
  const timed = (share: number): number => {
    let low: number = 0;
    let high: number = 1;
    for (let i: number = 0; i < 40; i++) {
      const middle: number = (low + high) / 2;
      if (minimumJerk(middle).s < share) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  };

  /** The holding arm's shoulder joint on a posture, world metres. */
  const shoulder = (
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    posture: IHumanPosture,
  ): IAutoMovieVector3 =>
    HumanTrunk.resolve(context.body, posture).get(`${side}UpperArm`)!
      .worldPosition;
}
