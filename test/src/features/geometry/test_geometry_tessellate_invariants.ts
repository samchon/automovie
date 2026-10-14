import { type ITessellation, tessellate } from "@automovie/engine";
import { AutoMoviePrimitiveShape } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

const SHAPES: AutoMoviePrimitiveShape[] = [
  { type: "box", width: 0.4, height: 0.6, depth: 0.2 },
  { type: "sphere", radius: 0.5 },
  { type: "cylinder", radius: 0.3, height: 1 },
  { type: "cone", radius: 0.3, height: 1 },
  { type: "plane", width: 2, depth: 3 },
  { type: "capsule", radius: 0.2, height: 1 },
];

/**
 * Whatever primitive it tessellates, the engine must emit well-formed mesh
 * data: the structural invariants a renderer relies on to upload geometry to
 * the GPU without crashing or drawing garbage. This sweeps all six primitive
 * types through the same battery of checks.
 *
 * Scenarios (asserted for box, sphere, cylinder, cone, plane, and capsule):
 *
 * 1. Positions come in xyz triples (length divisible by 3).
 * 2. There is exactly one normal per position.
 * 3. Indices come in triangles (length divisible by 3).
 * 4. The mesh is non-empty (it has both vertices and triangles).
 * 5. Every position is finite (no NaN / Infinity).
 * 6. Every index is an integer inside the vertex range: no out-of-bounds reference
 *    that would read past the vertex buffer.
 *
 * @evidence contracts/testing.md#behavioral-verification Tessellates each of the six existing primitive types and checks nonempty triple positions, normal cardinality, triangle indices, finite positions and integer resident references. It catches malformed upload structure while allowing the primitive owner's declared tessellation approximations.
 * @evidence contracts/testing.md#independent-expectations XYZ/triangle tuple arity, one normal per position and indices in [0,vertexCount) are mesh-buffer contracts independent of sampled outputs. These structural checks do not test normal finiteness/unit length, exact dimensions, winding, watertightness or rendered shape; capsule silhouette approximation remains outside this assertion.
 * @evidence contracts/testing.md#distinguishing-cases Preserves box, sphere, cylinder, cone, zero-height plane and capsule with all six original invariant categories applied to each. Specific primitive topology/geometry and unknown runtime discriminator refusal belong to companion entries; malformed dimensions are not admitted here.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly invokes portable tessellation source over its existing authored shape table and ordinary observers. It installs no consumer, builds no native artifact and starts no process, browser or GPU; table rows belong to this entry without dynamic test registration.
 */
export function test_geometry_tessellate_invariants(): void {
  for (const shape of SHAPES) {
    const t: ITessellation = tessellate(shape);
    const vertexCount: number = t.positions.length / 3;
    TestValidator.predicate(
      `${shape.type}: positions are triples`,
      t.positions.length % 3 === 0,
    );
    TestValidator.equals(
      `${shape.type}: a normal per position`,
      t.normals.length,
      t.positions.length,
    );
    TestValidator.predicate(
      `${shape.type}: indices are triangles`,
      t.indices.length % 3 === 0,
    );
    TestValidator.equals(
      `${shape.type}: non-empty`,
      namedFacts([
        ["vertexCount", (): boolean => vertexCount > 0],
        [
          "tIndicesLength",
          (): boolean => vertexCount > 0 && t.indices.length > 0,
        ],
      ]),
      { vertexCount: true, tIndicesLength: true },
    );
    TestValidator.predicate(
      `${shape.type}: positions finite`,
      t.positions.every((n: number): boolean => Number.isFinite(n)),
    );
    TestValidator.predicate(
      `${shape.type}: indices in range`,
      t.indices.every(
        (i: number): boolean =>
          Number.isInteger(i) && i >= 0 && i < vertexCount,
      ),
    );
  }
}
