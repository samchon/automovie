import {
  type IAutoMovieCreateCompiledSlotSummary,
  IAutoMovieFormationBounds,
  type IAutoMovieSummarizeCompiledSlotChunks,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createCompiledSlotSummary } from "./createCompiledSlotSummary";

/*
 * Fold each generated slot once into both its chunk and the population summary.
 */
export function summarizeCompiledSlotChunks(
  /*
   * Number of admitted slots starting at zero.
   */
  count: number,
  /*
   * Positive package chunk size, in slots.
   */
  chunkSize: number,
  /*
   * Generate one borrowed position synchronously; invoked exactly once per
   * slot.
   */
  position: (slot: number) => IAutoMovieVector3,
): IAutoMovieSummarizeCompiledSlotChunks.IResult {
  const whole: IAutoMovieCreateCompiledSlotSummary.IResult =
    createCompiledSlotSummary();
  const chunks: Array<{
    index: number;
    start: number;
    count: number;
    bounds: IAutoMovieFormationBounds;
    centroid: IAutoMovieVector3;
  }> = [];
  for (let start: number = 0; start < count; start += chunkSize) {
    const size: number = Math.min(chunkSize, count - start);
    const chunk: IAutoMovieCreateCompiledSlotSummary.IResult =
      createCompiledSlotSummary();
    for (let slot: number = start; slot < start + size; ++slot) {
      const point: IAutoMovieVector3 = position(slot);
      chunk.add(point);
      whole.add(point);
    }
    chunks.push({
      index: chunks.length,
      start,
      count: size,
      ...chunk.finish(),
    });
  }
  return { chunks, summary: whole.finish() };
}
