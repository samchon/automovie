import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanVerdicts,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanPerformance } from "@automovie/motions";

import { motionActionUnit } from "./motionActionUnit";
import type { motionComplaints } from "./motionComplaints";

/**
 * The arm planner's public contract, read on a displayed course whatever the
 * algorithm that laid it: the course stays clear by the audit's bound, its
 * channels are continuous, and its joints keep the audit's speed. Only the
 * displayed take and the shipped verdict report are read, never the planner's
 * rows, knots or iterations.
 */
export namespace armCourseContract {
  /**
   * The audit's stated joint-speed bound, metres per second: 30 m/s, above any
   * human joint speed (`AutoMovieMotionHumanAuditLimits.speed`: a pitcher's
   * hand peaks near 40 m/s only at ball release, a punch's fist near 10 m/s).
   */
  export const SPEED: number = 30;

  /**
   * A site's stated tolerance, metres: the touch contract's 10 mm, the region
   * bound an arm course is refused beyond ("the hand … off its site … beyond
   * the region's 10 mm").
   */
  export const SITE: number = 0.01;

  /**
   * The bounds that read a course's clearance: the audit's 10 mm of skin within
   * a body, between two bodies, and the floor's 5 mm.
   */
  const CLEAR: readonly string[] = ["tangle", "partner", "floor"];

  /**
   * The bounds that read a course's continuity: no jump, no out-and-back spike,
   * no snap.
   */
  const CONTINUOUS: readonly string[] = ["jump", "reversal", "turn"];

  /** The bound that reads a course's pace. */
  const PACE: readonly string[] = ["speed"];

  /**
   * The wrist's speed is read at ten times the film rate, so a spike between
   * frames is seen.
   */
  const SAMPLES: number = motionActionUnit.RATE * 10;

  /**
   * Check one action's arm course by the contract: clear, continuous and within
   * the audit's speed, each as its own check, and each named arm's wrist within
   * `SPEED` at ten times the film rate over the action.
   *
   * @param checks The spec's gatherer.
   * @param label The case, for the failures.
   * @param take The take.
   * @param subject The performer.
   * @param act The action that lays the course.
   * @param sides The arms the course moves.
   */
  export function course(
    checks: motionComplaints.IGatherer,
    label: string,
    take: AutoMovieMotionHumanPerformance,
    subject: string,
    act: IAutoMovieMotionHumanSegment,
    sides: readonly AutoMovieHumanSide[],
  ): void {
    const own: IAutoMovieMotionHumanVerdicts.IFinding[] =
      motionActionUnit.findings(take, subject, act);
    group(
      checks,
      `${label}: the course stays clear by the audit's bounds`,
      own,
      CLEAR,
    );
    group(checks, `${label}: the course is continuous`, own, CONTINUOUS);
    group(checks, `${label}: the course keeps the audit's speed`, own, PACE);
    const steps: number = Math.max(
      2,
      Math.ceil((act.end - act.entryTime) * SAMPLES),
    );
    const dt: number = (act.end - act.entryTime) / steps;
    for (const side of sides) {
      const wrist: (t: number) => IAutoMovieVector3 = (
        t: number,
      ): IAutoMovieVector3 =>
        take.bones(subject, t).get(`${side}Hand`)!.worldPosition;
      let peak: number = 0;
      let before: IAutoMovieVector3 = wrist(act.entryTime);
      for (let k: number = 1; k <= steps; ++k) {
        const next: IAutoMovieVector3 = wrist(act.entryTime + k * dt);
        peak = Math.max(peak, AutoMovieEngineVector3.distance(next, before) / dt);
        before = next;
      }
      checks.check(
        `${label}: the ${side} wrist keeps within ${SPEED} m/s (${peak.toFixed(2)} m/s)`,
        peak <= SPEED,
      );
    }
  }

  /** One family of the action's own findings as a check of its own. */
  function group(
    checks: motionComplaints.IGatherer,
    title: string,
    own: readonly IAutoMovieMotionHumanVerdicts.IFinding[],
    family: readonly string[],
  ): void {
    const found: IAutoMovieMotionHumanVerdicts.IFinding[] = own.filter(
      (f: IAutoMovieMotionHumanVerdicts.IFinding): boolean =>
        family.includes(f.check),
    );
    checks.check(
      (): string =>
        `${title}: ${found.map(motionActionUnit.describe).join("; ")}`,
      found.length === 0,
    );
  }
}
