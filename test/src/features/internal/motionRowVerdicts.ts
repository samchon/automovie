import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanVerdicts,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle,
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The verdict report of one lexicon row on one body, stood for 0.3 s and
 * then the row. Reads the complete film once at 24 Hz so the
 * continuity checks see the real neighbours at every film frame.
 *
 * A finding includes the quiet stance's tangle depths at 0.1 s to identify
 * which interpenetrations the row adds.
 *
 * @param row The lexicon row's name.
 * @param name The body.
 * @returns `clean`, or the report's findings and the stance's depths.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, the frame grid and what a finding is read beside.
 * @evidence contracts/development/implementation.md#principled-implementation Registers the lexicon, performs the row through the public chain and reads the shipped verdict report on the displayed film.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance, one report and a stance reading on failure.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bound of the report applies to the actual frame range.
 * @evidence contracts/development/implementation.md#efficient-algorithms One plan and one audit grid per row.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanVerdicts` and the tangle audit's pose reading.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The performance lives as long as the call.
 */
export function motionRowVerdicts(
  row: string,
  name: motionHumanBody.Name,
): string {
  const laws: IAutoMovieMotionHumanActionLaw<never>[] =
    Object.values(HUMAN_LEXICON).flat();
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "verdict",
    laws,
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .registered(row, {}).node,
  });
  const rate: number = 24;
  const report: IAutoMovieMotionHumanVerdicts.IReport = HumanVerdicts.of(
    performance,
    rate,
  );
  if (report.clean) return "clean";
  const resting: string = AutoMovieMotionHumanAuditTangle.pose(
    body,
    performance.bones("a", 0.1),
  )
    .map(
      (pair: IAutoMovieMotionHumanAuditTangle.IPair): string =>
        `${pair.a} in ${pair.b} ${(pair.depth * 1000).toFixed(1)} mm`,
    )
    .join(", ");
  return `${HumanVerdicts.describe(report)}; standing at 0.1 s: ${resting || "nothing in anything"}`;
}
