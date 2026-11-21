import { rideHorse } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { HumanPerformance } from "@automovie/motions";

import type { equineFordRider } from "./equineFordRider";

/**
 * The far-bank lead-out of `test_archetype_equine_ford_rider`: where the dismounted rider stands at the halted horse's head, and the led walk laid after the rider's rehearsed walk so that the horse's progress follows the handler's hips, as `test_motion_equestrian_lifecycle` leads a horse.
 *
 * A handler keeping station on the horse's moving lead would trail it by the cruise speed over the station gain (`walkStation`, 1.2 m/s over 1.87 per second, 0.64 m), beyond the arm's slack on the rope, so the led horse follows its handler instead, as a led horse does.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stance, the matched walk and why the horse follows.
 * @evidence contracts/development/design.md#principled-representation A stance record and two builders.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ford rider spec only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace equineLeadOut {
  /** Metres led on foot: long enough for the walk to reach a steady pace between its start and stop. */
  export const LENGTH: number = 6;

  /** Metres the handler's right shoulder walks outside the lead rope's held run: the lifecycle spec's staging. */
  const CLEARANCE: number = 0.13;

  /** Share of the arm's length from the shoulder to the held rope: the lifecycle spec's staging, the elbow part flexed. */
  const REACH: number = 0.75;

  /** Samples of the rehearsed walk's progress the led course is matched to. */
  const SAMPLES: number = 120;

  /**
   * Where a handler stands relative to the lead rope's held run, world metres, the horse facing +Z.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's axis.
   * @evidence contracts/development/design.md#principled-representation Two horizontal offsets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the spec.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStanding {
    /** Toward +X, the horse's left, from the rope to the handler's root. */
    lateral: number;

    /** Toward +Z, the way led, from the rope to the handler's root; negative behind it. */
    forward: number;
  }

  /**
   * The handler's place at the horse's head: the right shoulder `CLEARANCE` outside the rope and far enough behind it that the rope lies `REACH` of the arm's length ahead of the shoulder, read from the body's rest skeleton standing on the ground.
   *
   * @param body The handler.
   * @param rope The held run's height above the ground, metres.
   * @returns The stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the stance and its inputs.
   * @evidence contracts/development/implementation.md#principled-implementation The rope's distance from the shoulder is the authored share of the rest arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads four rest joints.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The body's own rest skeleton.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function standing(
    body: IAutoMovieMotionHumanBody,
    rope: number,
  ): IStanding {
    const rest: IAutoMovieMotionHumanBody["rest"] = body.rest;
    const shoulder: IAutoMovieVector3 = rest.get("rightUpperArm")!;
    const arm: number =
      Vector3.distance(shoulder, rest.get("rightLowerArm")!) +
      Vector3.distance(rest.get("rightLowerArm")!, rest.get("rightHand")!);
    const reach: number = REACH * arm;
    const drop: number = shoulder.y - rope;
    return {
      lateral: CLEARANCE + rest.get("hips")!.x - shoulder.x,
      forward: -Math.sqrt(
        Math.max(0, reach * reach - CLEARANCE * CLEARANCE - drop * drop),
      ),
    };
  }

  /**
   * Lay the led walk from the halt after the rider's rehearsed walk: a straight trapezoidal course along +Z whose steady progress and start and stop lags equal the hips' displayed progress.
   *
   * @param staged The halted crossing.
   * @param rehearsal The performance with the handler's walk and the horse halted.
   * @param walking The handler's leading walk in it.
   * @returns The led walk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the fit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A steady walk is the line `p(t) = v t - lag`, fitted over its middle half; a trapezoid reaching `v` at constant acceleration `a` lags its steady line by `v² / 2a`, so equal lags give equal steady progress, and the stop is matched the same way from the walk's end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sample, fit, ride.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A walk with no steady stretch is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms `SAMPLES + 1` hip reads and one least-squares pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The lifecycle spec's matching, on this take.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The ride is the caller's.
   */
  export function led(
    staged: equineFordRider.IStage,
    rehearsal: HumanPerformance,
    walking: IAutoMovieMotionHumanSegment,
  ): equineFordRider.ILed {
    const step: number = (walking.end - walking.start) / SAMPLES;
    const hips = (at: number): number =>
      rehearsal.bones("rider", at).get("hips")!.worldPosition.z;
    const begin: number = hips(walking.start);
    const progress: readonly number[] = Array.from(
      { length: SAMPLES + 1 },
      (_: unknown, i: number): number => hips(walking.start + i * step) - begin,
    );
    const from: number = Math.floor(SAMPLES / 4);
    const to: number = Math.ceil((3 * SAMPLES) / 4);
    let st: number = 0;
    let sp: number = 0;
    let stt: number = 0;
    let stp: number = 0;
    for (let i: number = from; i <= to; i++) {
      const t: number = i * step;
      st += t;
      sp += progress[i]!;
      stt += t * t;
      stp += t * progress[i]!;
    }
    const n: number = to - from + 1;
    const cruise: number = (n * stp - st * sp) / (n * stt - st * st);
    const startLag: number = (cruise * st - sp) / n;
    const length: number = progress[SAMPLES]!;
    const stopLag: number = cruise * SAMPLES * step - length - startLag;
    if (!(cruise > 0 && startLag > 0 && stopLag > 0))
      throw new Error("The rehearsed walk has no steady stretch to match");
    const halt: IAutoMovieVector3 = staged.place(staged.halt).position;
    return {
      start: walking.start,
      ride: rideHorse(
        staged.horse,
        {
          start: { x: halt.x, z: halt.z, heading: 0 },
          cruise,
          startSpeed: 0,
          endSpeed: 0,
          acceleration: (cruise * cruise) / (2 * startLag),
          deceleration: (cruise * cruise) / (2 * stopLag),
          startFromStanding: true,
          legs: [{ kind: "straight", length }],
        },
        "walk",
      ),
    };
  }
}
