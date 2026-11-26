import { AutoMovieEngineCaptureRecord } from "@automovie/engine";
import type { IAutoMovieCaptureRecord } from "@automovie/interface";

/** Admit stored capture journals and expose the data each reader can use. */
export namespace AutoMovieRenderCaptureRecord {
  /** Read safe local names from a running or complete ownership journal. */
  export function ownedFiles(value: unknown): readonly string[] | null {
    return AutoMovieEngineCaptureRecord.ownedFiles(value);
  }

  /** Read a complete round with comparable cells and any recorded audit. */
  export function comparison(
    value: unknown,
  ): IAutoMovieCaptureRecord.IComparison | null {
    return AutoMovieEngineCaptureRecord.comparison(value);
  }

  /**
   * Read diagnostic evidence from a complete round. Older observations can omit
   * sheet layout and audit counters; they still need usable cell clocks,
   * coverage, findings, and still identities. Hash and scope verification are
   * the consumer's responsibility.
   */
  export function observe(
    value: unknown,
  ): IAutoMovieCaptureRecord.IObservation {
    return AutoMovieEngineCaptureRecord.observe(value);
  }
}
