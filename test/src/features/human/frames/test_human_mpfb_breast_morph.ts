import assert from "node:assert/strict";

import { FamilyConicMpfbBreastMorph } from "../../../reference-conics/FamilyConicMpfbBreastMorph";

/**
 * Apply source vertex offsets to a compact indexed skin.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production deformation on an indexed body and checks the changed and unaffected vertices.
 * @evidence contracts/development/testing.md#independent-expectations A target-space vector of (−0.3, 0.2, 0.1) decimetres is (10, 20, −30) mm in the Human frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a nonsequential vertex map, a nonbody offset and a repeated invalid source row.
 * @evidence contracts/development/testing.md#execution-ownership Uses one made triangle and no reference download.
 * @evidence contracts/development/common.md#meaningful-documentation Names the index convention and independent unit conversion.
 */
export function test_human_mpfb_breast_morph(): void {
  const original = {
    body: { positions: [1, 2, 3, 4, 5, 6, 7, 8, 9], indices: [0, 1, 2] },
    bodyVertexIds: [9, 7, 1],
  };
  const target = "# target\n7 -0.3 0.2 0.1\n99 1 2 3";
  const mesh = FamilyConicMpfbBreastMorph.deform(original, target);
  assert.deepEqual(mesh.positions, [1, 2, 3, 14, 25, -24, 7, 8, 9]);
  assert.equal(mesh.indices, original.body.indices);
  assert.deepEqual(original.body.positions, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.throws(
    () => FamilyConicMpfbBreastMorph.deform(original, `${target}\n7 0 0 0`),
    /repeated HM08 target vertex/,
  );
}
