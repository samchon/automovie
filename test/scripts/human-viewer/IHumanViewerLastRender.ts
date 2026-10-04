import type { IHumanViewerPhases } from "./IHumanViewerPhases";

/**
 * The most recent completed capture, as `/health` reports it.
 *
 * @evidence contracts/common.md#principled-implementation Distinguishes a cached model from a fresh numerical build by the page's actual build counter.
 * @evidence contracts/common.md#meaningful-documentation Names each reported member.
 * @author Samchon
 */
export interface IHumanViewerLastRender {
  /** Document drawn. */
  doc: string;

  /** Server milliseconds from capture start to decoded PNG. */
  ms: number;

  /** Whether the numerical model came from the cache or a fresh build. */
  build: "cache" | "built";

  /** Wall milliseconds since the source edit this capture first showed, or null. */
  sinceEditMs: number | null;

  /** Stage durations of the capture. */
  phases: IHumanViewerPhases;
}
