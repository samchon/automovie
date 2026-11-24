import { tessellateToMesh } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../../../internal/predicates";
import { test12ValuesClose } from "../../../internal/test12ValuesClose";

/**
 * `tessellateToMesh` adapts a raw tessellation into a full `IAutoMovieMesh`, so a generated primitive can flow through the same code paths as imported mesh geometry. It carries positions and indices through and leaves skinning null, since generated primitives are not skinned.
 *
 * Scenarios:
 * 1. a unit box yields 72 position floats (24 vertices × 3), 36 indices, and a null `skin`.
 */
export function test_unit_engine_geometry_geometry_tessellate_to_mesh(): void {
  const mesh: import("@automovie/interface").IAutoMovieMesh = tessellateToMesh({
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  });
  TestValidator.predicate(
    "72 position floats",
    test12ValuesClose(mesh.positions.length, 72),
  );
  TestValidator.predicate(
    "has indices",
    test12ValuesClose(
      namedFacts([
        ["meshIndices", (): boolean => mesh.indices !== null],
        [
          "meshIndicesLength",
          (): boolean => mesh.indices !== null && mesh.indices.length === 36,
        ],
      ]),
      { meshIndices: true, meshIndicesLength: true },
    ),
  );
  TestValidator.predicate("no skin", test12ValuesClose(mesh.skin, null));
}
