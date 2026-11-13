import {
  AutoMovieMotionHumanAuditTangle,
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The verdict report of the lexicon's `blownKiss` row on the small woman,
 * stood for 0.3 s and then the row, read over one half of the film so each
 * half's spec runs within the time a test may take.
 *
 * The halves meet at a frame of the 24 Hz grid and overlap by two frames,
 * so a step between two frames and an out-and-back across the meeting are
 * read whole in one of them (`HumanVerdicts.of`'s span). A finding is
 * returned beside the quiet stance's own tangle depths at 0.1 s, so a
 * tangle the resting body already holds is told from one the row adds.
 *
 * @param half The first or the second half of the film.
 * @returns `clean`, or the report's findings and the stance's depths.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, the halves, their overlap and what a finding is read beside.
 * @evidence contracts/development/implementation.md#principled-implementation Registers the lexicon, performs the row through the public chain and reads the shipped verdict report over a span of the displayed film.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance, one span, one report and one stance reading.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bound of the report is read over the half; none is left out to save time.
 * @evidence contracts/development/implementation.md#efficient-algorithms The report resolves only the half's instants.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanVerdicts` and the tangle audit's pose reading.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The performance lives as long as the call.
 */
export function motionKissVerdicts(half: 1 | 2): string {
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const body: IHumanBody = motionHumanBody("f-small");
  const performance: HumanPerformance = new HumanPerformance({
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
      .stand({ seconds: 0.3 })
      .registered("blownKiss", {}).node,
  });
  const rate: number = 24;
  const middle: number = Math.round((performance.duration / 2) * rate) / rate;
  const report: HumanVerdicts.IReport = HumanVerdicts.of(
    performance,
    rate,
    half === 1
      ? { from: 0, to: Math.min(performance.duration, middle + 2 / rate) }
      : { from: Math.max(0, middle - 2 / rate), to: performance.duration },
  );
  if (report.clean) return "clean";
  const resting: string = AutoMovieMotionHumanAuditTangle.pose(
    body,
    performance.bones("a", 0.1),
  )
    .map(
      (pair: AutoMovieMotionHumanAuditTangle.IPair): string =>
        `${pair.a} in ${pair.b} ${(pair.depth * 1000).toFixed(1)} mm`,
    )
    .join(", ");
  return `${HumanVerdicts.describe(report)}; standing at 0.1 s: ${resting || "nothing in anything"}`;
}
