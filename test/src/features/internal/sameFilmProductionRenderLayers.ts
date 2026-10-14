import type { IAutoMovieProductionRenderLayer } from "@automovie/engine";

import { nclose } from "./nclose";

/**
 * Compare the existing film expectations with exact shot/source-frame identities and tolerant weights. The authored segment arithmetic supplies expected values; this helper only compares them and cannot independently validate that arithmetic. Empty, singleton and dissolve arrays retain their original length and order, and the two discoverable frame-sampling/pass-layer unit entries own execution without a host.
 */
export function sameFilmProductionRenderLayers(
  actual: readonly IAutoMovieProductionRenderLayer[],
  expected: readonly IAutoMovieProductionRenderLayer[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every(
      (layer: IAutoMovieProductionRenderLayer, index: number): boolean =>
        layer.shot === expected[index]!.shot &&
        layer.sourceFrame === expected[index]!.sourceFrame &&
        nclose(layer.weight, expected[index]!.weight),
    )
  );
}
