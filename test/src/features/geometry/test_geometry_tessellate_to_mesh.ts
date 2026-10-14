import { test12ValuesClose } from "../internal/test12ValuesClose";
import { tessellateToMesh } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

/**
 * `tessellateToMesh` adapts a raw tessellation into a full `IAutoMovieMesh`, so a generated primitive can flow through the same code paths as imported mesh geometry. It carries positions and indices through and leaves skinning null, since generated primitives are not skinned.
 *
 * Scenarios:
 * 1. a unit box yields 72 position floats (24 vertices × 3), 36 indices, and a null `skin`.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the primitive-to-mesh adapter and observes its box vertex/index inventory and explicit absence of skin; missing geometry or invented skin fails.
 * @evidence contracts/testing.md#independent-expectations A box has six separately shaded quad faces, four vertices per face and two triangles per quad, giving 72 position components and 36 indices without sampling the adapter.
 * @evidence contracts/testing.md#distinguishing-cases The unit owns one admitted unit box and its unskinned adapter result; shape geometry, winding, closed surfaces and absent UVs have neighboring owning units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_geometry_tessellate_to_mesh entry owns these synchronous portable numerical cases and any local iteration; it starts no process, browser or GPU and makes no visual-success claim.
 */
export function test_geometry_tessellate_to_mesh(): void {
  const mesh: import("@automovie/interface").IAutoMovieMesh = tessellateToMesh({ type: "box", width: 1, height: 1, depth: 1 });
  TestValidator.predicate("72 position floats", test12ValuesClose(mesh.positions.length, 72));
  TestValidator.predicate("has indices", test12ValuesClose(namedFacts([
      ["meshIndices", (): boolean => mesh.indices !== null],
      [
        "meshIndicesLength",
        (): boolean => mesh.indices !== null && mesh.indices.length === 36,
      ],
    ]), { meshIndices: true, meshIndicesLength: true }));
  TestValidator.predicate("no skin", test12ValuesClose(mesh.skin, null));
}
