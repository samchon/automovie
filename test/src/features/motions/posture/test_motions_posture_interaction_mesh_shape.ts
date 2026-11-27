import {
  humanInteractionMeshShape
} from "../../../../../packages/motions/src/posture/internal/humanInteractionMeshShape";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a propagation and a centroid shift, metres. */
const ROUNDING: number = 1e-12;

/** Whether a shape is the expected coordinates. */
function same(
  shape: Float64Array | undefined,
  expected: readonly number[],
): boolean {
  return (
    shape !== undefined &&
    shape.length === expected.length &&
    expected.every((v: number, i: number): boolean =>
      nclose(shape[i]!, v, ROUNDING),
    )
  );
}

/**
 * `humanInteractionMeshShape` is an interaction mesh's aligned start shape:
 * from the first point, each bone carries its reference direction scaled to its
 * target length and each contact its offset from `b` to `a`, walked breadth
 * first over the edges either way, then the whole shape shifted so its centroid
 * is the reference's. Too few edges to connect every point, a bone of no
 * reference length, or a point no edge reaches gives no shape.
 *
 * Scenarios:
 *
 * 1. Points (0, 0, 0), (1, 0, 0) and (1, 1, 0), bones 0–1 of length 2 and 2–1 of
 *    length 3: (0, 0, 0), (2, 0, 0) and (2, 3, 0) before the shift, the
 *    centroid (2/3, 1/3, 0) kept after it.
 * 2. A contact from point 1 to point 2 offset (0, 0, 0.5) in place of the second
 *    bone: point 2 lies 0.5 along +Z from point 1.
 * 3. A single bone for three points, a bone of no length, and four points with
 *    three edges that leave one unreached give no shape.
 */
export function test_motions_posture_interaction_mesh_shape(): void {
  const reference: Float64Array = new Float64Array([0, 0, 0, 1, 0, 0, 1, 1, 0]);
  const shift = (raw: number[]): number[] => {
    const mean: number[] = [0, 1, 2].map(
      (axis: number): number =>
        (reference[axis]! +
          reference[3 + axis]! +
          reference[6 + axis]! -
          (raw[axis]! + raw[3 + axis]! + raw[6 + axis]!)) /
        3,
    );
    return raw.map((v: number, i: number): number => v + mean[i % 3]!);
  };

  // 1. Bones.
  TestValidator.predicate(
    "bones carried to their lengths, the centroid kept",
    same(
      humanInteractionMeshShape(
        [
          { from: 0, to: 1, length: 2 },
          { from: 2, to: 1, length: 3 },
        ],
        [],
        reference,
      ),
      shift([0, 0, 0, 2, 0, 0, 2, 3, 0]),
    ),
  );

  // 2. A contact.
  TestValidator.predicate(
    "a contact's offset",
    same(
      humanInteractionMeshShape(
        [{ from: 0, to: 1, length: 1 }],
        [{ a: 2, b: 1, offset: { x: 0, y: 0, z: 0.5 } }],
        reference,
      ),
      shift([0, 0, 0, 1, 0, 0, 1, 0, 0.5]),
    ),
  );

  // 3. No shape.
  TestValidator.equals(
    "unconnected or degenerate meshes",
    [
      humanInteractionMeshShape([{ from: 0, to: 1, length: 1 }], [], reference),
      humanInteractionMeshShape(
        [
          { from: 0, to: 1, length: 1 },
          { from: 1, to: 1, length: 1 },
        ],
        [],
        reference,
      ),
      humanInteractionMeshShape(
        [
          { from: 0, to: 1, length: 1 },
          { from: 1, to: 0, length: 1 },
          { from: 2, to: 3, length: 1 },
        ],
        [],
        new Float64Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 2, 2, 0]),
      ),
    ],
    [undefined, undefined, undefined],
  );
}
