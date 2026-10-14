import type { IAutoMovieProductionRenderFrame } from "../../../../packages/engine/src/film/IAutoMovieProductionRenderFrame";

import { nclose } from "./nclose";
import { sameFilmProductionRenderLayers } from "./sameFilmProductionRenderLayers";

/**
 * Compare original render-frame expectations by exact integer frame ids, tolerant seconds and the shared layer predicate. Independent timeline arithmetic supplies expected frames, while forward/reverse pairs are a relational order check that cannot detect a common sampler defect. Array length and order are preserved, and the frame-sampling unit owns actual execution; this portable predicate starts no host and retains no result.
 */
export function sameFilmProductionRenderFrames(
  actual: readonly IAutoMovieProductionRenderFrame[],
  expected: readonly IAutoMovieProductionRenderFrame[],
): boolean {
  return actual.length === expected.length && actual.every(
    (frame: IAutoMovieProductionRenderFrame, index: number): boolean =>
      frame.globalFrame === expected[index]!.globalFrame &&
      frame.timelineFrame === expected[index]!.timelineFrame &&
      nclose(frame.timeSeconds, expected[index]!.timeSeconds) &&
      sameFilmProductionRenderLayers(frame.layers, expected[index]!.layers),
  );
}
