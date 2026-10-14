import { mergeAutoMovieMeshes } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Concatenation accepts the original 144,012-component member without turning
 * the buffer into a function argument list. Direct indexed triangles isolate
 * the merge contract from an unrelated 12,000-segment revolution. All source
 * corners are finite; every index addresses one of the first 48,003 vertices.
 * The final unreferenced vertex remains part of the caller-owned vertex buffer.
 *
 * Scenarios:
 * 1. Two members each carry 48,004 vertices and 216,000 triangle indices.
 * 2. Concatenation retains all components, rebases the second member by exactly
 *    48,004 vertices, and preserves its authored final zero component.
 *
 * @evidence contracts/testing.md#behavioral-verification Concatenates the two existing large indexed members and asserts output component/index populations, the final second-member index offset and final coordinate. It catches argument-list overflow or truncation while permitting every authored unreferenced vertex.
 * @evidence contracts/testing.md#independent-expectations Each member has 48004 vertices and 216000 indices, so concatenation gives 288024 coordinate components and 432000 indices. The second member's last index is its authored modular index plus 48004, and its last coordinate is zero. Counts and endpoint checks do not independently verify every interior value or establish geometric validity.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the original 144012-component operand size, two identical operands, nontrivial rebasing and final unreferenced vertex. Ordinary attribute/admission and empty cases belong to procedural-merge; this entry isolates the large-buffer transport boundary.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly invokes portable merge source on existing in-memory numeric buffers. It installs no consumer, builds no native artifact and starts no process, browser or GPU; it owns its two-member case without dynamic registration.
 */
export function test_geometry_procedural_merge_large(): void {
  const vertices: number = 48_004;
  const indexCount: number = 216_000;
  const dense: IAutoMovieMesh = {
    positions: Array.from(
      { length: vertices * 3 },
      (_: unknown, component: number): number =>
        component % 9 === 3 || component % 9 === 7 ? 1 : 0,
    ),
    indices: Array.from(
      { length: indexCount },
      (_: unknown, index: number): number => index % (vertices - 1),
    ),
    normals: null,
    uvs: null,
    skin: null,
  };
  const merged: IAutoMovieMesh = mergeAutoMovieMeshes([dense, dense]);
  TestValidator.equals(
    "two members past the spread argument limit still merge",
    {
      positions: merged.positions.length,
      indices: merged.indices!.length,
      rebased: merged.indices!.at(-1),
    },
    {
      positions: 288_024,
      indices: 432_000,
      rebased: ((indexCount - 1) % (vertices - 1)) + vertices,
    },
  );
  TestValidator.predicate(
    "the final authored coordinate survives",
    nclose(merged.positions.at(-1)!, 0, 0),
  );
}
