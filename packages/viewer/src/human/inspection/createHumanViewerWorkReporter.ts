import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress.js";
import type { createHumanViewerSpans } from "./createHumanViewerSpans.js";

/**
 * Stages no `spans.measure` call encloses: model preparation after the
 * numerical reply, drawing, and the stage setup before the first request.
 */
const UNMEASURED: ReadonlySet<HumanViewerWork["phase"]> = new Set([
  "loading",
  "prepare",
  "draw",
]);

/**
 * Report each display stage to the host as a `HUMAN_WORK` console line. The
 * time of an unmeasured stage is added to the spans when the next stage is
 * reported, so a capture's whole show time is attributed.
 */
export function createHumanViewerWorkReporter(
  spans: ReturnType<typeof createHumanViewerSpans>,
  snapshot: (phase: HumanViewerWork["phase"]) => HumanViewerWork,
): (
  phase: HumanViewerWork["phase"],
  completed?: IHumanViewerNumericalProgress,
) => void {
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
