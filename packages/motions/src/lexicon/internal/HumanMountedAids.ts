import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import type { HumanRideHands } from "./HumanRideHands";

/*
 * A mounted rider's aids (`IAutoMovieMotionHumanMounted.IAid`): each aid rises
 * over `RISE` seconds from its onset, `latency` before the transition it cues,
 * holds until the transition, and is released over `RELEASE` seconds after it,
 * the prompt release after the horse responds that rein-tension studies
 * describe (Egenvall et al. 2019, Animals 9:712). The hands move along or
 * across their reins, the legs turn the foot about the ball on its stirrup, and
 * the seat tips the pelvis; a voice aid is an event only. Every amplitude is
 * provisional.
 */
export namespace HumanMountedAids {
  /*
   * Seconds an aid takes to rise from its onset (provisional).
   */
  export const RISE: number = 0.2;

  /*
   * Seconds an aid takes to be released after the transition (provisional).
   */
  export const RELEASE: number = 0.3;

  /*
   * How far a taken-up rein is drawn back, forearm lengths (provisional).
   */
  export const TAKE_UP: number = 0.3;

  /*
   * How far an opening or neck rein carries the hand across, forearm lengths
   * (provisional).
   */
  export const ACROSS: number = 0.25;

  /*
   * How far a shaken line is lifted and dropped, forearm lengths (provisional).
   */
  export const SHAKE: number = 0.15;

  /*
   * How many waves a shake sends down the lines over its rise and hold
   * (provisional).
   */
  export const WAVES: number = 2;

  /*
   * How far a whip touch flicks the whip hand forward and up, forearm lengths
   * (provisional).
   */
  export const FLICK: number = 0.4;

  /*
   * How far the heel turns about the ball in a leg aid, degrees (provisional,
   * inside the ankle's range).
   */
  export const HEEL: number = 20;

  /*
   * How far the pelvis tips back in a seat aid, degrees (provisional).
   */
  export const SEAT: number = 5;

  /*
   * One aid given at one transition.
   */
  export interface IGiven {
    /*
     * The aid.
     */
    kind: IAutoMovieMotionHumanMounted.Aid;

    /*
     * The hand or leg; both when absent.
     */
    side?: AutoMovieHumanSide;

    /*
     * When it begins, local seconds.
     */
    onset: number;

    /*
     * The transition it cues, local seconds.
     */
    at: number;
  }

  /*
   * Every aid given over the performance, and the refusal of a required
   * transition no aid cues.
   * Parameter cue: The performance's cue reader.
   * Parameter start: The performance's start, film seconds.
   * Parameter duration: The performance's duration, seconds.
   * Parameter aids: The authored aids.
   * Parameter aided: The cue track of transitions that each need an aid; none when
   * absent.
   * Returns: The aids given, in time order.
   * For a latency of no time, an aid whose onset falls
   * before the performance, or a required transition with no aid.
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
          throw new AutoMovieMotionHumanRefusal({
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
          throw new AutoMovieMotionHumanRefusal({
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

  /*
   * How far an aid is given at a second: rising over `RISE` from its onset,
   * full until its transition, released over `RELEASE`.
   * Parameter aid: The aid.
   * Parameter at: Local seconds.
   * Returns: The weight, 0 to 1.
   */
  export function weight(aid: IGiven, at: number): number {
    if (at <= aid.onset || at >= aid.at + RELEASE) return 0;
    if (at < aid.at)
      return AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, (at - aid.onset) / RISE));
    return AutoMovieEngineMotionSampling.minimumJerkShare(1 - (at - aid.at) / RELEASE);
  }

  /*
   * A held rein moved by the hand aids of its side at a second: drawn back
   * along the rein, carried out from the neck or across it.
   * Parameter aids: The aids given.
   * Parameter side: The hand.
   * Parameter at: Local seconds.
   * Parameter grip: The rein where the carrier has it.
   * Parameter forearm: The forearm's length, metres.
   * Returns: The moved grip.
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
        point = AutoMovieEngineVector3.add(
          point,
          AutoMovieEngineVector3.scale(grip.axis, -TAKE_UP * forearm * w),
        );
      if (aid.kind === "shake") {
        const phase: number =
          (at - aid.onset) / Math.max(1e-6, aid.at - aid.onset);
        point = AutoMovieEngineVector3.add(point, {
          x: 0,
          y:
            SHAKE *
            forearm *
            w *
            Math.sin(2 * Math.PI * WAVES * Math.min(1, phase)),
          z: 0,
        });
      }
      if (aid.kind === "whipTouch" && grip.axis !== undefined)
        point = AutoMovieEngineVector3.add(
          point,
          AutoMovieEngineVector3.scale(
            AutoMovieEngineVector3.normalize(AutoMovieEngineVector3.add(grip.axis, { x: 0, y: 1, z: 0 })),
            FLICK * forearm * w,
          ),
        );
      if (
        (aid.kind === "openRein" || aid.kind === "neckRein") &&
        grip.axis !== undefined
      ) {
        const out: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
          AutoMovieEngineVector3.cross({ x: 0, y: 1, z: 0 }, grip.axis),
        );
        const sign: number =
          (side === "left" ? 1 : -1) * (aid.kind === "openRein" ? 1 : -1);
        point = AutoMovieEngineVector3.add(
          point,
          AutoMovieEngineVector3.scale(out, sign * ACROSS * forearm * w),
        );
      }
    }
    return point === grip.point ? grip : { ...grip, point };
  }

  /*
   * A posture moved by the leg and seat aids at a second: each leg aid turns
   * its foot about the ball on the stirrup, the heel drawn in (squeeze) or up
   * and back (kick); a seat aid tips the pelvis back.
   * Parameter aids: The aids given.
   * Parameter at: Local seconds.
   * Parameter posture: The posture, in the carrier frame.
   * Returns: The posture with its legs and pelvis moved.
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
            ? AutoMovieEngineQuaternion.rotateVector(goal.rotation, { x: 1, y: 0, z: 0 })
            : { x: 0, y: side === "left" ? -1 : 1, z: 0 };
        const turn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
          axis,
          (aid.kind === "kick" ? HEEL : -HEEL) * w,
        );
        const ball: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          goal.point,
          AutoMovieEngineQuaternion.rotateVector(goal.rotation, goal.contact),
        );
        const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
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
              point: AutoMovieEngineVector3.subtract(
                ball,
                AutoMovieEngineQuaternion.rotateVector(rotation, goal.contact),
              ),
            },
          },
        };
      }
    }
    return out;
  }
}
