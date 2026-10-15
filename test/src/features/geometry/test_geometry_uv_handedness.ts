import {
  buildAutoMoviePolyhedron,
  extrudeAutoMovieRegion,
  mergeAutoMovieMeshes,
  revolveAutoMovieProfile,
} from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";
import { sweepPolygonLoft } from "../internal/sweepPolygonLoft";

/**
 * Counts of indexed UV determinant signs, independent of any three-dimensional tangent frame.
 *
 * @author Samchon
 */
interface IHandedness {
  /**
   * Triangles with a positive indexed UV determinant.
   */
  positive: number;
  /**
   * Triangles with a negative indexed UV determinant.
   */
  negative: number;
  /**
   * Triangles with no uv area to have a handedness at all.
   */
  degenerate: number;
}

/**
 * Count finite indexed UV determinants and refuse nonfinite arithmetic instead of classifying NaN as negative; sign measures the atlas convention, while shader tangent handedness and appearance require their own GPU observation.
 */
const handedness: (mesh: IAutoMovieMesh) => IHandedness = (
  mesh: IAutoMovieMesh,
): IHandedness => {
  const uvs: number[] = mesh.uvs!;
  const indices: number[] =
    mesh.indices ??
    Array.from(
      { length: mesh.positions.length / 3 },
      (_v: unknown, at: number): number => at,
    );
  const tally: IHandedness = { positive: 0, negative: 0, degenerate: 0 };
  for (let at: number = 0; at < indices.length; at += 3) {
    const a: number = indices[at]!;
    const b: number = indices[at + 1]!;
    const c: number = indices[at + 2]!;
    const determinant: number =
      (uvs[b * 2]! - uvs[a * 2]!) * (uvs[c * 2 + 1]! - uvs[a * 2 + 1]!) -
      (uvs[b * 2 + 1]! - uvs[a * 2 + 1]!) * (uvs[c * 2]! - uvs[a * 2]!);
    if (!Number.isFinite(determinant))
      throw new Error(
        "UV handedness measurement requires finite determinants.",
      );
    if (Math.abs(determinant) <= DEGENERATE_UV_AREA) tally.degenerate += 1;
    else if (determinant > 0) tally.positive += 1;
    else tally.negative += 1;
  }
  return tally;
};

/**
 * Below this the triangle covers no atlas area worth assigning a sign.
 */
const DEGENERATE_UV_AREA: number = 1e-12;

