import {
  Quaternion,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";

/**
 * A reader of one performer.
 *
 * @param motion The performance, or any motion that displays bones.
 * @param subject The performer.
 * @param body Their body.
 * @param yaw The heading their forward is read along, degrees.
 * @returns The reader.
 */
export function HumanSignature(
  motion: IAutoMovieMotionHumanSignature.IMotion,
  subject: string,
  body: IAutoMovieMotionHumanBody,
  yaw: number,
): IAutoMovieMotionHumanSignature.IReader {
  return { motion, subject, body, yaw };
}

/**
 * The kinematic readings of an act's signature: what human-movement studies
 * measure on a performer, read off the displayed bones of a performance.
 *
 * A production checks its own composition with these the way the vocabulary is
 * checked: perform it, then read, at the instants the act's events name, the
 * quantities the literature reports (the trunk's inclination from vertical in
 * the sagittal plane, joint flexions, the whole-body centre of mass, the head's
 * pitch, which feet bear on the floor, the duty factor and the cadence), and
 * compare each with a cited value in a unit test. No reading knows an action;
 * the bounds and their sources belong to the test.
 *
 * ```ts
 * const reader = HumanSignature(performance, "a", body, 0);
 * const lean =
 *   HumanSignature.trunk(reader, seconds) -
 *   HumanSignature.trunk(reader, 0);
 * ```
 *
 * Conventions: the performer's forward is the heading given to the reader, so a
 * positive inclination tips the shoulders ahead of the hips; a flexion is 0
 * with the joint straight and grows as it folds; a head pitch is positive when
 * the face turns down. A foot bears on the floor when its lowest sole socket
 * (heel, ball or toe) lies within `CONTACT` of the floor's height and is nearly
 * still over it (`SLIDE`). The trunk reading of a quiet stance is not exactly
 * zero on every body, so a lean is read against the same body's standing
 * value.
 */
export namespace HumanSignature {
  /**
   * How near the floor a sole socket bears, metres (the 10 mm skin tolerance
   * plus 10 mm).
   */
  export const CONTACT: number = 0.02;

  /**
   * The least time between two strikes of one foot, seconds (provisional: a
   * sprint's stride lasts about 0.45 s, Mero et al. 1992).
   */
  export const STRIDE: number = 0.25;

  /**
   * The horizontal speed below which a low sole counts as bearing, metres per
   * second (provisional: a fifth of a slow walk's speed).
   */
  export const SLIDE: number = 0.2;

  /**
   * Samples a second for a mean or an extreme over a held posture or a whole
   * act: a body settles or moves its trunk over tenths of a second, so ten a
   * second reads it within the bounds' resolution at a third of a 30 Hz film's
   * frames. Swing clearances and contact events keep their own finer rates.
   */
  export const HELD: number = 10;

  /** The performer's bones at a second. */
  export function bones(
    reader: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return reader.motion.bones(reader.subject, seconds);
  }

  /**
   * A joint centre of the performer at a second.
   *
   * @param reader The performer.
   * @param seconds Film seconds.
   * @param bone The bone whose joint it is.
   * @returns World metres.
   * @throws {Error} When the rig lacks the bone.
   */
  export function joint(
    reader: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 {
    const found: IAutoMovieResolvedBone | undefined = bones(
      reader,
      seconds,
    ).get(bone);
    if (found === undefined) throw new Error(`No ${bone}`);
    return found.worldPosition;
  }

  /** A heading's forward on the floor. */
  export function forward(yaw: number): IAutoMovieVector3 {
    const r: number = (yaw * Math.PI) / 180;
    return { x: Math.sin(r), y: 0, z: Math.cos(r) };
  }

  /**
   * The trunk's inclination: the line from the hip joints' midpoint to the
   * shoulder joints' midpoint against the vertical, in the sagittal plane,
   * degrees, positive forward. These are the landmarks gait and squat studies
   * take for the trunk segment (the greater trochanters and the acromia, or the
   * joint centres under them), and in ideal standing alignment the plumb line
   * passes through both, so a quiet stance reads about 0 (Kendall, McCreary,
   * Provance, Rodgers and Romani 2005, Muscles: Testing and Function, 5th
   * ed.).
   */
  export function trunk(
    reader: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
  ): number {
    const l: IAutoMovieVector3 = joint(reader, seconds, "leftUpperLeg");
    const r: IAutoMovieVector3 = joint(reader, seconds, "rightUpperLeg");
    const sl: IAutoMovieVector3 = joint(reader, seconds, "leftUpperArm");
    const sr: IAutoMovieVector3 = joint(reader, seconds, "rightUpperArm");
    const f: IAutoMovieVector3 = forward(reader.yaw);
    const v: IAutoMovieVector3 = {
      x: (sl.x + sr.x) / 2 - (l.x + r.x) / 2,
      y: (sl.y + sr.y) / 2 - (l.y + r.y) / 2,
      z: (sl.z + sr.z) / 2 - (l.z + r.z) / 2,
    };
    return (Math.atan2(v.x * f.x + v.z * f.z, v.y) * 180) / Math.PI;
  }

  /**
   * The angle a distal segment turns from its proximal one at a joint: 0
   * straight, degrees.
   */
  export function flexion(
    proximal: IAutoMovieVector3,
    centre: IAutoMovieVector3,
    distal: IAutoMovieVector3,
  ): number {
    const a: IAutoMovieVector3 = {
      x: centre.x - proximal.x,
      y: centre.y - proximal.y,
      z: centre.z - proximal.z,
    };
    const b: IAutoMovieVector3 = {
      x: distal.x - centre.x,
      y: distal.y - centre.y,
      z: distal.z - centre.z,
    };
    const c: number =
      (a.x * b.x + a.y * b.y + a.z * b.z) /
      (Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z));
    return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
  }

  /** A knee's flexion, degrees. */
  export function knee(
    reader: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
    side: AutoMovieHumanSide,
  ): number {
    return flexion(
      joint(reader, seconds, `${side}UpperLeg`),
      joint(reader, seconds, `${side}LowerLeg`),
      joint(reader, seconds, `${side}Foot`),
    );
  }

  /** A hip's flexion: the thigh's turn from the trunk's line, degrees. */
  export function hip(
    reader: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
    side: AutoMovieHumanSide,
  ): number {
    // The trunk's line continued through the hip: straight is no flexion.
    return flexion(
      joint(reader, seconds, "neck"),
      joint(reader, seconds, `${side}UpperLeg`),
      joint(reader, seconds, `${side}LowerLeg`),
    );
  }

  /** An elbow's flexion, degrees. */
  export function elbow(
    reader: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
    side: AutoMovieHumanSide,
  ): number {
    return flexion(
      joint(reader, seconds, `${side}UpperArm`),
      joint(reader, seconds, `${side}LowerArm`),
      joint(reader, seconds, `${side}Hand`),
    );
  }

  /**
   * The head's pitch: how far its forward axis points below the horizon,
   * degrees.
   */
  export function head(
    reader: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
  ): number {
    const b: IAutoMovieResolvedBone | undefined = bones(reader, seconds).get(
      "head",
    );
    if (b === undefined) throw new Error("No head");
    const f: IAutoMovieVector3 = Quaternion.rotateVector(b.worldRotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return (Math.asin(Math.max(-1, Math.min(1, -f.y))) * 180) / Math.PI;
  }

  /**
   * The whole-body centre of mass of the performer, world metres, on the body's
   * own mass model (`body.massModel`, built once with the body).
   */
  export function centre(
    reader: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
  ): IAutoMovieVector3 {
    return resolveAutoMovieCenterOfMass.place(
      reader.body.massModel,
      bones(reader, seconds),
    );
  }

  /** The lowest sole socket of a foot, world metres. */
  export function sole(
    reader: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 {
    return HumanFoot.sockets(reader.body, bones(reader, seconds), side)
      .map((s): IAutoMovieVector3 => s.point)
      .reduce(
        (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 =>
          b.y < a.y ? b : a,
      );
  }

  /**
   * Whether a foot bears on a floor at a height: its lowest sole socket is
   * within `CONTACT` of the floor and moves over it slower than `SLIDE`. A
   * swinging foot passes as little as 13 mm over the floor at mid-swing (Winter
   * 1992, Phys Ther 72:45, the minimum toe clearance), so height alone would
   * count it as a contact; a bearing foot is still.
   *
   * @param reader The performer.
   * @param seconds Film seconds.
   * @param side The foot.
   * @param floor The floor's height under it, metres; 0 when absent.
   * @param origin The first instant of a series the caller reads at 120 Hz or a
   *   divisor of it (`times(origin, …)`). When `seconds` is an instant of the
   *   120 Hz series from it, the speed is read on that series' own neighbours,
   *   the instants the caller reads anyway, in place of `seconds` less and plus
   *   a 120th, which binary rounding puts beside them. Absent, the latter.
   * @returns Whether the foot bears.
   */
  export function bears(
    reader: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
    side: AutoMovieHumanSide,
    floor: number = 0,
    origin?: number,
  ): boolean {
    const at = (t: number): IAutoMovieVector3[] =>
      HumanFoot.sockets(reader.body, bones(reader, t), side).map(
        (s): IAutoMovieVector3 => s.point,
      );
    const now: IAutoMovieVector3[] = at(seconds);
    let low: number = 0;
    now.forEach((p: IAutoMovieVector3, i: number): void => {
      if (p.y < now[low]!.y) low = i;
    });
    if (now[low]!.y - floor > CONTACT) return false;

    // The same socket a moment either side, so a heel handing the load to
    // the ball does not read as a slide.
    const h: number = 1 / 120;
    const k: number =
      origin === undefined ? NaN : Math.round((seconds - origin) * 120);
    const on: boolean =
      origin !== undefined && k >= 1 && origin + k / 120 === seconds;
    const from: number = Math.max(
      0,
      on ? origin! + (k - 1) / 120 : seconds - h,
    );
    const to: number = Math.min(
      reader.motion.duration,
      on ? origin! + (k + 1) / 120 : seconds + h,
    );
    const a: IAutoMovieVector3 = at(from)[low]!;
    const b: IAutoMovieVector3 = at(to)[low]!;
    const span: number = to - from;
    return span <= 0 || Math.hypot(b.x - a.x, b.z - a.z) / span <= SLIDE;
  }

  /**
   * Instants from `from` to `to` at a rate, each `from + k / rate` from its
   * index: two series from one `from` whose rates divide one another share
   * their common instants bit for bit (`k / 30` is `4k / 120`), where a running
   * sum's rounding would have a film resolved twice at one instant.
   */
  export function times(from: number, to: number, rate: number = 60): number[] {
    const out: number[] = [];
    for (let k: number = 0; from + k / rate <= to + 1e-9; k++)
      out.push(from + k / rate);
    return out;
  }

  /**
   * The gait over a window of steady travel.
   *
   * @param reader The performer.
   * @param from The window's start, seconds.
   * @param to The window's end, seconds.
   * @param rate Samples per second.
   * @returns The duty factor, the cadence and the strikes.
   */
  export function gait(
    reader: IAutoMovieMotionHumanSignature.IReader,
    from: number,
    to: number,
    rate: number = 120,
  ): IAutoMovieMotionHumanSignature.IGait {
    const ts: number[] = times(from, to, rate);
    const strikes: IAutoMovieMotionHumanSignature.IGait["strikes"] = [];
    let bearing: number = 0;
    for (const side of ["left", "right"] as const) {
      let before: boolean | undefined;
      let last: number | undefined;
      for (const t of ts) {
        const now: boolean = bears(reader, t, side, 0, from);
        if (now) bearing++;

        // A foot strikes once a stride: a contact that flickers within a
        // quarter second of the same foot's last strike (a heel handing the
        // load to the ball) is the same footfall.
        if (
          before === false &&
          now &&
          (last === undefined || t - last >= STRIDE)
        ) {
          strikes.push({ seconds: t, side });
          last = t;
        }
        before = now;
      }
    }
    strikes.sort((a, b): number => a.seconds - b.seconds);
    return {
      duty: bearing / (2 * ts.length),

      // Steps a minute from the mean interval between strikes, which a
      // window a few steps long would quantise if strikes were counted.
      cadence:
        strikes.length < 2
          ? 0
          : (60 * (strikes.length - 1)) /
            (strikes[strikes.length - 1]!.seconds - strikes[0]!.seconds),
      strikes,
    };
  }

  /**
   * The peak speed of a joint centre over a window, metres per second, by
   * central differences at 240 Hz: at each instant of the 240 Hz series from
   * the window's start (`times`), the displacement between the series' own
   * neighbours over the time between them. Neighbouring differences share their
   * instants, so each instant of the series, and one past either end, is read
   * once; an instant less and plus a 240th would lie beside the series by
   * binary rounding and be read apart.
   *
   * @param reader The performer.
   * @param bone The bone whose joint it is.
   * @param from The window's start, seconds.
   * @param to The window's end, seconds.
   * @returns The peak speed.
   */
  export function speed(
    reader: IAutoMovieMotionHumanSignature.IReader,
    bone: AutoMovieHumanoidBone,
    from: number,
    to: number,
  ): number {
    const rate: number = 240;
    const start: number = Math.max(1 / rate, from);
    const count: number = times(
      start,
      Math.min(to, reader.motion.duration - 1 / rate),
      rate,
    ).length;
    if (count === 0) return 0;

    // The series' instant k, from -1 to count, inside the motion, each read
    // once: the difference at k spans k - 1 to k + 1.
    const at = (k: number): number =>
      Math.min(reader.motion.duration, Math.max(0, start + k / rate));
    const points: IAutoMovieVector3[] = [];
    for (let k: number = -1; k <= count; k++)
      points.push(joint(reader, at(k), bone));
    let peak: number = 0;
    for (let k: number = 0; k < count; k++) {
      const a: IAutoMovieVector3 = points[k]!;
      const b: IAutoMovieVector3 = points[k + 2]!;
      peak = Math.max(
        peak,
        Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / (at(k + 1) - at(k - 1)),
      );
    }
    return peak;
  }

  /**
   * A region of the performer's body placed on their displayed bones.
   *
   * @param reader The performer.
   * @param name The region.
   * @param seconds Film seconds.
   * @returns World metres.
   * @throws {Error} When the rig lacks the region's bone.
   */
  export function region(
    reader: IAutoMovieMotionHumanSignature.IReader,
    name: AutoMovieHumanoidRegion,
    seconds: number,
  ): IAutoMovieVector3 {
    const frame = reader.body.surfaces.regions[name];
    const bone: IAutoMovieResolvedBone | undefined = bones(reader, seconds).get(
      frame.bone,
    );
    if (bone === undefined) throw new Error(`No ${frame.bone}`);
    return resolveAutoMovieHumanoidSurfaces.place(frame, bone).point;
  }

  /**
   * How far apart two performers are: the least signed distance from any joint
   * centre of either to the other's colliders, metres, negative when a joint
   * lies inside the other body.
   *
   * @param reader One performer.
   * @param partner The other, in the same motion.
   * @param seconds Film seconds.
   * @returns The least distance.
   */
  export function apart(
    reader: IAutoMovieMotionHumanSignature.IReader,
    partner: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
  ): number {
    const mine = bones(reader, seconds);
    const theirs = bones(partner, seconds);
    let least: number = Infinity;
    for (const [, bone] of mine)
      least = Math.min(
        least,
        HumanColliders.distance(partner.body, theirs, bone.worldPosition)
          .distance,
      );
    for (const [, bone] of theirs)
      least = Math.min(
        least,
        HumanColliders.distance(reader.body, mine, bone.worldPosition).distance,
      );
    return least;
  }

  /** The mean of a reading over instants. */
  export function mean(
    ts: readonly number[],
    read: (t: number) => number,
  ): number {
    return (
      ts.reduce((s: number, t: number): number => s + read(t), 0) / ts.length
    );
  }
}
