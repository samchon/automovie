import {
  type IAutoMovieSubdivisionCage,
  type IAutoMovieSubdivisionCrease,
  type IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";
import { subdivisionCornerNormal } from "../internal/subdivisionCornerNormal";
import { subdivisionFan } from "../internal/subdivisionFan";
import { subdivisionPoint } from "../internal/subdivisionPoint";
import { vclose } from "../internal/vclose";

/** A cube of half-size 1: bottom vertices 0 to 3 at z = -1, top 4 to 7 at z = 1, top face 1. */
const cube: (creases: IAutoMovieSubdivisionCrease[]) => IAutoMovieSubdivisionCage = (
  creases: IAutoMovieSubdivisionCrease[],
): IAutoMovieSubdivisionCage => ({
  positions: [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
    -1, 1, 1,
  ],
  faces: [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ],
  creases,
});

/** The four edges of the cube's top face at one sharpness. */
const topLoop: (sharpness: number) => IAutoMovieSubdivisionCrease[] = (
  sharpness: number,
): IAutoMovieSubdivisionCrease[] =>
  [
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
  ].map(
    ([from, to]: number[]): IAutoMovieSubdivisionCrease => ({
      from: from!,
      to: to!,
      sharpness,
    }),
  );

/** All twelve cube edges at one sharpness. */
const allEdges: (sharpness: number) => IAutoMovieSubdivisionCrease[] = (
  sharpness: number,
): IAutoMovieSubdivisionCrease[] =>
  [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ].map(
    ([from, to]: number[]): IAutoMovieSubdivisionCrease => ({
      from: from!,
      to: to!,
      sharpness,
    }),
  );

const surface: (
  cage: IAutoMovieSubdivisionCage,
  levels: number,
) => IAutoMovieSubdivisionSurface = (
  cage: IAutoMovieSubdivisionCage,
  levels: number,
): IAutoMovieSubdivisionSurface => subdivideAutoMovieSurface({ cage, levels });

/** The unit axis a point on the cube's surface lies on, by its largest coordinate. */
const axisOf: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
  p: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const size: number = Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
  return {
    x: Math.abs(p.x) === size ? Math.sign(p.x) : 0,
    y: Math.abs(p.y) === size ? Math.sign(p.y) : 0,
    z: Math.abs(p.z) === size ? Math.sign(p.z) : 0,
  };
};

/**
 * Pins the sharp and semi-sharp crease rules of DeRose, Kass and Truong
 * (1998), their limits, and their face-varying normals.
 *
 * Scenarios:
 *
 * 1. An infinitely sharp loop around a cube's top face: its vertices take the
 *    crease rule `(6 P + A + B) / 8` over their loop neighbours, its edges take
 *    midpoints, the bottom corners keep the smooth `5/9` point, and the top
 *    face stays flat at z = 1 in the limit with normal +Z on its side of the
 *    crease, a second normal on the other side.
 * 2. Sharpness 1 equals sharpness 10 at level 1 but not at level 2; sharpness
 *    2 equals 10 at level 2; sharpness 0.5 at level 1 is exactly the mean of
 *    sharpness 0 and 10.
 * 3. A semi-sharp loop of sharpness 1.5 rounds off in the limit: its limit
 *    position and single normal are the same at levels 1 to 4, and the top
 *    face is no longer flat.
 * 4. All twelve edges infinitely sharp keep the cube: every limit point is on
 *    the cube, the corners stay put, and every face corner's normal is the
 *    axis of the cube face it lies on, three per corner.
 * 5. A dart, one sharp edge ending at an interior vertex: the vertex keeps the
 *    smooth point while the sharp edge takes its midpoint, and its limit
 *    position and normal are the same at levels 1 to 4.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs `subdivideAutoMovieSurface` with creases and asserts refined points, limit positions, normal counts and face-varying normals; a wrong crease, corner or fractional rule, a sharpness that decays wrongly, a crease limit treated as infinite, or a normal on the wrong side fails.
 * @evidence contracts/testing.md#independent-expectations Expectations are the published crease, midpoint and smooth rules written in the test, the rule-sequence identities of the semi-sharp model (sharp for `floor(s)` steps, linear blend for the fraction), the flatness and axis normals that infinitely sharp cube edges imply, and invariance of the limit under refinement.
 * @evidence contracts/testing.md#distinguishing-cases Covers infinite, integer, fractional and zero sharpness, crease, corner and dart vertices, and negative twins where one more level or a finite sharpness must change the result; boundaries, smooth limits, UVs, parameters and refusals are owned by the other `test_geometry_subdivision_*` tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable unit entry calling the portable engine function on synthetic cages; no consumer, native build, process, browser or GPU.
 */
