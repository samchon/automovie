import type { IAutoMovieDrawingFeatureResolution } from "@automovie/engine";
import type {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawingFeature,
  IAutoMovieModel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "./predicates";

/** Original annotation scenarios 3 through 5 and their unchanged missing/collapsed geometry declarations. */
export function test02DrawingAnnotationStaleness(
  environment: IAutoMovieBuiltEnvironment,
  resolve: (
    overrides: Partial<IAutoMovieDrawingFeature>,
    where?: IAutoMovieBuiltEnvironment,
  ) => IAutoMovieDrawingFeatureResolution,
): void {
  // 3-5. Staleness.
  TestValidator.equals(
    "every way a target can stop addressing the design is reported, not guessed",
    namedFacts([
      [
        "a target authored against another count is stale though its index fits",
        (): boolean => {
          const stale: IAutoMovieDrawingFeatureResolution = resolve({
            kind: "vertex",
            index: 0,
            count: 9,
          });
          return (
            stale.status === "stale" &&
            stale.count === 8 &&
            stale.point === null &&
            stale.reason ===
              'element "north-wall" now has 8 vertex features, but the target was authored against 9'
          );
        },
      ],
      [
        "an index past the end is stale and says how many there are",
        (): boolean =>
          resolve({ kind: "vertex", index: 8 }).reason ===
          'element "north-wall" vertex index 8 is outside its 8 vertex features',
      ],
      [
        "a fractional index is stale rather than truncated",
        (): boolean => resolve({ kind: "edge", index: 1.5 }).status === "stale",
      ],
      [
        "a negative index is stale",
        (): boolean => resolve({ kind: "face", index: -1 }).status === "stale",
      ],
      [
        "an axis index outside 0..2, or between them, is stale",
        (): boolean =>
          resolve({ kind: "axis", index: 3 }).reason ===
            'element "north-wall" axis index must be 0, 1 or 2, but was 3' &&
          resolve({ kind: "axis", index: -1 }).status === "stale" &&
          // A fractional axis names no axis; without an integral guard this
          // would select none of the three and be reported as a collapsed
          // scale, which is a true message about the wrong thing.
          resolve({ kind: "axis", index: 1.5 }).reason ===
            'element "north-wall" axis index must be 0, 1 or 2, but was 1.5',
      ],
      [
        "an axis count that is not three is stale and reports the three",
        (): boolean => {
          const stale: IAutoMovieDrawingFeatureResolution = resolve({
            kind: "axis",
            index: 0,
            count: 2,
          });
          return stale.status === "stale" && stale.count === 3;
        },
      ],
      [
        "a centroid index other than zero is stale",
        (): boolean =>
          resolve({ kind: "centroid", index: 1 }).reason ===
          'element "north-wall" centroid index must be 0, but was 1',
      ],
      [
        "a centroid count other than one is stale and reports the one",
        (): boolean => {
          const stale: IAutoMovieDrawingFeatureResolution = resolve({
            kind: "centroid",
            index: 0,
            count: 2,
          });
          return stale.status === "stale" && stale.count === 1;
        },
      ],
      [
        "a missing element is stale and names the environment",
        (): boolean =>
          resolve({ element: "no-such-wall" }).reason ===
          'built environment "atelier" has no element "no-such-wall"',
      ],
      [
        "an element with no model carries no vertex",
        (): boolean =>
          resolve({ element: "shell", kind: "vertex" }).reason ===
          'element "shell" has no model, so it carries no "vertex" feature',
      ],
      [
        "an element with no model still has axes, because a transform has axes",
        (): boolean =>
          resolve({ element: "shell", kind: "axis", index: 1 }).status ===
          "resolved",
      ],
      [
        "a runtime model the design does not carry is stale",
        (): boolean =>
          resolve({ element: "floor-slab" }, externalModel(environment))
            .reason ===
          'element "floor-slab" cites runtime model "slab", whose geometry this design does not carry',
      ],
      [
        "a part the model does not have is stale",
        (): boolean =>
          resolve({ part: "no-such-part" }).reason ===
          'model "wall" has no part "no-such-part"',
      ],
      [
        "a part with no drawn geometry has no centroid",
        (): boolean =>
          resolve(
            { element: "floor-slab", kind: "centroid", index: 0 },
            emptyGeometry(environment),
          ).reason ===
          'element "floor-slab" has no geometry, so it has no centroid',
      ],
      [
        "an axis a zero scale collapsed has no direction to point along",
        (): boolean =>
          resolve(
            { element: "north-wall", kind: "axis", index: 0 },
            collapsedWall(environment),
          ).reason ===
          'element "north-wall" axis 0 is collapsed by its own scale, so it has no direction',
      ],
    ]),
    {
      "a target authored against another count is stale though its index fits": true,
      "an index past the end is stale and says how many there are": true,
      "a fractional index is stale rather than truncated": true,
      "a negative index is stale": true,
      "an axis index outside 0..2, or between them, is stale": true,
      "an axis count that is not three is stale and reports the three": true,
      "a centroid index other than zero is stale": true,
      "a centroid count other than one is stale and reports the one": true,
      "a missing element is stale and names the environment": true,
      "an element with no model carries no vertex": true,
      "an element with no model still has axes, because a transform has axes": true,
      "a runtime model the design does not carry is stale": true,
      "a part the model does not have is stale": true,
      "a part with no drawn geometry has no centroid": true,
      "an axis a zero scale collapsed has no direction to point along": true,
    },
  );
}

/** The same design with the wall flattened along its own local X. */
const collapsedWall: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  elements: environment.elements.map(
    (element: IAutoMovieBuiltElement): IAutoMovieBuiltElement =>
      element.id === "north-wall"
        ? {
            ...element,
            transform: {
              ...element.transform,
              scale: { x: 0, y: 1, z: 1 },
            },
          }
        : element,
  ),
});

/** The same design with the slab's geometry owned by the builder. */
const externalModel: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  models: environment.models.filter(
    (model: IAutoMovieModel): boolean => model.id !== "slab",
  ),
  modelReferences: ["slab"],
});

/** The same design with the slab's model carrying vertices and no triangle. */
const emptyGeometry: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  models: environment.models.map(
    (model: IAutoMovieModel): IAutoMovieModel =>
      model.id === "slab"
        ? {
            ...model,
            parts: [
              {
                ...model.parts[0]!,
                geometry: {
                  type: "mesh" as const,
                  mesh: {
                    positions: [0, 0, 0, 1, 0, 0, 0, 0, 1],
                    normals: null,
                    uvs: null,
                    indices: [],
                    skin: null,
                  },
                },
              },
            ],
          }
        : model,
  ),
});
