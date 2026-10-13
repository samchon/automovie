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
