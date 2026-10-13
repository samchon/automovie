import type { IHumanViewerPhases } from "./IHumanViewerPhases.js";

/**
 * The most recent completed capture, as `/health` reports it.
 *
 * The reading describes one completed local capture and its actual build/cache history and durations. It does not estimate remaining production work.
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
