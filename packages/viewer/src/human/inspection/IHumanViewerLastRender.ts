import type { IHumanViewerPhases } from "./IHumanViewerPhases.js";

/**
 * The most recent completed capture, as `/health` reports it.  The reading describes one completed local capture and its actual build/cache history and durations. It does not estimate remaining production work.
 *
 * @evidence contracts/common.md#principled-implementation Reports one completed server capture's document, total monotonic duration, numerical build/cache classification and measured phases.
 * @evidence contracts/common.md#clear-and-simple-design Keeps local completed-frame telemetry separate from remaining-production estimates and numerical build-only records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No numerical replies classifies cache while any actual reply classifies built; a cache label does not identify every GPU or disk cache layer.
 * @evidence contracts/common.md#meaningful-documentation Documents server milliseconds, first-matching-source edit wall duration/null and phase records without adding an ETA.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no measurement; describeHumanViewerCapture projects timestamps/spans and capture owner commits it after source checks.
 * @evidence contracts/performance.md#reuse-equivalent-work The latest completed record is reused for health reporting only; capture effects and numerical authority are not deduplicated by equal labels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One latest render and its phase/span records remain with capture ownership; PNG bytes are returned separately and not retained here.
 *
 * @author Samchon
 */
export interface IHumanViewerLastRender {
  /** Document drawn. */
  doc: string;

  /** Server milliseconds from capture start to decoded PNG. */
  ms: number;

  /** Whether the numerical model came from the cache or a fresh build. */
  build: "cache" | "built";

  /**
   * Wall milliseconds since the source edit this capture first showed, or null.
   */
  sinceEditMs: number | null;

  /** Stage durations of the capture. */
  phases: IHumanViewerPhases;
}
