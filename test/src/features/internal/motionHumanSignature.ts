import {
  type IAutoMovieResolvedBone,
  Quaternion,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanColliders, HumanFoot, type IHumanBody } from "@automovie/motions";

import { MOTION_HUMAN_LAW_STAGES } from "./MOTION_HUMAN_LAW_STAGES";
import { motionCoveringArray } from "./motionCoveringArray";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";
import type { motionHumanLawSweep } from "./motionHumanLawSweep";

/**
 * The kinematic readings of an act's signature: what human-movement studies
 * measure on a performer, read off the displayed bones of a law's film.
 *
 * A signature test stages a law the way the law sweep does (the family stage
 * tables), performs it on a real body and reads, at the instants the act's
 * own events or the film's contacts name, the quantities the literature
 * reports: the trunk's inclination from vertical in the sagittal plane, joint
 * flexions as the angle a limb segment turns from its proximal segment, the
 * whole-body centre of mass, the head's pitch, which feet bear on the floor,
 * the duty factor and the cadence. None of these readings knows a law; the
 * bounds live in the tests with their sources.
 *
 * Conventions: the performer's forward is the heading of the stage, so a
 * positive inclination tips the neck ahead of the hips; a flexion is 0 with
 * the joint straight and grows as it folds; a head pitch is positive when the
 * face turns down. A foot bears on the floor when its lowest sole socket
 * (heel, ball or toe) lies within `CONTACT` of the floor's height and is
 * nearly still over it (`SLIDE`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, the sign of each reading and the contact rule.
 * @evidence contracts/development/implementation.md#principled-implementation Every reading is geometry of displayed joint centres and the engine's whole-body centre of mass, the quantities motion-capture studies report.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One staging helper and one small function per reading.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No reading is calibrated on a law; a missing bone throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Readings share the film's remembered frames.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Stages come from the law sweep's tables and films from `motionHumanLaw`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A film lives as long as the test that holds it.
 */
export namespace motionHumanSignature {
  /** How near the floor a sole socket bears, metres (the 10 mm skin tolerance plus 10 mm). */
  export const CONTACT: number = 0.02;

  /** A performed row. */
  export interface IStaged {
    /** The film. */
    film: motionHumanLaw.IFilm;

    /** The body of `a`. */
    body: IHumanBody;

    /** `a`'s heading, degrees. */
    yaw: number;
  }

  /**
   * Perform one row of a law on a body, staged as the law sweep stages it.
   *
   * @param law The law.
   * @param row `default` or `param=value`.
   * @param name The body of `a`; the partner is the average man.
   * @returns The film, the body and the heading.
   */
  export function stage(
    law: string,
    row: string,
    name: motionHumanBody.Name,
  ): IStaged {
    const table: Record<string, motionHumanLawSweep.Stage> = Object.assign(
      {},
      ...Object.values(MOTION_HUMAN_LAW_STAGES),
    );
    const at: number = row.indexOf("=");
    const param: string = at < 0 ? "" : row.slice(0, at);
    const scene = table[law]!(
      (p: string): string | undefined =>
        p === param ? row.slice(at + 1) : undefined,
      motionHumanBody(name),
      motionHumanBody("m-average"),
    );
    return {
      film: motionHumanLaw.perform(
        "signature",
        scene.people,
        scene.composition,
        scene.props,
      ),
      body: scene.people[0]!.body,
      yaw: scene.people[0]!.yaw,
    };
  }

  /** A row of a law performed on one body. */
  export interface ICell {
    /** `default` or `param=value`. */
    row: string;

    /** The body of `a`. */
    name: motionHumanBody.Name;
  }

  /**
   * The cells that cover every row and every extreme body at least once: the
   * strength-1 covering array of the two factors. Rows that only vary one
   * parameter from the default carry no interaction with the body's shape
   * beyond what one body per row and every body in some row already reach
   * (Kuhn, Kacker and Lei 2010), so the test's cost grows with the larger of
   * the two counts, not their product. A bound that compares rows of one
   * body stages those rows on every body itself.
   *
   * @param rows The rows.
   * @returns The cells, rows in order, each body at least once.
   */
  export function cells(rows: readonly string[]): ICell[] {
    return motionCoveringArray(
      { row: rows, name: motionHumanBody.EXTREMES },
      1,
    ).map((c) => ({ row: c.row!, name: c.name as motionHumanBody.Name }));
  }

