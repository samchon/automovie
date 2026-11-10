import { Vector3, minimumJerk, smoothMinimum } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { walkFoot } from "./walkFoot";

/**
 * The two-bone geometry of a stepping leg, read without solving it: where the
 * knee's bend puts the shank and the thigh for a hip and an ankle, by the law
 * of cosines on the segment lengths.
 */
export namespace walkLeg {
  /** Degrees a foot keeps inside the ankle's 50° plantar and 20° dorsal limits (DEFAULT_HUMANOID_ROM). */
  export const ANKLE: number = 2;

  /**
   * The shank's forward lean from vertical along a heading, with the knee
   * placed in the plane of the hip, the ankle and the heading.
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param heading The heading the knee bends toward, degrees.
   * @returns Degrees, positive leaning forward.
   */
  export function lean(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    heading: number,
  ): number {
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
      { x: 0, y: 0, z: 1 },
    );
    const v: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    const d: number = Vector3.length(v);
    const a: number = body.measure.thigh;
    const b: number = body.measure.shank;
    if (d < 1e-6) return 0;
    const axis: IAutoMovieVector3 = Vector3.scale(v, 1 / d);
    const along: number = (a * a - b * b + d * d) / (2 * d);
    const across: number = Math.sqrt(Math.max(0, a * a - along * along));
    let perpendicular: IAutoMovieVector3 = Vector3.subtract(
      forward,
      Vector3.scale(axis, Vector3.dot(forward, axis)),
    );
    if (Vector3.length(perpendicular) < 1e-9) return 0;
    perpendicular = Vector3.normalize(perpendicular);
    const knee: IAutoMovieVector3 = Vector3.add(
      hip,
      Vector3.add(
        Vector3.scale(axis, along),
        Vector3.scale(perpendicular, across),
      ),
    );
    const shank: IAutoMovieVector3 = Vector3.subtract(knee, ankle);
    return (Math.atan2(Vector3.dot(shank, forward), shank.y) * 180) / Math.PI;
  }

  /**
   * The angle the bent knee puts between the thigh and the hip-to-ankle line.
   *
   * @param body The body.
   * @param reach The hip-to-ankle distance, metres.
   * @returns Radians.
   */
  export function behind(body: IHumanBody, reach: number): number {
    const a: number = body.measure.thigh;
    const d: number = Math.min(reach, a + body.measure.shank);
    return Math.acos(
      Math.min(
        1,
        Math.max(
          -1,
          (a ** 2 + d ** 2 - body.measure.shank ** 2) /
            (2 * a * Math.max(d, 1e-9)),
        ),
      ),
    );
  }

  /**
   * How far a leg's thigh trails behind vertical in the pelvis's sagittal
   * plane: the hip-to-ankle line's angle less the knee's.
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param yaw The pelvis's heading, degrees.
   * @returns Degrees, positive trailing.
   */
  export function trailing(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    yaw: number,
  ): number {
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const v: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    return (
      ((Math.atan2(-(v.x * forward.x + v.z * forward.z), -v.y) -
        behind(body, Vector3.length(v))) *
        180) /
      Math.PI
    );
  }

  /**
   * A foot's rotation kept inside the ankle's range relative to its shank,
   * less `ANKLE`.
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param rotation The foot's world rotation.
   * @returns The rotation, its pitch clamped.
   */
  export function ankleRange(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion {
    const heading: number = HumanFrame.heading(rotation);
    const shank: number = lean(body, hip, ankle, heading);
    const pitch: number = walkFoot.pitch(rotation);
    const clamped: number = Math.min(
      -shank + 20 - ANKLE,
      Math.max(-shank - 50 + ANKLE, pitch),
    );
    return clamped === pitch ? rotation : HumanFoot.rotation(heading, clamped);
  }

  /**
   * The pitch a planted foot takes about its toes' joint once its shank
   * leans past the ankle's dorsal limit: the forefoot rocker begins where
   * the ankle can bend no further (Perry and Burnfield), so the ball never
   * slides.
   *
   * The room is the ankle's distance from its dorsal limit, less `ANKLE`, and
   * the rise is `rise` on it.
   *
   * @param body The body.
   * @param side The foot.
   * @param hip The hip joint, world metres.
   * @param pivot The toes' joint the foot turns about, world metres.
   * @param heading The foot's heading, degrees.
   * @param pitch The asked pitch, degrees, negative toes-down.
   * @param width The room, degrees, under which the heel begins to rise; zero
   *   keeps the asked pitch until the limit itself.
   * @returns The pitch, no higher than the asked one.
   */
  export function heelRise(
    body: IHumanBody,
    side: "left" | "right",
    hip: IAutoMovieVector3,
    pivot: IAutoMovieVector3,
    heading: number,
    pitch: number,
    width: number,
  ): number {
    return rise(
      (degrees: number): number =>
        -lean(
          body,
          hip,
          HumanFoot.pivot(body, side, "mtp", pivot, heading, degrees).ankle,
          heading,
        ) +
        20 -
        ANKLE -
        degrees,
      pitch,
      width,
    );
  }

  /**
   * The pitch a planted foot's heel rises to so that a room it must keep,
   * which rising the heel buys, never runs out, with the onset rounded.
   *
   * The rounding is done on the room, not the pitch: the foot keeps the room
   * its asked pitch has while that is `width` or more, never less than none,
   * and the smooth maximum of the two in between (the engine's
   * `smoothMinimum`, negated). A straight knee folds the room: the first
   * degrees of heel rise bend the knee and lean the shank faster than they
   * open the ankle, so the room first dips and only then grows, and the pitch
   * that has a given room lies past the dip, a finite step from the asked
   * one. The pitch is therefore searched past the dip, the lowest room found
   * by ternary search and the kept one by bisection beyond it, no steeper
   * than `STEEPEST`, and the foot moves from its asked pitch to that one on a
   * minimum-jerk weight (Flash and Hogan 1985) as the asked room runs from
   * `width` down to none, so the heel's rate is continuous where the rule
   * takes over or lets go. The step past the dip is crossed in the time the
   * asked room takes to run through `width`, so its acceleration falls with
   * the square of the width.
   *
   * A room that only grows as the heel rises has no dip, and the pitch that
   * keeps the smooth maximum is already continuous in rate with the least
   * acceleration a rounding of that width can have; the weight would only
   * steepen it. Such a rule says so with `folds` and takes that pitch itself.
   *
   * @param room The room a pitch leaves, degrees; `Infinity` where the rule
   *   asks nothing of that pitch.
   * @param pitch The asked pitch, degrees, negative toes-down.
   * @param width The room, degrees, under which the heel begins to rise; zero
   *   keeps the asked pitch until the room is none.
   * @param folds Whether the room may dip before it grows as the heel rises.
   * @returns The pitch, no higher than the asked one.
   */
  export function rise(
    room: (degrees: number) => number,
    pitch: number,
    width: number,
    folds: boolean = true,
  ): number {
    const asked: number = room(pitch);
    if (asked >= width || pitch <= -STEEPEST) return pitch;
    const kept: number =
      width > 0 ? -smoothMinimum(-asked, 0, width) : Math.max(asked, 0);
    let far: number = -STEEPEST;
    let near: number = pitch;
    if (folds)
      for (let k: number = 0; k < 24; k++) {
        const a: number = far + (near - far) / 3;
        const b: number = near - (near - far) / 3;
        if (room(a) < room(b)) near = b;
        else far = a;
      }
    let low: number = -STEEPEST;
    let high: number = folds ? (far + near) / 2 : pitch;
    if (room(low) >= kept)
      for (let k: number = 0; k < 30; k++) {
        const middle: number = (low + high) / 2;
        if (room(middle) < kept) high = middle;
        else low = middle;
      }
    if (!folds) return low;
    const share: number =
      width > 0 ? Math.min(1, Math.max(0, (width - asked) / width)) : 1;
    return pitch + (low - pitch) * minimumJerk(share).s;
  }

  /** The room left to a stance's ankle before its dorsal limit, degrees, under which a stepping foot's heel begins to rise (provisional): the heel is leaving the floor by 10° of dorsiflexion (Perry and Burnfield), a third of the way into this rounding under the 18° limit this body keeps, and the rounding is wide enough that the step past the fold is crossed in a stance's few hundredths of a second without a jolt at the knee. */
  export const ROCKER: number = 12;

  /** The steepest heel rise of a planted foot, degrees toes-down (provisional): past it the foot would stand on its toe tips. */
  export const STEEPEST: number = 75;
}
