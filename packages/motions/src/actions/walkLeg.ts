import {
  ANKLE_DORSIFLEXION,
  Vector3,
  minimumJerk,
  smoothMinimum,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * The two-bone geometry of a stepping leg, read without solving it: where the
 * knee's bend puts the shank and the thigh for a hip and an ankle, by the law
 * of cosines on the segment lengths.
 */
export namespace walkLeg {
  /** Degrees a foot keeps inside the ankle's 50° plantar limit and its dorsal one, loaded or unloaded (`ANKLE_DORSIFLEXION`). */
  export const ANKLE: number = 2;

  /**
   * The shank's forward lean from vertical along a heading, with the knee
   * placed where the leg solve places it: the foot has no twist joint, so of
   * the knee's circle about the hip-to-ankle line the knee takes the place,
   * nearest the heading's side, at which a foot of that heading needs no
   * twist against its shank. Where the hip-to-ankle line lies in the
   * heading's vertical plane that is the plane itself; with the heel kicked
   * up behind a sprinting body the line leans sideways and the two places
   * differ by tens of degrees about the line and by about 3 degrees of lean.
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
    // The swing about the hip-to-ankle line at which the foot needs no twist:
    // the shank's forward axis, `across * axis - (along - d) * e` in the leg's
    // plane, is perpendicular to the foot's lateral axis, so
    // `e . lateral = across * (axis . lateral) / (along - d)`.
    const lateral: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
    const side: IAutoMovieVector3 = Vector3.cross(axis, perpendicular);
    const p: number = Vector3.dot(perpendicular, lateral);
    const q: number = Vector3.dot(side, lateral);
    const size: number = Math.hypot(p, q);
    let swing: number = 0;
    if (size > 1e-9 && d - along > 1e-9) {
      const middle: number = Math.atan2(q, p);
      const half: number = Math.acos(
        Math.min(
          1,
          Math.max(
            -1,
            (across * Vector3.dot(axis, lateral)) / ((along - d) * size),
          ),
        ),
      );
      const wrap = (angle: number): number =>
        Math.atan2(Math.sin(angle), Math.cos(angle));
      const one: number = wrap(middle + half);
      const other: number = wrap(middle - half);
      swing = Math.abs(one) <= Math.abs(other) ? one : other;
    }
    const knee: IAutoMovieVector3 = Vector3.add(
      hip,
      Vector3.add(
        Vector3.scale(axis, along),
        Vector3.scale(
          Vector3.add(
            Vector3.scale(perpendicular, Math.cos(swing)),
            Vector3.scale(side, Math.sin(swing)),
          ),
          across,
        ),
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
   * A foot that bears no weight, its rotation kept inside the unloaded
   * ankle's range relative to its shank (`ANKLE_DORSIFLEXION.unloaded`),
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
    const heading: number = HumanFoot.heading(rotation);
    const shank: number = lean(body, hip, ankle, heading);
    const pitch: number = HumanFoot.pitch(rotation);
    const clamped: number = Math.min(
      -shank + ANKLE_DORSIFLEXION.unloaded - ANKLE,
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
        room(body, side, hip, pivot, heading, degrees),
      pitch,
      width,
    );
  }

  /**
   * The room a planted foot's ankle keeps before its dorsal limit at a pitch
   * about its toes' joint, degrees: what `heelRise` keeps.
   *
   * @param body The body.
   * @param side The foot.
   * @param hip The hip joint, world metres.
   * @param pivot The toes' joint the foot turns about, world metres.
   * @param heading The foot's heading, degrees.
   * @param pitch The pitch, degrees, negative toes-down.
   * @returns Degrees; `-Infinity` where the ankle lies beyond the leg's reach from the hip, a pitch the leg cannot stand on at all, whose lean would be read off a leg stretched past its length.
   */
  export function room(
    body: IHumanBody,
    side: "left" | "right",
    hip: IAutoMovieVector3,
    pivot: IAutoMovieVector3,
    heading: number,
    pitch: number,
  ): number {
    const ankle: IAutoMovieVector3 = HumanFoot.pivot(
      body,
      side,
      "mtp",
      pivot,
      heading,
      pitch,
    ).ankle;
    if (
      Vector3.length(Vector3.subtract(ankle, hip)) >
      body.measure.thigh + body.measure.shank
    )
      return -Infinity;
    return (
      -lean(body, hip, ankle, heading) +
      20 -
      ANKLE -
      pitch
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
   * one. The pitch is therefore searched past the dip: the room is walked
   * down from the asked pitch in `SCAN` steps to its first low, which the rise
   * meets first (the room is not unimodal over the whole range: past the
   * first dip it may dip again), that low found by ternary search between the
   * steps around it and the kept room by bisection beyond it, no steeper than
   * `STEEPEST`. A pitch whose ankle lies beyond the leg's reach has no room at
   * all (`-Infinity`): it is no stance, and counting a lean read off a leg
   * stretched past its length made the room cross the kept one twice, the
   * pitch jumping between the crossings as the hip moved by nanometres. An
   * asked pitch the leg cannot stand on is first raised to the least rise
   * that brings the ankle within reach, and the rule goes on from there. and the foot moves from its asked pitch to that one on a
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
   *   asks nothing of that pitch, `-Infinity` where the leg cannot stand on it.
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
    // An asked pitch the leg cannot stand on is first raised to the least
    // rise that brings its ankle within the leg's reach, which is continuous
    // with the asked pitch as the reach is lost; the rule then reads that
    // pitch as the asked one.
    let asked: number = room(pitch);
    if (asked === -Infinity) {
      if (room(-STEEPEST) === -Infinity) return -STEEPEST;
      let out: number = pitch;
      let within: number = -STEEPEST;
      while (out - within > 1e-6) {
        const middle: number = (out + within) / 2;
        if (room(middle) === -Infinity) out = middle;
        else within = middle;
      }
      pitch = within;
      asked = room(pitch);
    }
    if (asked >= width || pitch <= -STEEPEST) return pitch;
    const kept: number =
      width > 0 ? -smoothMinimum(-asked, 0, width) : Math.max(asked, 0);
    // The dip is the first low of the room as the heel rises from the asked
    // pitch: walked down in `SCAN` steps until the room grows again, then
    // narrowed by ternary search between the steps on either side of it, so
    // the dip found is the one the rise meets first, not whichever of two
    // lows a search over the whole range happens to fall into.
    let far: number = -STEEPEST;
    let near: number = pitch;
    if (folds) {
      let before: number = room(pitch);
      for (let at: number = pitch - SCAN; at > -STEEPEST; at -= SCAN) {
        const value: number = room(at);
        // Pitches the leg cannot stand on lie before the dip, not in it.
        if (value > before && before > -Infinity) {
          far = Math.max(-STEEPEST, at);
          near = Math.min(pitch, at + 2 * SCAN);
          break;
        }
        before = value;
      }
      for (let k: number = 0; k < 24; k++) {
        const a: number = far + (near - far) / 3;
        const b: number = near - (near - far) / 3;
        if (room(a) < room(b)) near = b;
        else far = a;
      }
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

  /** The step, degrees, in which `rise` walks the room down from the asked pitch to find its first low: half a degree, under which the room of a leg near straight has no second low. */
  export const SCAN: number = 0.5;

  /** The steepest heel rise of a planted foot, degrees toes-down (provisional): past it the foot would stand on its toe tips. */
  export const STEEPEST: number = 75;
}
