import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanAuditBalance } from "./AutoMovieMotionHumanAuditBalance";
import { AutoMovieMotionHumanAuditContinuity } from "./AutoMovieMotionHumanAuditContinuity";
import { AutoMovieMotionHumanAuditGround } from "./AutoMovieMotionHumanAuditGround";
import { AutoMovieMotionHumanAuditTangle } from "./AutoMovieMotionHumanAuditTangle";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import type { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

/**
 * The generic audit of a displayed human motion: every check that holds for
 * any action whatever it means to do, read from the displayed bones alone.
 *
 * - `tangle`: no part of the body passes into another part of it.
 * - `floor`: no collider sinks below the floor.
 * - `slip`, `lift`: a foot declared planted stays where it stands, on the floor.
 * - `jump`, `reversal`, `speed`: every joint centre travels a continuous path
 *   with no out-and-back spike and no impossible speed.
 * - `balance`: while both feet alone bear the body, its extrapolated centre
 *   of mass stays over them.
 *
 * Each check has a limit; a reading above its limit is a finding. A limit of
 * `null` leaves the check unread, for an action a check does not apply to (a
 * fall is meant to lose its balance). What an action intends (which hand
 * reaches where, at which beat) is not the audit's: that is pinned by the
 * action's own tests.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every check with what it means and states what the audit leaves to an action's own tests.
 * @evidence contracts/development/implementation.md#principled-implementation Each check is owned by its namespace; this one applies limits and gathers findings.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A table of checks walked once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A check is skipped only by an explicit `null` limit from the caller.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each check walks the grid once; a skipped check costs nothing.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The checks share one grid, so an instant's displayed bones are resolved once per audit and read by every check.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The resolved bones are held by one run's own closure and released when it returns.
 */
export namespace AutoMovieMotionHumanAudit {
  /** The name of a check. */
  export type Check =
    | "tangle"
    | "floor"
    | "slip"
    | "lift"
    | "jump"
    | "reversal"
    | "speed"
    | "balance";

  /** The largest reading each check allows; `null` leaves a check unread. */
  export type ILimits = Record<Check, number | null>;

  /** How an audit is run. */
  export interface IOptions {
    /** Grid samples per second; 24 by default. */
    rate?: number;

    /** Limits that replace the defaults. */
    limits?: Partial<ILimits>;
  }

  /** A reading above its limit. */
  export interface IFinding extends IAutoMovieMotionHumanAuditMeasure {
    /** The check that read it. */
    check: Check;

    /** The limit it exceeds. */
    limit: number;
  }

  /** What an audit read. */
  export interface IReport {
    /** Every check's reading; absent for a check left unread. */
    measures: Partial<Record<Check, IAutoMovieMotionHumanAuditMeasure>>;

    /** Every pair of body parts that passed into each other, deepest first; empty when `tangle` is unread. */
    pairs: AutoMovieMotionHumanAuditTangle.IPair[];

    /** The readings above their limits, in check order. */
    findings: IFinding[];
  }

  /**
   * The default limits, metres unless stated: 10 mm of self-penetration (the
   * skin's give where a hand rests on the body), 5 mm below the floor, 5 mm
   * of slip and of lift (the project's foot verdict bound), a 5 mm jump, a
   * 50 mm out-and-back, 30 m/s (above any human joint speed: a pitcher's
   * hand peaks near 40 m/s only at ball release, a punch's fist near 10 m/s)
   * and no departure of the extrapolated centre of mass from the feet.
   */
  export const LIMITS: Readonly<Record<Check, number>> = {
    tangle: 0.01,
    floor: 0.005,
    slip: 0.005,
    lift: 0.005,
    jump: 0.005,
    reversal: 0.05,
    speed: 30,
    balance: 0,
  };

  /** The checks in report order. */
  export const CHECKS: readonly Check[] = [
    "tangle",
    "floor",
    "slip",
    "lift",
    "jump",
    "reversal",
    "speed",
    "balance",
  ];

  /**
   * Audit one person of a motion.
   *
   * The checks share one grid, so the displayed bones of an instant are
   * resolved once and read by all of them.
   *
   * @param source The motion.
   * @param subject The person.
   * @param body Their body.
   * @param options The grid and the limits.
   * @returns The readings and the findings.
   */
  export function run(
    source: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IHumanBody,
    options: IOptions = {},
  ): IReport {
    const motion: IAutoMovieMotionHumanAuditMotion = remember(source);
    const rate: number = options.rate ?? 24;
    const limits: ILimits = { ...LIMITS, ...options.limits };
    const measures: IReport["measures"] = {};
    let pairs: AutoMovieMotionHumanAuditTangle.IPair[] = [];
    if (limits.tangle !== null) {
      const tangle: AutoMovieMotionHumanAuditTangle.IResult =
        AutoMovieMotionHumanAuditTangle.measure(motion, subject, body, rate);
      measures.tangle = tangle.worst;
      pairs = tangle.pairs;
    }
    if (limits.floor !== null)
      measures.floor = AutoMovieMotionHumanAuditGround.floor(
        motion,
        subject,
        body,
        rate,
      );
    if (limits.slip !== null)
      measures.slip = AutoMovieMotionHumanAuditGround.slip(
        motion,
        subject,
        body,
        rate,
      );
    if (limits.lift !== null)
      measures.lift = AutoMovieMotionHumanAuditGround.lift(
        motion,
        subject,
        body,
        rate,
      );
    if (
      limits.jump !== null ||
      limits.reversal !== null ||
      limits.speed !== null
    ) {
      const continuity: AutoMovieMotionHumanAuditContinuity.IResult =
        AutoMovieMotionHumanAuditContinuity.measure(
          motion,
          subject,
          rate,
          limits.jump ?? LIMITS.jump,
          limits.reversal ?? LIMITS.reversal,
        );
      if (limits.jump !== null) measures.jump = continuity.jump;
      if (limits.reversal !== null) measures.reversal = continuity.reversal;
      if (limits.speed !== null) measures.speed = continuity.speed;
    }
    if (limits.balance !== null)
      measures.balance = AutoMovieMotionHumanAuditBalance.measure(
        motion,
        subject,
        body,
        rate,
      );
    const findings: IFinding[] = [];
    for (const check of CHECKS) {
      const measure: IAutoMovieMotionHumanAuditMeasure | undefined =
        measures[check];
      const limit: number | null = limits[check];
      if (
        measure !== undefined &&
        limit !== null &&
        measure.value > limit + 1e-9
      )
        findings.push({ check, limit, ...measure });
    }
    return { measures, pairs, findings };
  }

  /**
   * One line per finding, for a failed assertion's message.
   *
   * @param report An audit's report.
   * @returns The findings in millimetres (metres per second for `speed`), or `clean`.
   */
  export function describe(report: IReport): string {
    if (report.findings.length === 0) return "clean";
    return report.findings
      .map((f: IFinding): string =>
        f.check === "speed"
          ? `speed ${f.value.toFixed(2)} m/s > ${f.limit} at ${f.seconds.toFixed(3)} s (${f.where})`
          : `${f.check} ${(f.value * 1000).toFixed(1)} mm > ${(f.limit * 1000).toFixed(1)} at ${f.seconds.toFixed(3)} s (${f.where})`,
      )
      .join("; ");
  }
}

/** The same motion with each person's bones of an instant resolved once, for the span of one audit. */
const remember = (
  source: IAutoMovieMotionHumanAuditMotion,
): IAutoMovieMotionHumanAuditMotion => {
  const known: Map<
    string,
    Map<number, Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>>
  > = new Map();
  return {
    duration: source.duration,
    segments: (subject: string) => source.segments(subject),
    bones: (
      subject: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      let person:
        | Map<number, Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>>
        | undefined = known.get(subject);
      if (person === undefined) {
        person = new Map();
        known.set(subject, person);
      }
      let bones:
        | Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
        | undefined = person.get(seconds);
      if (bones === undefined) {
        bones = source.bones(subject, seconds);
        person.set(seconds, bones);
      }
      return bones;
    },
  };
};
