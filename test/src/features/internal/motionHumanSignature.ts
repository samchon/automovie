import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature, type IHumanBody } from "@automovie/motions";

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
  /** How near the floor a sole socket bears, metres. */
  export const CONTACT: number = HumanSignature.CONTACT;

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

  /** `a` of a staged row as the package's signature reader. */
  export function reader(staged: IStaged): HumanSignature.IReader {
    return HumanSignature.of(staged.film, "a", staged.body, staged.yaw);
  }

  /** The bones of `a` at a second. */
  export function bones(
    staged: IStaged,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return HumanSignature.bones(reader(staged), seconds);
  }

  /** A joint centre of `a` at a second. */
  export function joint(
    staged: IStaged,
    seconds: number,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 {
    return HumanSignature.joint(reader(staged), seconds, bone);
  }

  /** The performer's forward on the floor. */
  export const forward: typeof HumanSignature.forward = HumanSignature.forward;

  /** The trunk's inclination of `a`, degrees, positive forward (`HumanSignature.trunk`). */
  export function trunk(staged: IStaged, seconds: number): number {
    return HumanSignature.trunk(reader(staged), seconds);
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
  export const flexion: typeof HumanSignature.flexion = HumanSignature.flexion;

  /** A knee's flexion, degrees. */
  export function knee(
    staged: IStaged,
    seconds: number,
    side: "left" | "right",
  ): number {
    return HumanSignature.knee(reader(staged), seconds, side);
  }

  /** A hip's flexion: the thigh's turn from the trunk's line, degrees. */
  export function hip(
    staged: IStaged,
    seconds: number,
    side: "left" | "right",
  ): number {
    return HumanSignature.hip(reader(staged), seconds, side);
  }

  /** An elbow's flexion, degrees. */
  export function elbow(
    staged: IStaged,
    seconds: number,
    side: "left" | "right",
  ): number {
    return HumanSignature.elbow(reader(staged), seconds, side);
  }

  /** The head's pitch: how far its forward axis points below the horizon, degrees. */
  export function head(staged: IStaged, seconds: number): number {
    return HumanSignature.head(reader(staged), seconds);
  }

  /** The whole-body centre of mass of `a`, world metres. */
  export function centre(staged: IStaged, seconds: number): IAutoMovieVector3 {
    return HumanSignature.centre(reader(staged), seconds);
  }

  /** The lowest sole socket of a foot, world metres. */
  export function sole(
    staged: IStaged,
    seconds: number,
    side: "left" | "right",
  ): IAutoMovieVector3 {
    return HumanSignature.sole(reader(staged), seconds, side);
  }

  /** Whether a foot of `a` bears on a floor at a height (`HumanSignature.bears`). */
  export function bears(
    staged: IStaged,
    seconds: number,
    side: "left" | "right",
    floor: number = 0,
  ): boolean {
    return HumanSignature.bears(reader(staged), seconds, side, floor);
  }

  /** The least time between two strikes of one foot, seconds. */
  export const STRIDE: number = HumanSignature.STRIDE;

  /** The horizontal speed below which a low sole counts as bearing, metres per second. */
  export const SLIDE: number = HumanSignature.SLIDE;

  /** Samples a second for a mean or an extreme over a held posture or a whole act. */
  export const HELD: number = HumanSignature.HELD;

  /** Instants from `from` to `to` at a rate. */
  export const times: typeof HumanSignature.times = HumanSignature.times;

  /** The gait of a window: the duty factor of each foot and the cadence. */
  export type IGait = HumanSignature.IGait;

  /** The gait of `a` over a window of steady travel (`HumanSignature.gait`). */
  export function gait(
    staged: IStaged,
    from: number,
    to: number,
    rate: number = 120,
  ): IGait {
    return HumanSignature.gait(reader(staged), from, to, rate);
  }

  /** The peak speed of a joint centre of `a` over a window, metres per second. */
  export function speed(
    staged: IStaged,
    bone: AutoMovieHumanoidBone,
    from: number,
    to: number,
  ): number {
    return HumanSignature.speed(reader(staged), bone, from, to);
  }

  /** A region of a person placed on their displayed bones, world metres. */
  export function region(
    staged: IStaged,
    subject: string,
    body: IHumanBody,
    name: string,
    seconds: number,
  ): IAutoMovieVector3 {
    return HumanSignature.region(
      HumanSignature.of(staged.film, subject, body, staged.yaw),
      name as AutoMovieHumanoidRegion,
      seconds,
    );
  }

  /** How far apart `a` and `b` stand, metres, negative when a joint lies inside the other body. */
  export function apart(
    staged: IStaged,
    seconds: number,
    partner: IHumanBody,
  ): number {
    return HumanSignature.apart(
      reader(staged),
      HumanSignature.of(staged.film, "b", partner, staged.yaw),
      seconds,
    );
  }

  /** The mean of a reading over instants. */
  export const mean: typeof HumanSignature.mean = HumanSignature.mean;
  /** The film second of a named event, or undefined when the law has none. */
  export function event(staged: IStaged, name: string): number | undefined {
    try {
      return motionHumanLaw.event(staged.film, name);
    } catch {
      return undefined;
    }
  }
}
