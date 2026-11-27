import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLean } from "../../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../../compose/AutoMovieMotionHumanLeg";
import { humanPostureHeading } from "../../posture/humanPostureHeading";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { kneelKeys } from "./kneelKeys";
import { kneelLiftedFoot } from "./kneelLiftedFoot";
import type { kneelPhaseTable } from "./kneelPhaseTable";
import type { prepareKneelClock } from "./prepareKneelClock";
import { prepareKneelFoot } from "./prepareKneelFoot";
import type { prepareKneelPhases } from "./prepareKneelPhases";

/**
 * A kneel's body at a second (`kneel.plan`): while it stands on its feet the
 * hips run their course along the heading and ride as high as the less extended
 * leg reaches its foot, capped after the foot lands, the pelvis tipped to keep
 * the leg behind within the hip's extension; on a fixed root line the hips
 * follow it; each moving foot is turned toes down about its toe pads as a
 * weightless ankle reaches. Read from the plan's body, keys, phase geometry,
 * clock, courses and landing heights.
 *
 * @param scope What the plan's body is written from.
 * @returns The writer of the body at a second.
 */
export function kneelWrite(scope: kneelWrite.IScope): kneelWrite.Write {
  const {
    body,
    standing,
    yaw,
    keys,
    solved,
    kneeling,
    aside,
    length,
    geometry,
    at,
    courses,
    weightAt,
    landedKey,
    landedBalance,
    REACH,
    EASE,
  }: kneelWrite.IScope = scope;
  const write: kneelWrite.Write = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    along?: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ): IAutoMovieMotionHumanPosture => {
    const { phase, index, u, linear }: ReturnType<typeof at> = at(seconds);
    const feet: Record<
      AutoMovieHumanSide,
      ReturnType<ReturnType<typeof prepareKneelPhases>[number]["feet"]["left"]>
    > = {
      left: geometry[index]!.feet.left(u, linear),
      right: geometry[index]!.feet.right(u, linear),
    };
    const pair: number = phase.from + phase.to;
    const fixed: ((share: number) => IAutoMovieVector3) | undefined =
      geometry[index]!.root;
    let root: IAutoMovieVector3;
    let pitch: number = 0;

    // A phase with no fixed root line is one the hips cross on their feet,
    // along the balance course.
    if (fixed === undefined) {
      const step: number = pair === 3 ? 1 : phase.from === 0 ? u : 1 - u;
      const low: number = pair === 1 ? 0 : phase.from === 1 ? u : 1 - u;
      const course: number = (
        courses[phase.from < phase.to ? 0 : 1] ?? ((): number => 0)
      )(seconds);
      // The fourth power keeps the hips on the balance course through most
      // of a phase and brings them to the key late (provisional profile).
      const s: number =
        along ??
        (pair === 3
          ? course + (kneeling - course) * low ** 4
          : phase.from === 1
            ? course * (1 - u ** 4)
            : course);
      // A knee placed aside carries the hips aside as the foot travels.
      const flat: IAutoMovieVector3 = Vector3.add(
        Vector3.add(standing.root, Vector3.scale(solved.forward, s)),
        Vector3.scale(aside, AutoMovieEngineMotionSampling.minimumJerkShare(step)),
      );
      const reach: number =
        (solved.extension + (REACH - solved.extension) * step) * length;
      const high: number = Math.min(
        ...(["left", "right"] as const).map(
          (side: AutoMovieHumanSide): number => {
            const ankle: IAutoMovieVector3 = feet[side].placement.ankle;
            const hip: IAutoMovieVector3 = Vector3.add(flat, solved.rest[side]);
            const d: number = Math.hypot(ankle.x - hip.x, ankle.z - hip.z);
            return (
              ankle.y +
              Math.sqrt(Math.max(0, reach * reach - d * d)) -
              solved.rest[side].y
            );
          },
        ),
      );
      // Once the foot has landed the hips never ride above the straight
      // way between the neighbouring states' heights.
      const key: number | undefined = landedKey();
      const balanced: number | undefined = landedBalance();
      const landed: number | undefined =
        key === undefined || balanced === undefined
          ? key
          : key + weightAt(seconds) * (balanced - key);
      const cap: number =
        landed === undefined || (pair === 1 && phase.from === 0)
          ? Infinity
          : pair === 3
            ? landed + (keys[2]!.root.y - landed) * low
            : landed + (standing.root.y - landed) * u;
      root = { ...flat, y: Math.min(high, cap) };
      pitch = kneelKeys.lean(
        body,
        {
          left: Vector3.add(root, solved.rest.left),
          right: Vector3.add(root, solved.rest.right),
        },
        {
          left: feet.left.placement.ankle,
          right: feet.right.placement.ankle,
        },
        solved.forward,
      );
    } else root = fixed(u);
    const placed: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.tip(
      body,
      { ...posture, root, yaw },
      pitch,
      0,
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    for (const side of ["left", "right"] as const) {
      // A moving foot never bends its ankle past what a weightless ankle
      // reaches while it bears nothing (`kneelLiftedFoot`): it is turned
      // toes down about its toe pads, its toes extending. It rolls into
      // the turn on its toe pads before it lifts off a heel-up stance, and
      // out of it on them after its toes strike a heel-up landing, as the
      // knee comes off or down over them. A foot leaving or landing flat
      // eases its turn in and out over `EASE` at its plants.
      const leftKey: kneelKeys.IFoot = keys[phase.from]!.feet[side];
      const nextKey: kneelKeys.IFoot = keys[phase.to]!.feet[side];
      const lift: number = prepareKneelFoot.departure(leftKey, nextKey);
      const strike: number = prepareKneelFoot.arrival(leftKey, nextKey);
      const ease: (span: number) => number = (span: number): number =>
        Math.max(0, Math.min(1, (span * phase.seconds) / EASE));
      const weight: number = kneelKeys.still(leftKey, nextKey)
        ? 0
        : linear < lift
          ? AutoMovieEngineMotionSampling.minimumJerkShare(linear / lift)
          : linear > strike
            ? 1 - AutoMovieEngineMotionSampling.minimumJerkShare((linear - strike) / (1 - strike))
            : Math.min(
                lift > 0 ? 1 : ease(linear),
                strike < 1 ? 1 : ease(1 - linear),
              );
      // A foot rolling on its toe pads bears, but its goal is free to turn
      // over them; it is held as planted once it rests at its key.
      const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanLeg.goal(
        body,
        placed,
        side,
        feet[side].placement,
        feet[side].planted && weight === 0,
      );
      const turned: kneelLiftedFoot.IFoot = kneelLiftedFoot(
        body,
        side,
        Vector3.add(root, solved.rest[side]),
        goal,
        feet[side].toes,
        weight,
        Quaternion.rotateVector(humanPostureHeading(placed), {
          x: 0,
          y: 0,
          z: 1,
        }),
      );
      limbs[`${side}Leg`] = turned.goal;
      joints[`${side}Toes`] = [turned.toes, 0, 0];
    }
    return lowerHumanPosture(
      body,
      { ...placed, joints, limbs },
      undefined,
      resolution,
    );
  };

  return write;
}

