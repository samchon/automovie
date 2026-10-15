import {
  type IAutoMovieSweep,
  type IAutoMovieSweepSection,
  type IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  interpolateAutoMovieSpline,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/namedFacts";
import { throwsError } from "../internal/throwsError";

/** Half-axes of an elliptic section family: breadth swelling and settling, depth growing. */
const breadth = (u: number): number => 0.1 + 0.03 * Math.sin(Math.PI * u);
const depth = (u: number): number => 0.06 + 0.02 * u * u;

/** The family's radius at `u` in direction `angle`, the polar form of the ellipse. */
const radius = (u: number, angle: number): number =>
  (breadth(u) * depth(u)) / Math.hypot(depth(u) * Math.cos(angle), breadth(u) * Math.sin(angle));

const ellipse = (u: number): IAutoMovieSweepSection => ({
  type: "superellipse",
  right: breadth(u),
  up: depth(u),
  left: breadth(u),
  down: depth(u),
  exponents: [2, 2, 2, 2],
});

const SPINE: IAutoMovieSweep["spine"] = { points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }], normal: { x: 0, y: 0, z: 1 } };

/** Knots of each guide's profile. */
const KNOTS: number[] = Array.from({ length: 21 }, (_: unknown, k: number): number => k / 20);

/** Sixteen guides at even directions, each the family's radius there at every knot. */
const GUIDES: IAutoMovieSweep.IGuide[] = Array.from({ length: 16 }, (_: unknown, g: number): IAutoMovieSweep.IGuide => {
  const angle: number = (Math.PI * g) / 8;
  return { angle, radii: KNOTS.map((at: number): IAutoMovieSweep.IKnot => ({ at, value: radius(at, angle) })) };
});

/** Largest relative radius difference between two surfaces over a grid. */
const difference = (a: IAutoMovieSweepSurface, b: IAutoMovieSweepSurface): number => {
  let worst: number = 0;
  for (let i: number = 0; i <= 100; ++i)
    for (let j: number = 0; j < 64; ++j) {
      const r: number = b.radius(i / 100, j / 64);
      worst = Math.max(worst, Math.abs(a.radius(i / 100, j / 64) - r) / r);
    }
  return worst;
};

