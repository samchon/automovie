import { meshOfHumanPart } from "@automovie/human";
import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A part's mesh is read only from a mesh part.
 *
 * Scenarios:
 * 1. A mesh part returns its own mesh object.
 * 2. A part with a primitive geometry refuses, naming the part.
 */
export const test_human_part_mesh = (): void => {
  const mesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: null,
    uvs: null,
    indices: [0, 1, 2],
    skin: null,
  };
  const part = (geometry: IAutoMovieModel["parts"][number]["geometry"]) => ({
    id: "part",
    name: "part",
    material: "m",
    geometry,
    attachedBone: null,
    transform: null,
  });
  TestValidator.predicate(
    "a mesh part returns its mesh",
    meshOfHumanPart(part({ type: "mesh", mesh })) === mesh,
  );
  TestValidator.predicate(
    "a primitive part refuses by name",
    throwsError(
      () =>
        meshOfHumanPart(
          part({
            type: "primitive",
            shape: { type: "box", width: 1, height: 1, depth: 1 },
          }),
        ),
      "A human part is a mesh: part",
    ),
  );
};