  /** The bones of `a` at a second. */
  export function bones(
    staged: IStaged,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return staged.film.bones("a", seconds);
  }

  /** A joint centre of `a` at a second. */
  export function joint(
    staged: IStaged,
    seconds: number,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 {
    const found: IAutoMovieResolvedBone | undefined = bones(
      staged,
      seconds,
    ).get(bone);
    if (found === undefined) throw new Error(`No ${bone}`);
    return found.worldPosition;
  }

  /** The performer's forward on the floor. */
  export function forward(yaw: number): IAutoMovieVector3 {
    const r: number = (yaw * Math.PI) / 180;
    return { x: Math.sin(r), y: 0, z: Math.cos(r) };
  }

  /**
   * The trunk's inclination: the line from the hip joints' midpoint to the
   * shoulder joints' midpoint against the vertical, in the sagittal plane,
   * degrees, positive forward. These are the landmarks gait and squat
   * studies take for the trunk segment (the greater trochanters and the
   * acromia, or the joint centres under them), and in ideal standing
   * alignment the plumb line passes through both, so a quiet stance reads
   * about 0 (Kendall, McCreary, Provance, Rodgers and Romani 2005, Muscles:
   * Testing and Function, 5th ed.; `STANCE`).
   */
  export function trunk(staged: IStaged, seconds: number): number {
    const l: IAutoMovieVector3 = joint(staged, seconds, "leftUpperLeg");
    const r: IAutoMovieVector3 = joint(staged, seconds, "rightUpperLeg");
    const sl: IAutoMovieVector3 = joint(staged, seconds, "leftUpperArm");
    const sr: IAutoMovieVector3 = joint(staged, seconds, "rightUpperArm");
    const f: IAutoMovieVector3 = forward(staged.yaw);
    const v: IAutoMovieVector3 = {
      x: (sl.x + sr.x) / 2 - (l.x + r.x) / 2,
      y: (sl.y + sr.y) / 2 - (l.y + r.y) / 2,
      z: (sl.z + sr.z) / 2 - (l.z + r.z) / 2,
    };
    return (Math.atan2(v.x * f.x + v.z * f.z, v.y) * 180) / Math.PI;
  }

  /** Each body's quiet-stance trunk reading, computed once a process. */
  const UPRIGHT: Map<string, number> = new Map();

  /** How far from vertical the quiet stance's trunk may read, degrees (provisional tolerance about Kendall et al.'s ideal alignment). */
  export const STANCE: number = 3;

  /**
   * The trunk's inclination of a body's own quiet stance, the reference a
   * reading relative to standing is taken from.
   *
   * @param name The body.
   * @returns Degrees, positive forward.
   */
  export function upright(name: motionHumanBody.Name): number {
    const known: number | undefined = UPRIGHT.get(name);
    if (known !== undefined) return known;
    const reading: number = trunk(stage("stand", "default", name), 1);
    UPRIGHT.set(name, reading);
    return reading;
  }

  /**
   * The calibration of `trunk`: the quiet stance of a body, which ideal
   * alignment holds with the shoulder joints over the hip joints.
   *
   * @param name The body.
   * @returns A complaint when the stance reads beyond `STANCE`; empty when it does not.
   */
  export function calibrate(name: motionHumanBody.Name): string[] {
    const reading: number = upright(name);
    return Math.abs(reading) <= STANCE
      ? []
      : [
          `stand ${name}: the quiet stance's trunk reads ${reading.toFixed(2)} deg, within ${STANCE} of vertical expected (Kendall et al. 2005)`,
        ];
  }

  /** The angle a distal segment turns from its proximal one at a joint: 0 straight, degrees. */
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
    staged: IStaged,
    seconds: number,
    side: "left" | "right",
  ): number {
    return flexion(
      joint(staged, seconds, `${side}UpperLeg`),
      joint(staged, seconds, `${side}LowerLeg`),
      joint(staged, seconds, `${side}Foot`),
    );
  }

