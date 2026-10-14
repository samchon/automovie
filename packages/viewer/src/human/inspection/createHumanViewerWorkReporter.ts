import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress.js";
import type { createHumanViewerSpans } from "./createHumanViewerSpans.js";

/**
 * Stages no `spans.measure` call encloses: model preparation after the numerical reply, drawing, and the stage setup before the first request.
 */
const UNMEASURED: ReadonlySet<HumanViewerWork["phase"]> = new Set([
  "loading",
  "prepare",
  "draw",
]);

/**
 * Report each display stage to the host as a `HUMAN_WORK` console line. The time of an unmeasured stage is added to the spans when the next stage is reported, so a capture's whole show time is attributed. The final unmeasured stage needs a subsequent report to close its duration; this adapter does not infer a missing completion from elapsed time.
 *
 * @evidence contracts/common.md#principled-implementation Each report closes the preceding unmeasured phase using performance.now and forwards actual numerical completion readings when supplied.
 * @evidence contracts/common.md#clear-and-simple-design A previous phase and timestamp join the existing span accumulator with one host console record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only phases outside spans.measure gain extra duration, and no missing final transition is invented as observed completion.
 * @evidence contracts/common.md#meaningful-documentation The comment explains deferred stage attribution and the subsequent-report requirement for final unmeasured work.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed phase-set membership check and one telemetry record do not choose a collection-processing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reports observe distinct phase transitions and do not reuse previous elapsed time as a new reading.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The reporter keeps only the preceding phase and timestamp; logs are delegated to the console and no timer or history is owned here.
 */
export function createHumanViewerWorkReporter(
  spans: ReturnType<typeof createHumanViewerSpans>,
  snapshot: (phase: HumanViewerWork["phase"]) => HumanViewerWork,
): (
  phase: HumanViewerWork["phase"],
  completed?: IHumanViewerNumericalProgress,
) => void {
  let stagePhase: HumanViewerWork["phase"] = "idle";
  let stageAt: number = 0;
  return (phase: HumanViewerWork["phase"], completed?: IHumanViewerNumericalProgress): void => {
    const at: number = performance.now();
    if (UNMEASURED.has(stagePhase)) spans.add(stagePhase + "Ms", at - stageAt);
    stagePhase = phase;
    stageAt = at;
    const work: HumanViewerWork = snapshot(phase);
    if (completed !== undefined) {
      work.completed = completed.stage;
      work.completionElapsedMs = completed.elapsedMs;
      work.completionStageMs = completed.stageMs;
    }
    console.log("HUMAN_WORK " + JSON.stringify(work));
  };
}