export function test_geometry_subdivision_creases(): void {
  const cage: IAutoMovieSubdivisionCage = cube(topLoop(10));
  const sharp: IAutoMovieSubdivisionSurface = surface(cage, 1);
  TestValidator.predicate(
    "loop vertices take the crease rule over their loop neighbours",
    [
      [4, 5, 7],
      [5, 6, 4],
      [6, 7, 5],
      [7, 4, 6],
    ].every(([v, a, b]: number[]): boolean => {
      const p: IAutoMovieVector3 = subdivisionPoint(cage.positions, v!);
      const pa: IAutoMovieVector3 = subdivisionPoint(cage.positions, a!);
      const pb: IAutoMovieVector3 = subdivisionPoint(cage.positions, b!);
      return vclose(
        subdivisionPoint(sharp.positions, v!),
        {
          x: (6 * p.x + pa.x + pb.x) / 8,
          y: (6 * p.y + pa.y + pb.y) / 8,
          z: (6 * p.z + pa.z + pb.z) / 8,
        },
        1e-15,
      );
    }),
  );
  TestValidator.predicate(
    "loop edges take midpoints and bottom corners keep the smooth point",
    vclose(subdivisionPoint(sharp.positions, 8 + 4), { x: 0, y: -1, z: 1 }, 1e-15) &&
      [0, 1, 2, 3].every((v: number): boolean =>
        vclose(
          subdivisionPoint(sharp.positions, v),
          {
            x: (5 / 9) * cage.positions[v * 3]!,
            y: (5 / 9) * cage.positions[v * 3 + 1]!,
            z: -5 / 9,
          },
          1e-15,
        ),
      ),
  );
  const deep: IAutoMovieSubdivisionSurface = surface(cage, 3);
  TestValidator.predicate(
    "the top face stays flat with +Z normals and its loop has two normals",
    deep.parameters.every(
      (parameter: { face: number }, v: number): boolean =>
        parameter.face !== 1 || nclose(deep.limitPositions[v * 3 + 2]!, 1, 1e-15),
    ) &&
      deep.faces.every((v: number, c: number): boolean => {
        if (v !== 4) return true;
        const f: number = Math.floor(c / 4);
        const top: boolean = [0, 1, 2, 3].every((k: number): boolean =>
          nclose(deep.positions[deep.faces[f * 4 + k]! * 3 + 2]!, 1, 1e-15),
        );
        const normal: IAutoMovieVector3 = subdivisionPoint(
          deep.normals,
          deep.normalFaces[c]!,
        );
        return top
          ? vclose(normal, { x: 0, y: 0, z: 1 }, 1e-15)
          : normal.z < 0.9;
      }) &&
      new Set(
        deep.faces
          .map((v: number, c: number): number => (v === 4 ? deep.normalFaces[c]! : -1))
          .filter((n: number): boolean => n !== -1),
      ).size === 2,
  );

  const one: IAutoMovieSubdivisionCage = cube(topLoop(1));
  const two: IAutoMovieSubdivisionCage = cube(topLoop(2));
  const half: IAutoMovieSubdivisionCage = cube(topLoop(0.5));
  const smooth: IAutoMovieSubdivisionCage = cube(topLoop(0));
  TestValidator.predicate(
    "sharpness 1 is sharp for one step only",
    equalGeometryTestValues(surface(one, 1).positions, sharp.positions) &&
      !equalGeometryTestValues(surface(one, 2).positions, surface(cage, 2).positions),
  );
  TestValidator.predicate(
    "sharpness 2 is sharp for two steps",
    equalGeometryTestValues(surface(two, 2).positions, surface(cage, 2).positions),
  );
  const blended: number[] = surface(half, 1).positions;
  const softer: number[] = surface(smooth, 1).positions;
  TestValidator.predicate(
    "sharpness 0.5 is the mean of the smooth and sharp rules for one step",
    blended.every((x: number, i: number): boolean =>
      nclose(x, (softer[i]! + sharp.positions[i]!) / 2, 1e-15),
    ) && !equalGeometryTestValues(blended, softer),
  );

  const semi: IAutoMovieSubdivisionSurface[] = [1, 2, 3, 4].map(
    (levels: number): IAutoMovieSubdivisionSurface =>
      surface(cube(topLoop(1.5)), levels),
  );
  TestValidator.predicate(
    "a semi-sharp loop rounds off: its limit does not depend on the level",
    semi.every(
      (s: IAutoMovieSubdivisionSurface): boolean =>
        vclose(
          subdivisionPoint(s.limitPositions, 4),
          subdivisionPoint(semi[0]!.limitPositions, 4),
          1e-14,
        ) &&
        vclose(subdivisionCornerNormal(s, 4), subdivisionCornerNormal(semi[0]!, 4), 1e-13),
    ) &&
      semi[0]!.normals.length === semi[0]!.positions.length &&
      semi[3]!.limitPositions.some(
        (z: number, i: number): boolean =>
          i % 3 === 2 && semi[3]!.parameters[(i - 2) / 3]!.face === 1 && z < 1 - 1e-6,
      ),
  );

  const box: IAutoMovieSubdivisionSurface = surface(cube(allEdges(10)), 2);
  TestValidator.predicate(
    "twelve infinitely sharp edges keep the cube and its face normals",
    box.limitPositions.every((_: number, i: number): boolean => {
      if (i % 3 !== 0) return true;
      const p: IAutoMovieVector3 = subdivisionPoint(box.limitPositions, i / 3);
      return nclose(Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)), 1, 1e-15);
    }) &&
      [0, 1, 2, 3, 4, 5, 6, 7].every((v: number): boolean =>
        vclose(
          subdivisionPoint(box.limitPositions, v),
          subdivisionPoint(cage.positions, v),
          0,
        ),
      ) &&
      box.faces.every((_: number, c: number): boolean => {
        const f: number = Math.floor(c / 4);
        const centre: IAutoMovieVector3 = [0, 1, 2, 3]
          .map(
            (k: number): IAutoMovieVector3 =>
              subdivisionPoint(box.positions, box.faces[f * 4 + k]!),
          )
          .reduce(
            (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({
              x: a.x + b.x,
              y: a.y + b.y,
              z: a.z + b.z,
            }),
          );
        return vclose(
          subdivisionPoint(box.normals, box.normalFaces[c]!),
          axisOf(centre),
          1e-15,
        );
      }) &&
      new Set(
        box.faces
          .map((v: number, c: number): number => (v === 6 ? box.normalFaces[c]! : -1))
          .filter((n: number): boolean => n !== -1),
      ).size === 3,
  );

  const fan: IAutoMovieSubdivisionCage = subdivisionFan(
    5,
    0.4,
    (i: number): number => 0.3 * Math.sin(3 * i + 1),
    (i: number): number => 0.2 * Math.cos(2 * i),
  );
  const dart: IAutoMovieSubdivisionCage = {
    ...fan,
    creases: [{ from: 0, to: 1, sharpness: 10 }],
  };
  const plain: IAutoMovieSubdivisionSurface = surface(fan, 1);
  const darts: IAutoMovieSubdivisionSurface[] = [1, 2, 3, 4].map(
    (levels: number): IAutoMovieSubdivisionSurface => surface(dart, levels),
  );
  const edge: number = fan.positions.length / 3;
  TestValidator.predicate(
    "a dart vertex keeps the smooth point while its edge takes the midpoint",
    vclose(
      subdivisionPoint(darts[0]!.positions, 0),
      subdivisionPoint(plain.positions, 0),
      1e-15,
    ) &&
      vclose(
        subdivisionPoint(darts[0]!.positions, edge),
        {
          x: (fan.positions[0]! + fan.positions[3]!) / 2,
          y: (fan.positions[1]! + fan.positions[4]!) / 2,
          z: (fan.positions[2]! + fan.positions[5]!) / 2,
        },
        1e-15,
      ) &&
      !vclose(
        subdivisionPoint(darts[0]!.positions, edge),
        subdivisionPoint(plain.positions, edge),
        1e-6,
      ),
  );
  TestValidator.predicate(
    "a dart's limit does not depend on the level",
    darts.every(
      (s: IAutoMovieSubdivisionSurface): boolean =>
        vclose(
          subdivisionPoint(s.limitPositions, 0),
          subdivisionPoint(darts[0]!.limitPositions, 0),
          1e-14,
        ) &&
        vclose(subdivisionCornerNormal(s, 0), subdivisionCornerNormal(darts[0]!, 0), 1e-13),
    ),
  );
}
