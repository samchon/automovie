import type { IAutoMovieDrawingFeatureResolution } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawingFeature,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingPlace } from "./drawingFixtures";
import { test12ValuesClose } from "./test12ValuesClose";

/** Original annotation scenario 7 with unchanged reordered-part and sliver geometry declarations. */
export function test02DrawingAnnotationOrder(
  environment: IAutoMovieBuiltEnvironment,
  resolve: (
    overrides: Partial<IAutoMovieDrawingFeature>,
    where?: IAutoMovieBuiltEnvironment,
  ) => IAutoMovieDrawingFeatureResolution,
): void {
  // 7. Canonical order is a property of the geometry, not of the file.
  const forward: IAutoMovieBuiltEnvironment = twoPartWall(environment, false);
  const reversed: IAutoMovieBuiltEnvironment = twoPartWall(environment, true);
  TestValidator.predicate(
    "reordering model parts preserves the four selected pinned corners",
    test12ValuesClose(
      [3, 7, 11, 15].map(
        (index: number): IAutoMovieVector3 | null =>
          resolve({ kind: "vertex", index }, reversed).point,
      ),
      [3, 7, 11, 15].map(
        (index: number): IAutoMovieVector3 | null =>
          resolve({ kind: "vertex", index }, forward).point,
      ),
    ),
  );
  TestValidator.equals(
    "the two parts contribute sixteen distinct welded corners",
    resolve({ kind: "vertex", index: 0 }, reversed).count,
    16,
  );
  TestValidator.equals(
    "an edge whose two ends weld onto one corner is not an edge",
    // The sliver's first two corners round onto the same point, so its three
    // corners weld into two and its three edges into the one between them: a
    // zero-length edge is not a feature a note could be pinned to.
    [
      resolve(
        { element: "floor-slab", kind: "vertex" },
        sliverSlab(environment),
      ).count,
      resolve({ element: "floor-slab", kind: "edge" }, sliverSlab(environment))
        .count,
    ],
    [2, 1],
  );
}

/** The same design with the slab replaced by one welded-corner sliver triangle. */
const sliverSlab: (
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
                    positions: [0, 0, 0, 1e-7, 0, 0, 0, 0, 1],
                    normals: null,
                    uvs: null,
                    indices: [0, 1, 2],
                    skin: null,
                  },
                },
              },
            ],
          }
        : model,
  ),
});

/**
 * The wall and a pilaster beside it, as two model parts in either order.
 *
 * `reversed` writes the same two parts the other way round. Nothing about the
 * building changed, only the order the model file happens to list its parts in,
 * and a canonical feature order must not care: if it did, editing a model would
 * renumber every note on every sheet that cites it.
 */
const twoPartWall: (
  environment: IAutoMovieBuiltEnvironment,
  reversed: boolean,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
  reversed: boolean,
): IAutoMovieBuiltEnvironment => {
  const body: IAutoMovieModelPart = environment.models.find(
    (model: IAutoMovieModel): boolean => model.id === "wall",
  )!.parts[0]!;
  const parts: IAutoMovieModelPart[] = [
    body,
    {
      ...body,
      id: "wall-pilaster",
      geometry: {
        type: "primitive" as const,
        shape: { type: "box" as const, width: 0.4, height: 3, depth: 0.4 },
      },
      transform: drawingPlace(3.2, 0, 0),
    },
  ];
  return {
    ...environment,
    models: environment.models.map(
      (model: IAutoMovieModel): IAutoMovieModel =>
        model.id === "wall"
          ? { ...model, parts: reversed ? [...parts].reverse() : parts }
          : model,
    ),
  };
};
