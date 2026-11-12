import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

/**
 * Whether a body standing on both feet alone keeps its balance: the margin
 * of stability of Hof, Gazendam and Sinke (2005) at every instant where both
 * feet are declared planted on the ground and nothing else bears the body.
 *
 * The extrapolated centre of mass is the engine's whole-body centre plus its
 * velocity over the eigenfrequency of an inverted pendulum 1.34 hip heights
 * long (Hof et al.'s length). The velocity is a central difference: over the
 * grid's two neighbouring instants when a whole motion is measured, so the
 * reading resolves no pose the audit's other checks have not, and over `2 *
 * STEP` when one instant is asked for alone. The
 * margin is its distance inside the convex hull of both feet's heel, ball
 * and toe points. A person whose extrapolated centre leaves that hull must
 * step or fall, so a motion that keeps both feet planted while it lies
 * outside shows a body no one could hold. An instant where a hand grips, a
 * seat or a back bears, or a foot is not planted is not read: the feet are
 * not the only support there. Nor is an instant within the pendulum's own
 * time constant (the square root of its length over gravity, about a third
 * of a second) of a foot leaving the ground: that body is taking the step
 * Hof et al.'s condition demands, and in steady walking the extrapolated
 * centre does lie ahead of the leading foot through the double support
 * (Hof 2008, Hum Mov Sci 27:112).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the measure with its source, its pendulum length, the support hull and which instants are read.
 * @evidence contracts/development/implementation.md#principled-implementation Hof et al.'s extrapolated centre of mass through the engine's owners of the centre, the extrapolation and the hull margin.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One predicate for the instants read, one measure of an instant, one walk of the grid.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed bones; an instant is skipped only by the declared contacts, never by its margin.
 * @evidence contracts/development/implementation.md#efficient-algorithms A whole motion reads only its grid's poses, each instant's velocity from its two neighbours; the mass model is built once per call.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the motion handed in.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditBalance {
  /** Half the span of the velocity's central difference when one instant is read alone, seconds. */
  export const STEP: number = 1 / 240;

  /**
   * How far the extrapolated centre of mass leaves the feet's hull over the
   * instants where both feet alone bear the body.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param body Their body.
   * @param rate Grid samples per second.
   * @returns Metres outside the hull (zero when it never leaves, or when no instant is read), with `both feet` and the second.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    const windows: IAutoMovieMotionHumanAuditMotion.IWindow[] =
      IAutoMovieMotionHumanAuditMotion.windows(motion, subject);
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    let worst: IAutoMovieMotionHumanAuditMeasure = {
      value: 0,
      seconds: 0,
      where: "none",
    };
    const hold: number = Math.sqrt((1.34 * body.measure.hipHeight) / 9.81);
    const times: number[] = IAutoMovieMotionHumanAuditMotion.grid(
      0,
      motion.duration,
      rate,
    );
    for (let i: number = 0; i < times.length; i++) {
      const t: number = times[i]!;
      // A foot that lifts within the pendulum's own time is a step being
      // taken: the body is walking there, not standing.
      if (!standing(windows, t, Math.min(motion.duration, t + hold))) continue;
      const value: number = -margin(
        motion,
        subject,
        body,
        model,
        t,
        times[Math.max(0, i - 1)]!,
        times[Math.min(times.length - 1, i + 1)]!,
      );
      if (value > worst.value)
        worst = { value, seconds: t, where: "both feet" };
    }
    return worst;
  }

  /**
   * The margin of stability at one instant, whatever the contacts.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param body Their body.
   * @param model The body's mass model.
   * @param seconds Film seconds.
   * @param before The earlier instant of the velocity's difference; `STEP` before, clamped into the motion, by default.
   * @param after The later instant of the velocity's difference; `STEP` after, clamped into the motion, by default.
   * @returns Metres, positive inside the feet's hull.
   */
  export function margin(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IHumanBody,
    model: resolveAutoMovieCenterOfMass.IModel,
    seconds: number,
    before: number = Math.max(0, seconds - STEP),
    after: number = Math.min(motion.duration, seconds + STEP),
  ): number {
    const com = (t: number): IAutoMovieVector3 =>
      resolveAutoMovieCenterOfMass.place(model, motion.bones(subject, t));
    const a: IAutoMovieVector3 = com(before);
    const b: IAutoMovieVector3 = com(after);
    const span: number = after - before;
    const velocity: IAutoMovieVector3 =
      span > 0
        ? {
            x: (b.x - a.x) / span,
            y: (b.y - a.y) / span,
            z: (b.z - a.z) / span,
          }
        : { x: 0, y: 0, z: 0 };
    return resolveAutoMovieCenterOfMass.margin(
      resolveAutoMovieCenterOfMass.extrapolate(
        com(seconds),
        velocity,
        1.34 * body.measure.hipHeight,
      ),
      HumanFoot.base(body, motion.bones(subject, seconds)),
    );
  }

  /**
   * Whether both feet alone bear the body at an instant: each foot inside a
   * plant window on the ground, and no other contact window open.
   *
   * @param windows The person's contact windows, film seconds.
   * @param seconds Film seconds.
   * @param until The second both feet must stay planted to, without a gap; `seconds` itself when absent.
   * @returns Whether the instant is read.
   */
  export function standing(
    windows: readonly IAutoMovieMotionHumanAuditMotion.IWindow[],
    seconds: number,
    until: number = seconds,
  ): boolean {
    if (until > seconds)
      for (const part of ["leftFoot", "rightFoot"] as const) {
        // How long this foot stays planted from the instant on, through
        // plant windows that follow one another without a gap.
        let kept: number = seconds;
        for (let grown: boolean = true; grown && kept < until; ) {
          grown = false;
          for (const window of windows)
            if (
              window.contact.part === part &&
              window.contact.kind === "plant" &&
              window.from <= kept + 1e-9 &&
              window.to > kept + 1e-9
            ) {
              kept = window.to;
              grown = true;
            }
        }
        if (kept < until - 1e-9) return false;
      }
    let left: boolean = false;
    let right: boolean = false;
    for (const window of windows) {
      if (seconds < window.from || seconds > window.to) continue;
      const foot: boolean =
        window.contact.part === "leftFoot" ||
        window.contact.part === "rightFoot";
      if (
        !foot ||
        window.contact.kind !== "plant" ||
        window.contact.support.kind !== "ground"
      )
        return false;
      if (window.contact.part === "leftFoot") left = true;
      else right = true;
    }
    return left && right;
  }
}