  /** A hip's flexion: the thigh's turn from the trunk's line, degrees. */
  export function hip(
    staged: IStaged,
    seconds: number,
    side: "left" | "right",
  ): number {
    // The trunk's line continued through the hip: straight is no flexion.
    return flexion(
      joint(staged, seconds, "neck"),
      joint(staged, seconds, `${side}UpperLeg`),
      joint(staged, seconds, `${side}LowerLeg`),
    );
  }

  /** An elbow's flexion, degrees. */
  export function elbow(
    staged: IStaged,
    seconds: number,
    side: "left" | "right",
  ): number {
    return flexion(
      joint(staged, seconds, `${side}UpperArm`),
      joint(staged, seconds, `${side}LowerArm`),
      joint(staged, seconds, `${side}Hand`),
    );
  }

  /** The head's pitch: how far its forward axis points below the horizon, degrees. */
  export function head(staged: IStaged, seconds: number): number {
    const b = bones(staged, seconds).get("head")!;
    const f: IAutoMovieVector3 = Quaternion.rotateVector(b.worldRotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return (Math.asin(Math.max(-1, Math.min(1, -f.y))) * 180) / Math.PI;
  }

  /** The whole-body centre of mass of `a`, world metres. */
  export function centre(staged: IStaged, seconds: number): IAutoMovieVector3 {
    return resolveAutoMovieCenterOfMass.place(
      resolveAutoMovieCenterOfMass(staged.body.skeleton, staged.body.profile),
      bones(staged, seconds),
    );
  }

  /** The lowest sole socket of a foot, world metres. */
  export function sole(
    staged: IStaged,
    seconds: number,
    side: "left" | "right",
  ): IAutoMovieVector3 {
    return HumanFoot.sockets(staged.body, bones(staged, seconds), side)
      .map((s) => s.point)
      .reduce((a, b) => (b.y < a.y ? b : a));
  }

  /**
   * Whether a foot bears on a floor at a height: its lowest sole socket is
   * within `CONTACT` of the floor and moves over it slower than `SLIDE`. A
   * swinging foot passes as little as 13 mm over the floor at mid-swing
   * (Winter 1992, Phys Ther 72:45, the minimum toe clearance), so height
   * alone would count it as a contact; a bearing foot is still.
   */
  export function bears(
    staged: IStaged,
    seconds: number,
    side: "left" | "right",
    floor: number = 0,
  ): boolean {
    const at = (t: number): IAutoMovieVector3[] =>
      HumanFoot.sockets(staged.body, bones(staged, t), side).map(
        (s) => s.point,
      );
    const now: IAutoMovieVector3[] = at(seconds);
    let low: number = 0;
    now.forEach((p, i) => {
      if (p.y < now[low]!.y) low = i;
    });
    if (now[low]!.y - floor > CONTACT) return false;
    // The same socket a moment either side, so a heel handing the load to
    // the ball does not read as a slide.
    const h: number = 1 / 120;
    const a: IAutoMovieVector3 = at(Math.max(0, seconds - h))[low]!;
    const b: IAutoMovieVector3 = at(
      Math.min(staged.film.duration, seconds + h),
    )[low]!;
    const span: number =
      Math.min(staged.film.duration, seconds + h) - Math.max(0, seconds - h);
    return span <= 0 || Math.hypot(b.x - a.x, b.z - a.z) / span <= SLIDE;
  }

  /** The least time between two strikes of one foot, seconds (provisional: a sprint's stride lasts about 0.45 s, Mero et al. 1992). */
  export const STRIDE: number = 0.25;

  /** The horizontal speed below which a low sole counts as bearing, metres per second (provisional: a fifth of a slow walk's speed). */
  export const SLIDE: number = 0.2;

  /**
   * Samples a second for a mean or an extreme over a held posture or a whole
   * act: a body settles or moves its trunk over tenths of a second, so ten a
   * second reads it within the bounds' resolution at a third of a 30 Hz
   * film's frames. Swing clearances and contact events keep their own finer
   * rates.
   */
  export const HELD: number = 10;

  /** Instants from `from` to `to` at a rate. */
  export function times(from: number, to: number, rate: number = 60): number[] {
    const out: number[] = [];
    for (let t: number = from; t <= to + 1e-9; t += 1 / rate) out.push(t);
    return out;
  }

  /** The gait of a window: the duty factor of each foot and the cadence. */
  export interface IGait {
    /** The share of the window each foot bears, averaged over both feet. */
    duty: number;

    /** Foot strikes (a foot coming down) per minute, both feet. */
    cadence: number;

    /** The strikes, in time order, with the foot. */
    strikes: { seconds: number; side: "left" | "right" }[];
  }

  /**
   * The gait over a window of steady travel.
   *
   * @param staged The row.
   * @param from The window's start, seconds.
   * @param to The window's end, seconds.
   * @param rate Samples per second.
   * @returns The duty factor, the cadence and the strikes.
   */
  export function gait(
    staged: IStaged,
    from: number,
    to: number,
    rate: number = 120,
  ): IGait {
    const ts: number[] = times(from, to, rate);
    const strikes: { seconds: number; side: "left" | "right" }[] = [];
    let bearing: number = 0;
    for (const side of ["left", "right"] as const) {
      let before: boolean | undefined;
      for (const t of ts) {
        const now: boolean = bears(staged, t, side);
        if (now) bearing++;
        // A foot strikes once a stride: a contact that flickers within a
        // quarter second of the same foot's last strike (a heel handing the
        // load to the ball) is the same footfall.
        const mine = strikes.filter((s) => s.side === side);
        const last: number | undefined = mine[mine.length - 1]?.seconds;
        if (
          before === false &&
          now &&
          (last === undefined || t - last >= STRIDE)
        )
          strikes.push({ seconds: t, side });
        before = now;
      }
    }
    strikes.sort((a, b) => a.seconds - b.seconds);
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
   * central differences at 240 Hz.
   */
  export function speed(
    staged: IStaged,
    bone: AutoMovieHumanoidBone,
    from: number,
    to: number,
  ): number {
    const h: number = 1 / 240;
    let peak: number = 0;
    for (const t of times(
      Math.max(h, from),
      Math.min(to, staged.film.duration - h),
      240,
    )) {
      const a: IAutoMovieVector3 = joint(staged, t - h, bone);
      const b: IAutoMovieVector3 = joint(staged, t + h, bone);
      peak = Math.max(
        peak,
        Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / (2 * h),
      );
    }
    return peak;
  }

  /** A region of a person placed on their displayed bones, world metres. */
  export function region(
    staged: IStaged,
    subject: string,
    body: IHumanBody,
    name: string,
    seconds: number,
  ): IAutoMovieVector3 {
    const frame = (
      body.surfaces.regions as Record<
        string,
        Parameters<typeof resolveAutoMovieHumanoidSurfaces.place>[0]
      >
    )[name]!;
    return resolveAutoMovieHumanoidSurfaces.place(
      frame,
      staged.film.bones(subject, seconds).get(frame.bone)!,
    ).point;
  }

  /**
   * How far apart two people stand: the least signed distance from any joint
   * centre of either to the other's colliders, metres, negative when a joint
   * lies inside the other body.
   */
  export function apart(
    staged: IStaged,
    seconds: number,
    partner: IHumanBody,
  ): number {
    const mine = bones(staged, seconds);
    const theirs = staged.film.bones("b", seconds);
    let least: number = Infinity;
    for (const [, bone] of mine)
      least = Math.min(
        least,
        HumanColliders.distance(partner, theirs, bone.worldPosition).distance,
      );
    for (const [, bone] of theirs)
      least = Math.min(
        least,
        HumanColliders.distance(staged.body, mine, bone.worldPosition).distance,
      );
    return least;
  }

  /** The mean of a reading over instants. */
  export function mean(
    ts: readonly number[],
    read: (t: number) => number,
  ): number {
    return ts.reduce((s, t) => s + read(t), 0) / ts.length;
  }

  /** The film second of a named event, or undefined when the law has none. */
  export function event(staged: IStaged, name: string): number | undefined {
    try {
      return motionHumanLaw.event(staged.film, name);
    } catch {
      return undefined;
    }
  }
}