const corner: (x: number, y: number, z: number) => IAutoMovieVector3 = (
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

const square: (half: number) => Array<{ x: number; y: number }> = (
  half: number,
): Array<{ x: number; y: number }> => [
  { x: -half, y: -half },
  { x: half, y: -half },
  { x: half, y: half },
  { x: -half, y: half },
];

/**
 * Atlas-bearing builders share a positive indexed UV orientation convention, and merge preserves every member's coordinate correspondence; this determinant census does not judge normal-mapped lighting.
 *
 * Scenarios:
 * 1. Three quad faces give six positive triangles, and a sixteen-segment cylinder gives thirty-two.
 * 2. A twelve-segment profile beginning on-axis gives twelve degenerate pole triangles and thirty-six positive triangles.
 * 3. Region extrusion and loft each give twelve positive triangles, and merged members retain summed counts.
 * 4. Reflecting U reverses all cylinder signs, and merging that twin retains six positive and thirty-two negative triangles.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls atlas-bearing builders and mesh merge, then counts the sign of indexed UV determinants; reversed construction or a merge that loses a member's UV correspondence fails.
 * @evidence contracts/testing.md#independent-expectations Authored quad/segment counts determine expected triangle populations, and reflecting U independently reverses determinants. Positive atlas orientation is the convention checked here; a negative sign alone does not prove incorrect GPU normal mapping.
 * @evidence contracts/testing.md#distinguishing-cases Projected, revolved and developed builders, a collapsed pole, mixed merges and an explicitly mirrored U twin are retained; visual material shading belongs to GPU inspection rather than this determinant census.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_geometry_uv_handedness entry owns these synchronous portable numerical cases and any local iteration; it starts no process, browser or GPU and makes no visual-success claim.
 */
export function test_geometry_uv_handedness(): void {
  const faces: IAutoMovieMesh = buildAutoMoviePolyhedron([
    [corner(0, 0, 0), corner(4, 0, 0), corner(4, 3, 0), corner(0, 3, 0)],
    [corner(4, 0, 0), corner(4, 0, -3), corner(4, 3, -3), corner(4, 3, 0)],
    [corner(0, 0, 0), corner(0, 0, 2), corner(4, 0, 2), corner(4, 0, 0)],
  ]);
  TestValidator.predicate(
    "every polyhedron face lays its atlas the same way round",
    test12ValuesClose(handedness(faces), {
      positive: 6,
      negative: 0,
      degenerate: 0,
    }),
  );

  const tube: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 1, y: 0 },
      { x: 1, y: 2 },
    ],
    segments: 16,
  });
  TestValidator.predicate(
    "a revolved surface off the axis is positive on every triangle",
    test12ValuesClose(handedness(tube), {
      positive: 32,
      negative: 0,
      degenerate: 0,
    }),
  );

  // A spire: the meridian starts on the axis, so one collapsed triangle per
  // segment is the pole the operator already reports as degenerate.
  const spire: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 0.6, y: 2 },
    ],
    segments: 12,
  });
  TestValidator.predicate(
    "a pole contributes declared degenerates, never a second handedness",
    test12ValuesClose(handedness(spire), {
      positive: 36,
      negative: 0,
      degenerate: 12,
    }),
  );

  const region: IAutoMovieMesh = extrudeAutoMovieRegion({
    outer: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 0, y: 1 },
    ],
    depth: 0.2,
  });
  const lofted: IAutoMovieMesh = sweepPolygonLoft({
    path: [corner(0, 0, 0), corner(0, 0, 3)],
    sections: [
      { at: 0, outer: square(0.5) },
      { at: 1, outer: square(0.5) },
    ],
  });
  TestValidator.predicate(
    "the developed builders agree with the projected one",
    test12ValuesClose(
      { region: handedness(region), lofted: handedness(lofted) },
      {
        region: { positive: 12, negative: 0, degenerate: 0 },
        lofted: { positive: 12, negative: 0, degenerate: 0 },
      },
    ),
  );

  TestValidator.predicate(
    "a merged assembly carries one handedness, not one per member",
    test12ValuesClose(
      {
        projectedWithRevolved: handedness(mergeAutoMovieMeshes([faces, tube])),
        developedPair: handedness(mergeAutoMovieMeshes([region, lofted])),
      },
      {
        projectedWithRevolved: { positive: 38, negative: 0, degenerate: 0 },
        developedPair: { positive: 24, negative: 0, degenerate: 0 },
      },
    ),
  );

  // Reflecting U is the exact defect this check exists to catch, so the check
  // must report it. Without this twin an implementation that returned a
  // constant would pass every case above.
  const mirrored: IAutoMovieMesh = {
    ...tube,
    uvs: tube.uvs!.map((value: number, at: number): number =>
      at % 2 === 0 ? -value : value,
    ),
  };
  TestValidator.predicate(
    "reflecting the atlas across U flips every sign the check reports",
    test12ValuesClose(handedness(mirrored), {
      positive: 0,
      negative: 32,
      degenerate: 0,
    }),
  );

  TestValidator.predicate(
    "and a mirrored member is exactly what a merge would hide",
    test12ValuesClose(
      namedFacts([
        [
          "mixedBuffer",
          (): boolean => {
            const mixed: IHandedness = handedness(
              mergeAutoMovieMeshes([faces, mirrored]),
            );
            return mixed.positive === 6 && mixed.negative === 32;
          },
        ],
      ]),
      { mixedBuffer: true },
    ),
  );
}
