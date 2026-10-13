import { IAutoMovieFormationBounds, IAutoMovieVector3 } from "@automovie/interface";

import { createCompiledSlotSummary } from "./createCompiledSlotSummary";

/**
 * Fold each generated slot once into both its chunk and the population summary.
 *
 * @evidence contracts/common.md#principled-implementation Chunk and global accumulators receive exactly the ascending positions their former separate range traversals received, preserving each running mean's arithmetic order. Count and chunkSize are admitted positive safe integers from population validation and fixed package chunk constants.
 * @evidence contracts/common.md#clear-and-simple-design This shared compiler operation returns both summaries because both materializers need them; the position callback remains responsible for formation terrain or seeded instance placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every slot follows the same fold; no model id, seed or test changes traversal, and callback failures propagate before a compiled record is emitted.
 * @evidence contracts/common.md#meaningful-documentation Count, chunk size, callback borrowing and returned ownership are documented; bounds cover placement points rather than expanded geometry, which remains the separate projection radius.
 * @evidence contracts/performance.md#efficient-algorithms N callback invocations and O(N) arithmetic replace two equivalent position traversals; C=ceil(N/chunkSize) returned chunks require O(C) output and O(1) active accumulator memory.
 * @evidence contracts/performance.md#reuse-equivalent-work Each freshly generated point serves its chunk and whole-population fold within this call; no point or result is reused across mutable designs, routes, terrain or seeds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives the summary and C chunks; only current chunk/global accumulators and one point are retained during work, with no handle or background task on completion or failure.
 */
export function summarizeCompiledSlotChunks(
  /** Number of admitted slots starting at zero. */
  count: number,
  /** Positive package chunk size, in slots. */
  chunkSize: number,
  /** Generate one borrowed position synchronously; invoked exactly once per slot. */
  position: (slot: number) => IAutoMovieVector3,
): {
  /** Caller-owned chunk records in ascending start order. */
  chunks: Array<{ index: number; start: number; count: number; bounds: IAutoMovieFormationBounds; centroid: IAutoMovieVector3 }>;

  /** Caller-owned bounds and centroid over every placement point. */
  summary: { bounds: IAutoMovieFormationBounds; centroid: IAutoMovieVector3 };
} {
  const whole: ReturnType<typeof createCompiledSlotSummary> = createCompiledSlotSummary();
  const chunks: Array<{ index: number; start: number; count: number; bounds: IAutoMovieFormationBounds; centroid: IAutoMovieVector3 }> = [];
  for (let start: number = 0; start < count; start += chunkSize) {
    const size: number = Math.min(chunkSize, count - start);
    const chunk: ReturnType<typeof createCompiledSlotSummary> = createCompiledSlotSummary();
    for (let slot: number = start; slot < start + size; ++slot) {
      const point: IAutoMovieVector3 = position(slot);
      chunk.add(point);
      whole.add(point);
    }
    chunks.push({ index: chunks.length, start, count: size, ...chunk.finish() });
  }
  return { chunks, summary: whole.finish() };
}
