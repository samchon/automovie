import type { AutoMovieVector3Tuple as Point } from "@automovie/interface";
import { strict as assert } from "node:assert";

import { FamilyConicMpfbDirectedSheet } from "../../../reference-conics/FamilyConicMpfbDirectedSheet";
import type { FamilyConicMpfbSubdivision } from "../../../reference-conics/FamilyConicMpfbSubdivision";

/**
 * A source graph follows shared directed edges and refuses indistinguishable
 * positive projected sheets on the same ray.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the actual directed sheet and queries unique rays on both halves of one connected quad.
 * @evidence contracts/development/testing.md#independent-expectations The planar coordinates give exact vertical travels and known shared edges.
 * @evidence contracts/development/testing.md#distinguishing-cases A second positive sheet produces an ambiguous ray. A reversed sheet below the quad is outside the claimed chart.
 * @evidence contracts/development/testing.md#execution-ownership Uses four small analytic mesh triangles and no external figure.
 */
export function test_human_directed_parent_sheet(): void {
  const points: Point[] = [
    [0, 0, 0],
    [2, 0, 0],
    [2, 0, 2],
    [0, 0, 2],
    [0, 1, 0],
    [1, 1, 0],
    [0, 1, 1],
    [1, -1, 1],
    [2, -1, 1],
    [1, -1, 2],
  ];
  const source: FamilyConicMpfbSubdivision.ISample = {
    body: {
      positions: points.flat(),
      indices: [0, 2, 1, 0, 3, 2, 4, 6, 5, 7, 8, 9],
    },
    normals: {
      values: [0, 1, 0, 0, -1, 0],
      indices: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    },
    authoredQuads: 1,
    valence: {},
  };
  const sheet = FamilyConicMpfbDirectedSheet.prepare(
    source,
    (): Point => [0, 1, 0],
  );
  assert.equal(sheet.components, 2);
  assert.equal(sheet.triangles, 3);
  const down: Point = [0, -1, 0];
  assert.equal(sheet.unique([0.2, 3, 0.2], down, -1), null);
  const a = sheet.unique([1.5, 3, 0.5], down, -1);
  const b = sheet.unique([1.2, 3, 1.5], down, -1);
  assert.ok(a !== null && b !== null);
  assert.equal(a.component, b.component);
  assert.equal(a.distance, 3);
  assert.equal(b.distance, 3);
  assert.deepEqual(a.normal, [0, 1, 0]);
  assert.deepEqual(b.normal, [0, 1, 0]);
}
