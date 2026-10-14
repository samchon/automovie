import {
  type IAutoMovieProductionRenderFrame,
  type IAutoMovieProductionRenderLayer,
  productionRenderLayersForPass,
} from "@automovie/engine";
import type { AutoMovieGuidePass } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";
import { sameFilmProductionRenderLayers } from "../internal/sameFilmProductionRenderLayers";

const frame: (
  layers: IAutoMovieProductionRenderFrame["layers"],
) => IAutoMovieProductionRenderFrame = (
  layers: IAutoMovieProductionRenderFrame["layers"],
): IAutoMovieProductionRenderFrame => ({
  globalFrame: 4,
  timelineFrame: 4,
  timeSeconds: 4 / 24,
  layers,
});

/**
 * Selects render layers for beauty and all five structural passes, checking copy isolation, heavier-layer selection, incoming tie precedence and fade preservation/full structural weight.
 *
 * Scenarios:
 * 1. Preserve beauty blend weights after mutating the earlier returned copy.
 * 2. Select outgoing/incoming heavier neighbours for all five structural passes.
 * 3. Select the incoming layer at an exact mask-pass tie.
 * 4. Keep singleton fade weight for beauty and full weight for depth.
 *
 * @evidence contracts/testing.md#behavioral-verification Selects render layers for beauty and all five structural passes, checking copy isolation, heavier-layer selection, incoming tie precedence and fade preservation/full structural weight.
 * @evidence contracts/testing.md#independent-expectations The guide contract selects the maximum weight with later-entry tie precedence; beauty preserves authored weights. Expected identities and integer source frames are authored independently, while no rendered compositing is observed.
 * @evidence contracts/testing.md#distinguishing-cases All five structural passes see both heavier-layer neighbours. Exact tie is exercised on mask, singleton fade on depth/beauty and copy mutation on beauty; empty-layer failure is not exercised here.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_production_pass_layers unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_production_pass_layers(): void {
  const outgoingHeavy: IAutoMovieProductionRenderFrame = frame([
    { shot: "a", sourceFrame: 20, weight: 0.75 },
    { shot: "b", sourceFrame: 3, weight: 0.25 },
  ]);
  const beauty: IAutoMovieProductionRenderLayer[] =
    productionRenderLayersForPass(outgoingHeavy, "beauty");
  beauty[0]!.weight = 0;
  TestValidator.predicate(
    "beauty keeps the sampled blend and returns a copy",
    sameFilmProductionRenderLayers(
      productionRenderLayersForPass(outgoingHeavy, "beauty"),
      [
        { shot: "a", sourceFrame: 20, weight: 0.75 },
        { shot: "b", sourceFrame: 3, weight: 0.25 },
      ],
    ) && nclose(beauty[0]!.weight, 0),
  );

  const structural: AutoMovieGuidePass[] = [
    "depth",
    "mask",
    "normal",
    "outline",
    "pose",
  ];
  const incomingHeavy: IAutoMovieProductionRenderFrame = frame([
    { shot: "a", sourceFrame: 21, weight: 0.25 },
    { shot: "b", sourceFrame: 4, weight: 0.75 },
  ]);
  TestValidator.predicate(
    "structural passes select the heavier layer at full weight",
    structural.every(
      (pass: AutoMovieGuidePass): boolean =>
        sameFilmProductionRenderLayers(
          productionRenderLayersForPass(outgoingHeavy, pass),
          [{ shot: "a", sourceFrame: 20, weight: 1 }],
        ) &&
        sameFilmProductionRenderLayers(
          productionRenderLayersForPass(incomingHeavy, pass),
          [{ shot: "b", sourceFrame: 4, weight: 1 }],
        ),
    ),
  );
  TestValidator.predicate(
    "an exact tie selects the incoming layer",
    sameFilmProductionRenderLayers(
      productionRenderLayersForPass(
        frame([
          { shot: "a", sourceFrame: 20, weight: 0.5 },
          { shot: "b", sourceFrame: 3, weight: 0.5 },
        ]),
        "mask",
      ),
      [{ shot: "b", sourceFrame: 3, weight: 1 }],
    ),
  );
  const fading: IAutoMovieProductionRenderFrame = frame([
    { shot: "f", sourceFrame: 9, weight: 0.25 },
  ]);
  TestValidator.predicate(
    "a fading layer is full weight for structure and faded for beauty",
    sameFilmProductionRenderLayers(
      productionRenderLayersForPass(fading, "depth"),
      [{ shot: "f", sourceFrame: 9, weight: 1 }],
    ) &&
      sameFilmProductionRenderLayers(
        productionRenderLayersForPass(fading, "beauty"),
        [{ shot: "f", sourceFrame: 9, weight: 0.25 }],
      ),
  );
}
