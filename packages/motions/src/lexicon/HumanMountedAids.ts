import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanRideHands } from "./HumanRideHands";

/**
 * A mounted rider's aids (`IAutoMovieMotionHumanMounted.IAid`, #3963): each aid rises over `RISE` seconds from its onset, `latency` before the transition it cues, holds until the transition, and is released over `RELEASE` seconds after it, the prompt release after the horse responds that rein-tension studies describe (Egenvall et al. 2019, Animals 9:712). The hands move along or across their reins, the legs turn the foot about the ball on its stirrup, and the seat tips the pelvis; a voice aid is an event only. Every amplitude is provisional.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the timing, its source, what each aid moves and that the amplitudes are provisional.
 * @evidence contracts/development/design.md#principled-representation Aids as onsets and transitions on the action's clock, their weights pure functions of the second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reader, the hand and body effects and the events `HumanMounted` uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The transitions are the author's cue tracks of the carrier's own instants.
 */
export namespace HumanMountedAids {
  /** Seconds an aid takes to rise from its onset (provisional). */
  export const RISE: number = 0.2;

  /** Seconds an aid takes to be released after the transition (provisional). */
  export const RELEASE: number = 0.3;

  /** How far a taken-up rein is drawn back, forearm lengths (provisional). */
  export const TAKE_UP: number = 0.3;

  /** How far an opening or neck rein carries the hand across, forearm lengths (provisional). */
  export const ACROSS: number = 0.25;

  /** How far the heel turns about the ball in a leg aid, degrees (provisional, inside the ankle's range). */
  export const HEEL: number = 20;

  /** How far the pelvis tips back in a seat aid, degrees (provisional). */
  export const SEAT: number = 5;

  /**
   * One aid given at one transition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation kind, side: The aid's. onset: When it begins, local seconds. at: The transition, local seconds.
   * @evidence contracts/development/design.md#principled-representation Seconds on the action's clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the weights and the events.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IGiven {
    /** The aid. */
    kind: IAutoMovieMotionHumanMounted.Aid;

    /** The hand or leg; both when absent. */
    side?: AutoMovieHumanSide;

    /** When it begins, local seconds. */
    onset: number;

