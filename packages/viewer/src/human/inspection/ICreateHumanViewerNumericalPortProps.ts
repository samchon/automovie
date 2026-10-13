import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress.js";
import type { createHumanViewerSpans } from "./createHumanViewerSpans.js";

/**
 * What the page's numerical transport reports to: stage transitions and the capture's stage timings.  These ports contribute actual numerical completion and capture timing to page-owned observation. They carry no planned-work denominator or completion estimate.
 *
 * @evidence contracts/common.md#principled-implementation The page transport reports actual numerical stage/reply observations and measures named spans through these existing telemetry owners.
 * @evidence contracts/common.md#clear-and-simple-design Separates protocol transport from page work display and capture duration accumulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress is reported stage evidence without a planned-work denominator, completion estimate or independent rendered-appearance proof.
 * @evidence contracts/common.md#meaningful-documentation Defines the phase callback and shared current-capture spans; durations and progress have different clocks and meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no transport work; request correlation uses maps, while numerical construction/cache codecs own model-sized cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The same spans owner is shared by one capture and numerical transport; equal reported phases do not deduplicate effectful requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page owns telemetry and transport lifetime; this record retains callbacks and span service references without creating an additional numerical process.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerNumericalPortProps {
  /**
   * Reports a work-stage transition.
   *
   * @evidence contracts/common.md#principled-implementation Reports cache/build/prepare/reply/failure phase transitions and forwards actual worker progress only for a correlated pending build.
   * @evidence contracts/common.md#clear-and-simple-design Keeps work-state presentation with the page instead of making the numerical transport own UI controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional completed detail is an observed numerical milestone, not a percentage, planned count or guarantee the next GPU stage will finish.
   * @evidence contracts/common.md#meaningful-documentation The phase discriminator names the real transport stage; omitted completed detail means no additional milestone was reported.
   * @evidence contracts/performance.md#efficient-algorithms Each observed event updates one work record; event frequency follows actual worker progress and replies rather than a polling estimate.
   * @evidence contracts/performance.md#reuse-equivalent-work Success/failure transitions remain separate observations; equal phases are not evidence that two document requests share one numerical result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The page retains latest work state while transport request maps retire on reply/failure; callback invocation itself owns no worker or task.
   */
  work: (
    phase: HumanViewerWork["phase"],
    completed?: IHumanViewerNumericalProgress,
  ) => void;

  /** Stage timings of the current capture. */
  spans: ReturnType<typeof createHumanViewerSpans>;
}