/** What a kneel's body writer reads and what it is. */
export namespace kneelWrite {
  /** What a kneel plan writes its body from. */
  export interface IScope {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The standing posture. */
    standing: IAutoMovieMotionHumanPosture;

    /** The standing heading, degrees. */
    yaw: number;

    /** The key states. */
    keys: kneelKeys.IKey[];

    /** The solved keys. */
    solved: kneelKeys.IKeys;

    /** The kneeling hips' distance along the heading, metres. */
    kneeling: number;

    /** The kneeling hips' offset aside, metres. */
    aside: IAutoMovieVector3;

    /** The leg's length, metres. */
    length: number;

    /** Each phase's feet and root line (`prepareKneelPhases`). */
    geometry: ReturnType<typeof prepareKneelPhases>;

    /** The phase at a second (`prepareKneelClock`). */
    at: ReturnType<typeof prepareKneelClock<kneelPhaseTable.IPhase>>;

    /** The hips' courses down and up, set after the writer is built. */
    courses: Course[];

    /**
     * The balance weight at a travel second.
     *
     * @param second Travel seconds.
     * @returns The weight.
     */
    weightAt: (second: number) => number;

    /**
     * The landed hips' height on the step's own course, once read.
     *
     * @returns The height, metres, or undefined before it is read.
     */
    landedKey: () => number | undefined;

    /**
     * The landed hips' height on the balance course, once read.
     *
     * @returns The height, metres, or undefined before it is read.
     */
    landedBalance: () => number | undefined;

    /** The stepping leg's extension share (`kneel.REACH`). */
    REACH: number;

    /** The lifted foot's turn's ease, seconds. */
    EASE: number;
  }

  /**
   * The hips' place along the heading at a second.
   *
   * @param seconds Travel seconds.
   * @returns The distance, metres.
   */
  export type Course = (seconds: number) => number;

  /**
   * The body at a second.
   *
   * @param posture The posture under the body.
   * @param seconds Travel seconds.
   * @param along The hips' place along the heading asked by a course's solve.
   * @param resolution The borrowed forward-kinematics source, if any.
   * @returns The posture.
   */
  export type Write = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    along?: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ) => IAutoMovieMotionHumanPosture;
}