    /** The transition it cues, local seconds. */
    at: number;
  }

  /**
   * Every aid given over the performance, and the refusal of a required transition no aid cues.
   *
   * @param cue The performance's cue reader.
   * @param start The performance's start, film seconds.
   * @param duration The performance's duration, seconds.
   * @param aids The authored aids.
   * @param aided The cue track of transitions that each need an aid; none when absent.
   * @returns The aids given, in time order.
   * @throws {HumanRefusal} For a latency of no time, an aid whose onset falls before the performance, or a required transition with no aid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each aid's cue instants inside the performance become transitions, each given its latency's head start; the required track's instants are each matched to a given aid.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop per aid.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An aid that cannot begin inside the performance is refused, never shortened.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the cue instants after one sort.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new list.
   */
  export function given(
    cue: IAutoMovieMotionHumanActionContext["cue"],
    start: number,
    duration: number,
    aids: readonly IAutoMovieMotionHumanMounted.IAid[],
    aided: string | undefined,
  ): IGiven[] {
    const out: IGiven[] = [];
    aids.forEach((aid: IAutoMovieMotionHumanMounted.IAid, i: number): void => {
      HumanBound.above(`aids.${i}.latency`, aid.latency, 0, "s");
      for (const c of cue(aid.cue)) {
        const at: number = c.seconds - start;
        if (at < 0 || at > duration) continue;
        if (at - aid.latency < 0)
          throw new HumanRefusal({
            kind: "parameter",
            axis: `aids.${i}.latency`,
            value: aid.latency,
            feasible: { kind: "range", minimum: 0, maximum: at, unit: "s" },
            reason: `the ${aid.kind} for the transition at ${at.toFixed(3)} s would begin before the performance`,
            fix: "shorten the latency or begin the performance earlier",
          });
        out.push({
          kind: aid.kind,
          ...(aid.side === undefined ? {} : { side: aid.side }),
          onset: at - aid.latency,
          at,
        });
      }
    });
    if (aided !== undefined)
      for (const c of cue(aided)) {
        const at: number = c.seconds - start;
        if (at < 0 || at > duration) continue;
        if (!out.some((g: IGiven): boolean => Math.abs(g.at - at) < 1e-6))
          throw new HumanRefusal({
            kind: "parameter",
            axis: "aided",
            value: c.seconds,
            feasible: null,
            reason: `the transition at film second ${c.seconds.toFixed(3)} is authored without its aid, and the take requires aided riding`,
            fix: "give an aid whose cue track holds the transition",
          });
      }
    return out.sort((a: IGiven, b: IGiven): number => a.onset - b.onset);
  }

  /**
   * How far an aid is given at a second: rising over `RISE` from its onset, full until its transition, released over `RELEASE`.
   *
   * @param aid The aid.
   * @param at Local seconds.
   * @returns The weight, 0 to 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the profile.
   * @evidence contracts/development/implementation.md#principled-implementation Minimum-jerk rise and fall (Flash and Hogan 1985) around a held plateau.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function weight(aid: IGiven, at: number): number {
    if (at <= aid.onset || at >= aid.at + RELEASE) return 0;
    if (at < aid.at)
      return minimumJerk.share(Math.min(1, (at - aid.onset) / RISE));
    return minimumJerk.share(1 - (at - aid.at) / RELEASE);
  }

  /**
   * A held rein moved by the hand aids of its side at a second: drawn back along the rein, carried out from the neck or across it.
   *
   * @param aids The aids given.
   * @param side The hand.
   * @param at Local seconds.
   * @param grip The rein where the carrier has it.
   * @param forearm The forearm's length, metres.
   * @returns The moved grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each hand aid's movement.
   * @evidence contracts/development/implementation.md#principled-implementation The rein's own axis for a take-up, and the horizontal across it, outward or inward by the hand's side, for an opening or a neck rein, each scaled by its aid's weight.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One pass over the aids.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A grip without an axis is moved only across.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the aids.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rein(
    aids: readonly IGiven[],
    side: AutoMovieHumanSide,
    at: number,
    grip: HumanRideHands.IMaterialGrip,
    forearm: number,
  ): HumanRideHands.IMaterialGrip {
    let point: IAutoMovieVector3 = grip.point;
    for (const aid of aids) {
      if (aid.side !== undefined && aid.side !== side) continue;
      const w: number = weight(aid, at);
      if (w === 0) continue;
      if (aid.kind === "takeUp" && grip.axis !== undefined)
        point = Vector3.add(
          point,
          Vector3.scale(grip.axis, -TAKE_UP * forearm * w),
        );
      if (
        (aid.kind === "openRein" || aid.kind === "neckRein") &&
        grip.axis !== undefined
      ) {
        const out: IAutoMovieVector3 = Vector3.normalize(
          Vector3.cross({ x: 0, y: 1, z: 0 }, grip.axis),
        );
        const sign: number =
          (side === "left" ? 1 : -1) * (aid.kind === "openRein" ? 1 : -1);
        point = Vector3.add(
          point,
          Vector3.scale(out, sign * ACROSS * forearm * w),
        );
      }
    }
    return point === grip.point ? grip : { ...grip, point };
  }

  /**
   * A posture moved by the leg and seat aids at a second: each leg aid turns its foot about the ball on the stirrup, the heel drawn in (squeeze) or up and back (kick); a seat aid tips the pelvis back.
   *
   * @param aids The aids given.
   * @param at Local seconds.
   * @param posture The posture, in the carrier frame.
   * @returns The posture with its legs and pelvis moved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each leg and seat aid's movement and its pivot.
   * @evidence contracts/development/implementation.md#principled-implementation A foot turn about the ball's vertical (squeeze) or lateral (kick) axis, the ball held still so the sole keeps its stirrup; the pelvis pitch reduced by the seat aid's tip.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One pass over the aids.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A leg goal with no contact or rotation is left as it is.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the aids.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function body(
    aids: readonly IGiven[],
    at: number,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    let out: IAutoMovieMotionHumanPosture = posture;
    for (const aid of aids) {
      const w: number = weight(aid, at);
      if (w === 0) continue;
      if (aid.kind === "seat") out = { ...out, pitch: out.pitch - SEAT * w };
      if (aid.kind !== "squeeze" && aid.kind !== "kick") continue;
      for (const side of ["left", "right"] as const) {
        if (aid.side !== undefined && aid.side !== side) continue;
        const goal: IAutoMovieHumanLimbGoal | undefined =
          out.limbs[`${side}Leg`];
        if (goal?.contact === undefined || goal.rotation === undefined)
          continue;
        const axis: IAutoMovieVector3 =
          aid.kind === "kick"
            ? Quaternion.rotateVector(goal.rotation, { x: 1, y: 0, z: 0 })
            : { x: 0, y: side === "left" ? -1 : 1, z: 0 };
        const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          axis,
          (aid.kind === "kick" ? HEEL : -HEEL) * w,
        );
        const ball: IAutoMovieVector3 = Vector3.add(
          goal.point,
          Quaternion.rotateVector(goal.rotation, goal.contact),
        );
        const rotation: IAutoMovieQuaternion = Quaternion.multiply(
          turn,
          goal.rotation,
        );
        out = {
          ...out,
          limbs: {
            ...out.limbs,
            [`${side}Leg`]: {
              ...goal,
              rotation,
              point: Vector3.subtract(
                ball,
                Quaternion.rotateVector(rotation, goal.contact),
              ),
            },
          },
        };
      }
    }
    return out;
  }
}
