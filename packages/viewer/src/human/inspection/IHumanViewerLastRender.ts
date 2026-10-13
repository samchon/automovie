import type { IHumanViewerPhases } from "./IHumanViewerPhases.js";

/**
 * The most recent completed capture, as `/health` reports it.
 *
 * The reading describes one completed local capture and its actual build/cache history and durations. It does not estimate remaining production work.
 *
 * @evidence contracts/common.md#principled-implementation Distinguishes a cached model from a fresh numerical build by the page's actual build counter.
 * @evidence contracts/common.md#meaningful-documentation Names each reported member.
 *
 * @evidence contracts/common.md#clear-and-simple-design One capture record joins actual document, server duration, numerical-cache status and stage timings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Since-edit delay remains nullable and does not imply all later captures rebuilt the numerical model.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Distinguishes a cached model from a fresh numerical build by the page's actual build counter.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Since-edit delay remains nullable and does not imply all later captures rebuilt the numerical model.
 *
 * @author Samchon
 */
export interface IHumanViewerLastRender {
  /**
   * Document drawn.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Identifies the document actually shown by the completed capture.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Identifies the document actually shown by the completed capture.
   */
  doc: string;

  /**
   * Server milliseconds from capture start to decoded PNG.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Reports completed server capture milliseconds separately from numerical worker duration.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Reports completed server capture milliseconds separately from numerical worker duration.
   */
  ms: number;

  /**
   * Whether the numerical model came from the cache or a fresh build.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Distinguishes actual new numerical work from reuse using the observed build counter.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Distinguishes actual new numerical work from reuse using the observed build counter.
   */
  build: "cache" | "built";

  /**
   * Wall milliseconds since the source edit this capture first showed, or null.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Reports a nullable first-frame delay after a source edit rather than implying every later capture rebuilt.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Reports a nullable first-frame delay after a source edit rather than implying every later capture rebuilt.
   */
  sinceEditMs: number | null;

  /**
   * Stage durations of the capture.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Preserves the measured stage durations associated with this actual completed frame.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Preserves the measured stage durations associated with this actual completed frame.
   */
  phases: IHumanViewerPhases;
}
