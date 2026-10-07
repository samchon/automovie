import type { HumanViewerWork } from "./HumanViewerWork";
import type { createHumanViewerSpans } from "./createHumanViewerSpans";
import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress";

/**
 * Stages no `spans.measure` call encloses: model preparation after the
 * numerical reply, drawing, and the stage setup before the first request.
 */
const UNMEASURED: ReadonlySet<HumanViewerWork["phase"]> = new Set(["loading", "prepare", "draw"]);

/**
 * Report each display stage to the host as a `HUMAN_WORK` console line. The
 * time of an unmeasured stage is added to the spans when the next stage is
 * reported, so a capture's whole show time is attributed.
 *
 * @evidence contracts/common.md#principled-implementation Every stage's time is attributed once, by the stage that ends it.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the current stage and its start.
 * @evidence contracts/common.md#meaningful-documentation States the line and the attribution rule.
 */
export function createHumanViewerWorkReporter(
  spans: ReturnType<typeof createHumanViewerSpans>,
  snapshot: (phase: HumanViewerWork["phase"]) => HumanViewerWork,
): (phase: HumanViewerWork["phase"], completed?: IHumanViewerNumericalProgress) => void {
  let stagePhase: HumanViewerWork["phase"] = "idle";
  let stageAt = 0;
  return (phase, completed) => {
    const at = performance.now();
    if (UNMEASURED.has(stagePhase)) spans.add(stagePhase + "Ms", at - stageAt);
    stagePhase = phase;
    stageAt = at;
    const work = snapshot(phase);
    if (completed !== undefined) {
      work.completed = completed.stage;
      work.completionElapsedMs = completed.elapsedMs;
      work.completionStageMs = completed.stageMs;
    }
    console.log("HUMAN_WORK " + JSON.stringify(work));
  };
}
