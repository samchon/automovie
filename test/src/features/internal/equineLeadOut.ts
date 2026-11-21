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
 * Leading a horse on foot in the equestrian specs: where a handler stands at the horse's head, the trapezoidal course matched to a handler's rehearsed walk so that the horse's progress follows the handler's hips, and the far-bank lead-out of `test_archetype_equine_ford_rider` laid with it.
 *
 * A handler keeping station on the horse's moving lead would trail it by the cruise speed over the station gain (`walkStation`, 1.2 m/s over 1.87 per second, 0.64 m), beyond the arm's slack on the rope, so the led horse follows its handler instead, as a led horse does.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stance, the matched walk and why the horse follows.
 * @evidence contracts/development/design.md#principled-representation A stance record and two builders.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one owner of the stance and the matching, read by the ford rider, lifecycle and handler takes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace equineLeadOut {
  /** Metres led on foot: long enough for the walk to reach a steady pace between its start and stop. */
  export const LENGTH: number = 6;

  /** Metres the handler's right shoulder walks outside the lead rope's held run: an authored staging choice. */
  export const CLEARANCE: number = 0.13;

  /** Share of the arm's length from the shoulder to the held rope: an authored staging choice that leaves the elbow part flexed. */
  export const REACH: number = 0.75;

  /** Samples of the rehearsed walk's progress a led course is matched to. */
  export const SAMPLES: number = 120;

  /**
   * A straight horse course whose progress follows a walker's rehearsed progress.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation The length and the trapezoidal speed profile.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the led courses of the equestrian specs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IMatchedCourse {
    /** Metres walked. */
    length: number;

    /** The walker's steady speed, m/s. */
    cruise: number;

    /** The start's acceleration whose distance lag equals the walker's, m/s². */
    acceleration: number;

    /** The stop's deceleration whose distance lag equals the walker's, m/s². */
    deceleration: number;
  }

  /**
   * Match a trapezoidal course to a walker's displayed progress.
   *
   * @param progress The walker's progress from its start at each step, metres, `SAMPLES + 1` or any count of at least five.
   * @param step Seconds between the samples.
   * @returns The matched course.
   * @throws {Error} When the walk has no steady stretch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation A steady walk is the line `p(t) = v t - lag`, fitted over its middle half; a trapezoid reaching `v` at constant acceleration `a` lags its steady line by `v² / 2a`, so equal lags give equal steady progress, and the stop is matched the same way from the walk's end. The horse sets off and halts with the handler, as a led horse follows.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One least-squares pass and two closed forms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A walk with no steady stretch is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the samples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one matching every led course uses.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function match(
    progress: readonly number[],
    step: number,
  ): IMatchedCourse {
    const count: number = progress.length - 1;
    const from: number = Math.floor(count / 4);
    const to: number = Math.ceil((3 * count) / 4);
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
    const length: number = progress[count]!;
    const stopLag: number = cruise * count * step - length - startLag;
    if (!(cruise > 0 && startLag > 0 && stopLag > 0))
      throw new Error("The rehearsed walk has no steady stretch to match");
    return {
      length,
      cruise,
      acceleration: (cruise * cruise) / (2 * startLag),
      deceleration: (cruise * cruise) / (2 * stopLag),
    };
  }

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
   * @evidence contracts/development/implementation.md#principled-implementation The hips' progress along +Z, matched by `match`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sample, match, ride.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A walk with no steady stretch is refused by `match`.
   * @evidence contracts/development/implementation.md#efficient-algorithms `SAMPLES + 1` hip reads and one least-squares pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `match`, shared with every led course.
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
    const course: IMatchedCourse = match(progress, step);
    const halt: IAutoMovieVector3 = staged.place(staged.halt).position;
    return {
      start: walking.start,
      ride: rideHorse(
        staged.horse,
        {
          start: { x: halt.x, z: halt.z, heading: 0 },
          cruise: course.cruise,
          startSpeed: 0,
          endSpeed: 0,
          acceleration: course.acceleration,
          deceleration: course.deceleration,
          startFromStanding: true,
          legs: [{ kind: "straight", length: course.length }],
        },
        "walk",
      ),
    };
  }
}
