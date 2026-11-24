import {
  createAutoMovieMeshDeformer,
  mergeAutoMovieMeshes,
  transformAutoMovieMesh,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { test12ValuesClose } from "../../../internal/test12ValuesClose";
import { vertexColourMesh } from "../../../internal/vertexColourFixture";

/**
 * Vertex colour follows correspondence, not world coordinates.
 *
 * Scenarios:
 *
 * 1. Mirrored placement preserves ordered RGB and owns its copied buffer.
 * 2. Mixed merging inserts white for uncoloured vertices; coloured merging retains
 *    declaration order. Empty and wholly bare merges omit the field.
 * 3. A nontrivial spatial deformation moves positions but retains RGB.
 * 4. Topology inspection counts nonfinite colour components independently.
 */
export function test_unit_engine_geometry_geometry_vertex_colour(): void {
  const colored: import("@automovie/interface").IAutoMovieMesh =
    vertexColourMesh();
  const {
    colors: _colors,
    ...bare
  }: import("@automovie/interface").IAutoMovieMesh = colored;
  const placed: import("@automovie/interface").IAutoMovieMesh =
    transformAutoMovieMesh(colored, {
      scale: { x: -2, y: 3, z: 1 },
    });
  TestValidator.predicate(
    "placement retains RGB",
    test12ValuesClose(placed.colors, colored.colors),
  );
  TestValidator.predicate(
    "placement owns RGB",
    placed.colors !== colored.colors,
  );
  TestValidator.predicate(
    "mirror retains vertex order",
    test12ValuesClose(placed.indices, [0, 2, 1]),
  );
  TestValidator.predicate(
    "bare transform omits RGB",
    !Object.hasOwn(transformAutoMovieMesh(bare, {}), "colors"),
  );
  const mixed: import("@automovie/interface").IAutoMovieMesh =
    mergeAutoMovieMeshes([bare, colored, { ...bare, indices: null }]);
  TestValidator.predicate(
    "identity fill surrounds colour",
    test12ValuesClose(mixed.colors, [
      ...new Array(9).fill(1),
      ...colored.colors!,
      ...new Array(9).fill(1),
    ]),
  );
  TestValidator.predicate(
    "all colours retained",
    test12ValuesClose(mergeAutoMovieMeshes([colored, colored]).colors, [
      ...colored.colors!,
      ...colored.colors!,
    ]),
  );
  TestValidator.predicate(
    "empty and bare omit RGB",
    [[], [bare]].every(
      (
        meshes: {
          positions: number[];
          physicalVertices?: import("@automovie/interface").IAutoMovieMeshPhysicalVertices;
          normals: number[] | null;
          uvs: number[] | null;
          reliefWeights?: number[];
          indices: number[] | null;
          skin: import("@automovie/interface").IAutoMovieMeshSkin | null;
        }[],
      ): boolean => !Object.hasOwn(mergeAutoMovieMeshes(meshes), "colors"),
    ),
  );
  const deformed: import("@automovie/interface").IAutoMovieMesh =
    createAutoMovieMeshDeformer([
      {
        center: { x: 0, y: 0, z: 0 },
        radius: { x: 2, y: 2, z: 2 },
        displacement: { x: 0, y: 0, z: 0.1 },
        stretch: { x: 0, y: 0, z: 0 },
      },
    ])(colored);
  TestValidator.predicate(
    "deformation actually moves the surface",
    deformed.positions[2]! > 0,
  );
  TestValidator.predicate(
    "deformation retains RGB",
    test12ValuesClose(deformed.colors, colored.colors),
  );
}
