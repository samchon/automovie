import {
  type IAutoMovieSubdivisionSurface,
  type IAutoMovieSurfaceCage,
  type IAutoMovieSurfaceLocation,
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  displaceAutoMovieSurface,
  locateAutoMovieSurfaceVertices,
  sampleAutoMovieSurfaceNetwork,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { sweepTransitionTube } from "../internal/sweepTransitionTube";
import { throwsError } from "../internal/throwsError";

/** Depth of the flutes, metres, against the cylinder's 0.05 m radius. */
const DEPTH: number = 0.002;

/** Flutes round the cylinder. */
const FLUTES: number = 3;

/** Degrees the displaced normals may stray from the displaced surface's own, against the flutes' 7-degree slope; measured 0.70 at two levels. */
const NORMAL: number = 1;

/**
 * Displacing a subdivided surface moves each vertex along its normal by its
 * height and turns the normals to the displaced shape, and moves nothing
 * where the heights vanish.
 *
 * Scenarios:
 *
 * 1. A straight cylinder of radius 0.05 m at the medium tier, subdivided
 *    twice, takes three flutes 2 mm deep round its turn, a field of each
 *    vertex's sweep `v`: every vertex's distance from the axis grows by
 *    exactly its height, and every normal lies within 1 degree of the
 *    normal of the sweep displaced by the same field, where the
 *    undisplaced normals stray by about 7 degrees, the flutes' slope.
 * 2. Zero heights return the surface's positions and normals unchanged,
 *    bit for bit.
 * 3. Heights of the wrong count, a height that is not finite, and a height
 *    that turns the cylinder inside out are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Displaces a subdivided cylinder with `displaceAutoMovieSurface` using heights from `locateAutoMovieSurfaceVertices`; a step along anything but the normal, a wrong sign, unchanged normals or a normal that over- or under-turns fails, while any normal displacement with a perturbed normal accurate to the mesh passes.
 * @evidence contracts/testing.md#independent-expectations The axis distance of a cylinder grows by the height along its radial normal; the expected normal is the cross product of central differences of the sweep plus the field times the sweep's normal, computed in this test from `compileAutoMovieSweep`; the undisplaced normals' error is measured beside it, so the bound is shown to distinguish.
 * @evidence contracts/testing.md#distinguishing-cases Covers a relief whose slope tilts the normal by about 7 degrees, the zero field, and each refusal; locations on sweep, transition and Coons patches are owned by the surface location test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_displacement` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_displacement(): void {
  const network: IAutoMovieSurfaceNetwork = sweepTransitionTube({
    bands: false,
    bow: 0,
  });
  const cage: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network,
    tier: "medium",
  });
  const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: { positions: cage.cage.positions, faces: cage.cage.faces },
    levels: 2,
  });
  const locations: IAutoMovieSurfaceLocation[] = locateAutoMovieSurfaceVertices(
    { network, cage, parameters: surface.parameters },
  );
  const field = (v: number): number =>
    DEPTH * Math.cos(2 * Math.PI * FLUTES * v);
  const heights: number[] = locations.map(
    (l: IAutoMovieSurfaceLocation): number => field(l.sweep!.v),
  );
  const displaced: IAutoMovieSubdivisionSurface = displaceAutoMovieSurface({
    surface,
    heights,
  });

  // the displaced sweep's normal from central differences, oriented as the sweep's
  const tube: IAutoMovieSweepSurface = compileAutoMovieSweep(
    network.sweeps.tube!,
  );
  const point = (u: number, v: number): number[] => {
    const p = tube.point(u, v);
    const n = tube.normal(u, v);
    const h: number = field(v);
    return [p.x + h * n.x, p.y + h * n.y, p.z + h * n.z];
  };
  const expected = (u: number, v: number): number[] => {
    const e: number = 1e-4;
    const at: number = Math.min(1 - e, Math.max(e, u));
    const before: number[] = point(at - e, v);
    const after: number[] = point(at, v - e);
    const a: number[] = point(at + e, v).map(
      (x: number, k: number): number => x - before[k]!,
    );
    const b: number[] = point(at, v + e).map(
      (x: number, k: number): number => x - after[k]!,
    );
    const n: number[] = [
      b[1]! * a[2]! - b[2]! * a[1]!,
      b[2]! * a[0]! - b[0]! * a[2]!,
      b[0]! * a[1]! - b[1]! * a[0]!,
    ];
    const length: number = Math.hypot(n[0]!, n[1]!, n[2]!);
    return n.map((x: number): number => x / length);
  };
  const degrees = (a: number[], normals: number[], k: number): number =>
    (Math.acos(
      Math.min(
        1,
        a[0]! * normals[3 * k]! +
          a[1]! * normals[3 * k + 1]! +
          a[2]! * normals[3 * k + 2]!,
      ),
    ) *
      180) /
    Math.PI;
  const normalOf: number[] = [];
  surface.faces.forEach((v: number, c: number): void => {
    normalOf[v] = surface.normalFaces[c]!;
  });
  let radial: number = 0;
  let turned: number = 0;
  let unturned: number = 0;
  locations.forEach((l: IAutoMovieSurfaceLocation, v: number): void => {
    const axis = (p: number[]): number => Math.hypot(p[3 * v]!, p[3 * v + 2]!);
    radial = Math.max(
      radial,
      Math.abs(
        axis(displaced.limitPositions) -
          axis(surface.limitPositions) -
          heights[v]!,
      ),
    );
    const n: number[] = expected(l.sweep!.u, l.sweep!.v);
    turned = Math.max(turned, degrees(n, displaced.normals, normalOf[v]!));
    unturned = Math.max(unturned, degrees(n, surface.normals, normalOf[v]!));
  });
  TestValidator.predicate(
    "every vertex moves out from the axis by its height",
    radial <= 1e-7,
  );
  TestValidator.predicate(
    "the displaced normals follow the displaced surface",
    turned <= NORMAL,
  );
  TestValidator.predicate(
    "the undisplaced normals do not, so the bound distinguishes",
    unturned >= 6,
  );

  const zero: IAutoMovieSubdivisionSurface = displaceAutoMovieSurface({
    surface,
    heights: new Array<number>(heights.length).fill(0),
  });
  TestValidator.equals(
    "zero heights change nothing",
    [zero.positions, zero.limitPositions, zero.normals],
    [surface.positions, surface.limitPositions, surface.normals],
  );

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "a height short",
      (): unknown =>
        displaceAutoMovieSurface({ surface, heights: heights.slice(1) }),
      "one per vertex",
    ],
    [
      "a height that is not finite",
      (): unknown =>
        displaceAutoMovieSurface({
          surface,
          heights: heights.map((h: number, k: number): number =>
            k === 7 ? NaN : h,
          ),
        }),
      "height 7 is not finite",
    ],
    [
      "a cylinder turned inside out",
      (): unknown =>
        displaceAutoMovieSurface({
          surface,
          heights: heights.map((): number => -0.2),
        }),
      "turns the surface over",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