/**
 * Guides join a sweep's stations as a Gordon surface: two stations and sixteen
 * silhouette guides reproduce a densely stationed section family, and the
 * surface passes through every guide.
 *
 * Scenarios:
 *
 * 1. A family of ellipses whose breadth swells and settles while its depth
 *    grows, stationed every 2.5 percent, is reproduced within 0.5 percent of
 *    radius by its two end stations plus sixteen guides, while the two end
 *    stations alone miss it by more than 20 percent.
 * 2. The guided surface takes each guide's own profile at every `u` to
 *    1e-12, and the end stations' sections where the guides agree with them.
 * 3. A guide that disagrees with its stations wins: one guide moves every
 *    direction of the section by its one difference.
 * 4. Guides sharing a direction, a guide profile that does not span the
 *    spine, guides under parameter correspondence and guides that drive a
 *    radius to zero are refused by their own diagnostics.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles dense, sparse-with-guides and sparse sweeps with `compileAutoMovieSweep` and compares their radius fields; a guide layer that ignored the guides, applied them only at their own directions, or let stations override them fails scenarios 1 to 3, while any Gordon blend exact on the guides and stations passes.
 * @evidence contracts/testing.md#independent-expectations The family's radius is the ellipse's polar form computed in this test; each guide's profile is its declared knots through the spline interpolant, itself verified by the spline test; the single-guide shift is the Gordon sum's value for one guide, the guide minus the station. The 0.5 percent bound is the Gordon blend's accuracy between sixteen guides on this family, which a station-only loft misses by two orders of magnitude.
 * @evidence contracts/testing.md#distinguishing-cases Covers the guided and unguided pair on one family, compatible and incompatible guides, the end stations and the guide directions, and every refusal; the loft's sampling into cages is owned by the network tests.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_gordon` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_gordon(): void {
  const dense: IAutoMovieSweepSurface = compileAutoMovieSweep({
    spine: SPINE,
    stations: Array.from({ length: 41 }, (_: unknown, k: number): IAutoMovieSweep.IStation => ({ at: k / 40, section: ellipse(k / 40) })),
  });
  const ends: IAutoMovieSweep.IStation[] = [0, 1].map((at: number): IAutoMovieSweep.IStation => ({ at, section: ellipse(at) }));
  const guided: IAutoMovieSweepSurface = compileAutoMovieSweep({ spine: SPINE, stations: ends, guides: GUIDES });
  const bare: IAutoMovieSweepSurface = compileAutoMovieSweep({ spine: SPINE, stations: ends });
  TestValidator.equals(
    "two stations and sixteen guides reproduce the dense family, the stations alone do not",
    namedFacts([
      ["guided", (): boolean => difference(guided, dense) < 0.005],
      ["bare", (): boolean => difference(bare, dense) > 0.2],
    ]),
    { guided: true, bare: true },
  );

  const us: number[] = Array.from({ length: 101 }, (_: unknown, i: number): number => i / 100);
  TestValidator.equals(
    "the guided surface passes through every guide and through the compatible stations",
    namedFacts([
      [
        "guides",
        (): boolean =>
          GUIDES.every((g: IAutoMovieSweep.IGuide): boolean => {
            const profile: (u: number) => number = interpolateAutoMovieSpline({
              knots: g.radii.map((k: IAutoMovieSweep.IKnot): number => k.at),
              values: g.radii.map((k: IAutoMovieSweep.IKnot): number => k.value),
            });
            return us.every((u: number): boolean => Math.abs(guided.radius(u, g.angle / (2 * Math.PI)) - profile(u)) <= 1e-12);
          }),
      ],
      [
        "stations",
        (): boolean =>
          [0, 1].every((u: number): boolean =>
            Array.from({ length: 90 }, (_: unknown, j: number): number => j / 90).every(
              (v: number): boolean => Math.abs(guided.radius(u, v) - radius(u, 2 * Math.PI * v)) <= 1e-5,
            ),
          ),
      ],
    ]),
    { guides: true, stations: true },
  );

  const circle: IAutoMovieSweepSection = { type: "superellipse", right: 0.1, up: 0.1, left: 0.1, down: 0.1, exponents: [2, 2, 2, 2] };
  const shifted: IAutoMovieSweepSurface = compileAutoMovieSweep({
    spine: SPINE,
    stations: [{ at: 0, section: circle }, { at: 1, section: circle }],
    guides: [{ angle: 0, radii: [{ at: 0, value: 0.15 }, { at: 1, value: 0.15 }] }],
  });
  TestValidator.predicate(
    "a disagreeing guide wins and moves the whole section by its difference",
    us.every((u: number): boolean => [0, 0.2, 0.5, 0.77].every((v: number): boolean => Math.abs(shifted.radius(u, v) - 0.15) <= 1e-12)),
  );

  const flat: IAutoMovieSweep.IKnot[] = [{ at: 0, value: 0.1 }, { at: 1, value: 0.1 }];
  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "guides sharing a direction",
      (): unknown => compileAutoMovieSweep({ spine: SPINE, stations: ends, guides: [{ angle: 0, radii: flat }, { angle: 2 * Math.PI, radii: flat }] }),
      "sweep guides must have distinct directions",
    ],
    [
      "a guide short of the spine",
      (): unknown => compileAutoMovieSweep({ spine: SPINE, stations: ends, guides: [{ angle: 0, radii: [{ at: 0, value: 0.1 }, { at: 0.9, value: 0.1 }] }] }),
      "sweep guide 0 must span the spine from at 0 to at 1",
    ],
    [
      "guides under parameter correspondence",
      (): unknown => compileAutoMovieSweep({ spine: SPINE, stations: ends, correspondence: "parameter", guides: [{ angle: 0, radii: flat }] }),
      "sweep guides and features need direction correspondence",
    ],
    [
      "a guide that drives a radius to zero",
      (): number =>
        compileAutoMovieSweep({
          spine: SPINE,
          stations: [0, 1].map((at: number): IAutoMovieSweep.IStation => ({ at, section: { ...circle, right: 0.2, left: 0.2, up: 0.01, down: 0.01 } })),
          guides: [{ angle: 0, radii: [{ at: 0, value: 0.02 }, { at: 1, value: 0.02 }] }],
        }).radius(0.5, 0.25),
      "sweep guides make the section's radius vanish",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(`${name} is refused by its own diagnostic`, throwsError(callback, message));
}
