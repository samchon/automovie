import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAudit,
  IAutoMovieMotionHumanAuditContinuity,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditBalance } from "./AutoMovieMotionHumanAuditBalance";
import { AutoMovieMotionHumanAuditContinuity } from "./AutoMovieMotionHumanAuditContinuity";
import { AutoMovieMotionHumanAuditGround } from "./AutoMovieMotionHumanAuditGround";
import { AutoMovieMotionHumanAuditLimits } from "./AutoMovieMotionHumanAuditLimits";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditTangle } from "./AutoMovieMotionHumanAuditTangle";

/*
 * The generic audit of a displayed human motion: every check that holds for any
 * action whatever it means to do, read from the displayed bones alone.
 *
 * - `tangle`: no part of the body passes into another part of it.
 * - `floor`: no collider sinks below the floor.
 * - `slip`, `lift`: a foot declared planted stays where it stands, on the floor.
 * - `jump`, `reversal`, `speed`: every joint centre travels a continuous path
 *   with no out-and-back spike and no impossible speed.
 * - `balance`: while both feet alone bear the body, its extrapolated centre of
 *   mass stays over them.
 *
 * Each reading and limit is in metres, except `speed` in metres per second.
 * Each check has a limit; a reading above its limit is a finding. A limit of
 * `null` leaves the check unread, for an action a check does not apply to (a
 * fall is meant to lose its balance). What an action intends (which hand
 * reaches where, at which beat) is not the audit's: that is pinned by the
 * action's own tests.
 */
export namespace AutoMovieMotionHumanAudit {
  /*
   * The default limits (`AutoMovieMotionHumanAuditLimits`).
   */
  export const LIMITS: Readonly<
    Record<IAutoMovieMotionHumanAudit.Check, number>
  > = AutoMovieMotionHumanAuditLimits;

  /*
   * The checks in report order.
   */
  export const CHECKS: readonly IAutoMovieMotionHumanAudit.Check[] = [
    "tangle",
    "floor",
    "slip",
    "lift",
    "jump",
    "reversal",
    "speed",
    "balance",
  ];

  /*
   * Audit one person of a motion.
   *
   * The checks share one grid, so the displayed bones of each of its instants
   * are evaluated once, before the checks, and passed to all of them.
   * Parameter source: The motion.
   * Parameter subject: The person.
   * Parameter body: Their body.
   * Parameter options: The grid and the limits.
   * Returns: The readings and the findings.
   */
  export function run(
    source: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    options: IAutoMovieMotionHumanAudit.IOptions = {},
  ): IAutoMovieMotionHumanAudit.IReport {
    const rate: number = options.rate ?? 24;
    const motion: IAutoMovieMotionHumanAuditMotion = prepareFrames(
      source,
      subject,
      rate,
    );
    const limits: IAutoMovieMotionHumanAudit.ILimits = {
      ...LIMITS,
      ...options.limits,
    };
    const measures: IAutoMovieMotionHumanAudit.IReport["measures"] = {};
    let pairs: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    if (limits.tangle !== null) {
      const tangle: IAutoMovieMotionHumanAuditTangle.IResult =
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
      const continuity: IAutoMovieMotionHumanAuditContinuity.IResult =
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
    const findings: IAutoMovieMotionHumanAudit.IFinding[] = [];
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

  /*
   * One line per finding, for a failed assertion's message.
   * Parameter report: An audit's report.
   * Returns: The findings in millimetres (metres per second for `speed`), or
   * `clean`.
   */
  export function describe(report: IAutoMovieMotionHumanAudit.IReport): string {
    if (report.findings.length === 0) return "clean";
    return report.findings
      .map((f: IAutoMovieMotionHumanAudit.IFinding): string =>
        f.check === "speed"
          ? `speed ${f.value.toFixed(2)} m/s > ${f.limit} at ${f.seconds.toFixed(3)} s (${f.where})`
          : `${f.check} ${(f.value * 1000).toFixed(1)} mm > ${(f.limit * 1000).toFixed(1)} at ${f.seconds.toFixed(3)} s (${f.where})`,
      )
      .join("; ");
  }
}

/*
 * The same motion with the audited person's bones at every instant of the
 * checks' shared grid evaluated once, before any check reads them, and passed
 * to each; any other read evaluates the source directly.
 */
const prepareFrames = (
  source: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  rate: number,
): IAutoMovieMotionHumanAuditMotion => {
  const frames: Map<
    number,
    Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
  > = new Map(
    HumanAuditMotion.grid(0, source.duration, rate).map(
      (
        seconds: number,
      ): [number, Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>] => [
        seconds,
        source.bones(subject, seconds),
      ],
    ),
  );
  return {
    duration: source.duration,
    segments: (who: string) => source.segments(who),
    ...(source.support === undefined
      ? {}
      : { support: source.support.bind(source) }),
    ...(source.water === undefined ? {} : { water: source.water.bind(source) }),
    bones: (
      who: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      (who === subject ? frames.get(seconds) : undefined) ??
      source.bones(who, seconds),
  };
};
