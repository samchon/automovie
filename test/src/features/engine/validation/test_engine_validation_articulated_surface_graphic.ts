import { AutoMovieArchetypePaper } from "@automovie/archetypes";
import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { appendSurfaceGraphicsArtifact } from "../../../../../packages/engine/src/validation/internal/appendSurfaceGraphicsArtifact";

/**
 * A graphic admits the stock map's rigid moving panel.
 *
 * The map publishes one moving part for the surface. Removing that part leaves
 * the track with a surface-specific violation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names admission of a stock folding map and refusal when its moving part is missing.
 * @evidence contracts/development/testing.md#behavioral-verification Validates an actual stock model with a printed track and reads its constraint collector.
 * @evidence contracts/development/testing.md#independent-expectations One rigid carrier permits the track. Removing every part leaves no carrier for the same named fold.
 */
export function test_engine_validation_articulated_surface_graphic(): void {
  const map = AutoMovieArchetypePaper.create({ format: "foldedMap" });
  const track: IAutoMovieSurfaceGraphicTrack = {
    node: "map",
    surface: "face",
    keys: [
      {
        time: 0,
        graphic: {
          emission: { kind: "printed" },
          background: null,
          layers: [],
        },
      },
    ],
  };
  const assess = (model: IAutoMovieModel): readonly string[] => {
    const collector: AutoMovieEngineViolationCollector =
      new AutoMovieEngineViolationCollector();
    appendSurfaceGraphicsArtifact(
      [track],
      [{ id: "map", model: model.id }],
      1,
      collector,
      [model],
    );
    return collector.items.map(({ path }) => path);
  };
  TestValidator.equals("moving paper has a rigid carrier", assess(map), []);
  TestValidator.equals(
    "a missing carrier reports its surface",
    assess({ ...map, parts: [] }),
    ["$input.surfaceGraphics[0].surface"],
  );
  const panel: string = map.affordance("fold").parts![0]!;
  const other: string = map.parts.find(({ id }) => id !== panel)!.id;
  const twoParts = (named: boolean): IAutoMovieModel => ({
    ...map,
    affordances: (map.affordances ?? []).map(
      (affordance: IAutoMovieAffordance): IAutoMovieAffordance =>
        affordance.id === "fold"
          ? { ...affordance, parts: [panel, other] }
          : affordance.id === "face" && named
            ? { ...affordance, materialPart: panel }
            : affordance,
    ),
  });
  TestValidator.equals("ambiguous carriers refuse", assess(twoParts(false)), [
    "$input.surfaceGraphics[0].surface",
  ]);
  TestValidator.equals(
    "an explicit rigid carrier disambiguates",
    assess(twoParts(true)),
    [],
  );
}
