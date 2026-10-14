import {
  buildAutoMoviePolyhedron,
  extrudeAutoMovieRegion,
  loftAutoMovieSections,
  revolveAutoMovieProfile,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieProfilePoint } from "@automovie/engine";
import { namedFacts, nclose } from "../internal/predicates";

/** How hard one triangle's atlas stretches, and by how much it changes area. */
interface IStretch {
  /** Ratio of the larger to the smaller singular value; 1 is a rigid frame. */
  anisotropy: number;
  /** Emitted uv area over surface area; 1 is equiareal. */
  areaScale: number;
}

/**
 * Measure the affine map that carries one triangle's surface onto its atlas.
 *
 * The triangle is expressed in an orthonormal basis of its own plane, which is
 * what makes the reading independent of how the mesh happens to sit in space,
 * and the resulting `2 x 2` matrix is decomposed through the eigenvalues of
 * `M^T M`. Degenerate triangles carry no frame and are reported as such.
 */
const stretchOf: (mesh: IAutoMovieMesh, triangle: number) => IStretch | null = (
  mesh: IAutoMovieMesh,
  triangle: number,
): IStretch | null => {
  const corner: (
    at: number,
  ) => readonly [readonly number[], readonly number[]] = (
    at: number,
  ): readonly [readonly number[], readonly number[]] => {
    const index: number = mesh.indices![triangle * 3 + at]!;
    return [
      [
        mesh.positions[index * 3]!,
        mesh.positions[index * 3 + 1]!,
        mesh.positions[index * 3 + 2]!,
      ],
      [mesh.uvs![index * 2]!, mesh.uvs![index * 2 + 1]!],
    ];
  };
  const [origin, atlas]: readonly [readonly number[], readonly number[]] =
    corner(0);
  const [alpha, alphaUv]: readonly [readonly number[], readonly number[]] =
    corner(1);
  const [beta, betaUv]: readonly [readonly number[], readonly number[]] =
    corner(2);
  const first: number[] = alpha.map(
    (value: number, axis: number): number => value - origin[axis]!,
  );
  const second: number[] = beta.map(
    (value: number, axis: number): number => value - origin[axis]!,
  );
  const spanA: number = Math.hypot(...first);
  if (spanA === 0) return null;
  const unit: number[] = first.map((value: number): number => value / spanA);
  const along: number = second.reduce(
    (sum: number, value: number, axis: number): number =>
      sum + value * unit[axis]!,
    0,
  );
  const spanB: number = Math.hypot(
    ...second.map(
      (value: number, axis: number): number => value - along * unit[axis]!,
    ),
  );
  if (spanB === 0) return null;
  // Surface edges in that basis are (spanA, 0) and (along, spanB); the atlas
  // edges are the uv differences, so M solves M * [surface] = [atlas].
  const uvA: number[] = alphaUv.map(
    (value: number, axis: number): number => value - atlas[axis]!,
  );
  const uvB: number[] = betaUv.map(
    (value: number, axis: number): number => value - atlas[axis]!,
  );
  const column: (row: number) => readonly [number, number] = (
    row: number,
  ): readonly [number, number] => [
    uvA[row]! / spanA,
    (uvB[row]! - (uvA[row]! * along) / spanA) / spanB,
  ];
  const [ux, uy]: readonly [number, number] = column(0);
  const [vx, vy]: readonly [number, number] = column(1);
  const xx: number = ux * ux + vx * vx;
  const xy: number = ux * uy + vx * vy;
  const yy: number = uy * uy + vy * vy;
  const half: number = (xx + yy) / 2;
  const gap: number = Math.sqrt(Math.max(0, half * half - (xx * yy - xy * xy)));
  return {
    anisotropy:
      Math.sqrt(half + gap) / Math.sqrt(Math.max(half - gap, Number.MIN_VALUE)),
    areaScale: Math.abs(ux * vy - uy * vx),
  };
};

/** The worst finite anisotropy over nondegenerate frames; NaN rejects an empty frame population or a nonfinite measurement instead of silently reporting zero. */
const worstAnisotropy: (mesh: IAutoMovieMesh) => number = (
  mesh: IAutoMovieMesh,
): number => {
  let worst: number = NaN;
  for (
    let triangle: number = 0;
    triangle * 3 < mesh.indices!.length;
    ++triangle
  ) {
    const stretch: IStretch | null = stretchOf(mesh, triangle);
    if (stretch === null) continue;
    if (
      !Number.isFinite(stretch.anisotropy) ||
      !Number.isFinite(stretch.areaScale)
    )
      return NaN;
    worst = Number.isNaN(worst)
      ? stretch.anisotropy
      : Math.max(worst, stretch.anisotropy);
  }
  return worst;
};

/** A meridian one metre long leaning `degrees` away from the axis. */
const leaningCone: (degrees: number) => IAutoMovieMesh = (
  degrees: number,
): IAutoMovieMesh =>
  revolveAutoMovieProfile({
    profile: [
      { x: 1, y: 0 },
      {
        x: 1 + Math.sin((degrees * Math.PI) / 180),
        y: Math.cos((degrees * Math.PI) / 180),
      },
    ],
    segments: 96,
  });

/** The closed form the operator's contract states, at a given meridian slope. */
const statedWorst: (degrees: number) => number = (degrees: number): number => {
  const k: number = 2 * Math.PI * Math.abs(Math.sin((degrees * Math.PI) / 180));
  return (Math.sqrt(k * k + 4) + k) / (Math.sqrt(k * k + 4) - k);
};

const ring: (radius: number) => IAutoMovieProfilePoint[] = (
  radius: number,
): IAutoMovieProfilePoint[] =>
  Array.from(
    { length: 24 },
    (_point: unknown, at: number): IAutoMovieProfilePoint => ({
      x: radius * Math.cos((at / 24) * Math.PI * 2),
      y: radius * Math.sin((at / 24) * Math.PI * 2),
    }),
  );

/**
 * The shear a revolved metric atlas costs, and where a directional finish may go.
 *
 * Radius-dependent arc coordinates couple meridian travel to angular travel.
 * Triangle affine-map singular values observe that anisotropy independently
 * of the revolution builder; these numeric checks do not observe a finish or
 * the appearance of its grain.
 *
 * Every expected number comes from the geometry rather than from the builder.
 * The worst anisotropy over a full turn of a meridian at slope `dr / ds` is the
 * condition number of a shear by `k = 2 * pi * |dr / ds|`, which is
 * `(sqrt(k * k + 4) + k) / (sqrt(k * k + 4) - k)`; the mesh is only asked to
 * agree with that within the error its own tessellation admits.
 *
 * Scenarios:
 *
 * 1. A constant-radius drum's tessellated atlas has anisotropy below 1.01.
 * 2. The shear follows meridian slope and nothing else, matching the stated
 *    closed form at 6.5, 13.8, 45 and 89.9 degrees off the axis, which are the
 *    2, 4, 21.7 and 41.5 the contract quotes.
 * 3. Every nondegenerate measured steep-cone triangle retains area ratio one
 *    within 1e-3; degenerate triangles have no affine frame and are excluded.
 * 4. The pole is not the cause. A frustum has no zero-radius vertex and its
 *    worst shear agrees with the cone's within one percent, remaining above 20.
 * 5. The first and last angular triangles on opposite sides of the UV cut have
 *    high and near-unit anisotropy respectively.
 * 6. The stated alternatives retain unit anisotropy within 1e-6. A faceted spire through
 *    `buildAutoMoviePolyhedron` and a flat cap through `extrudeAutoMovieRegion`
 *    are rigid, while `loftAutoMovieSections` measures the same pair and a
 *    tapered loft shears with it, so it is not an escape from this.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the existing drum, four leaning cones, cone/frustum, faceted spire, region cap and tapered loft; independently measures per-triangle affine singular values and area ratios. Assertions distinguish slope-dependent shear, retained area, pole removal, angular variation and metric faceted alternatives while retaining the loft's high anisotropy.
 * @evidence contracts/testing.md#independent-expectations A shear of k=2*pi*abs(sin(angle)) has condition number (sqrt(k*k+4)+k)/(sqrt(k*k+4)-k), giving independent continuum expectations compared within the original two-percent tessellation window. Triangle edge bases and UV differences independently measure area/singular values. The observer excludes zero-area frames and clamps cancellation in eigenvalue arithmetic; retained tolerances are numeric agreement rather than an exact universal isometry or rendered proof.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the constant radius, four original slopes, nondegenerate area comparisons, axis pole versus nonzero-radius frustum, first/last angular triangles, faceted spire, flat cap and tapered loft. General UV cardinality/seam rules, malformed builders and other atlas-density behavior have separate owners.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly runs portable revolution/polyhedron/region/loft source and its existing independent scalar affine-map observer on unchanged authored data. It installs no consumer, builds no native artifact and starts no process, browser or GPU; all six scenarios remain local without dynamic registration.
 */
export function test_geometry_revolve_atlas_shear(): void {
  const drum: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 1, y: 0 },
      { x: 1, y: 2 },
    ],
    segments: 96,
  });
  TestValidator.predicate(
    "a constant radius carries a rigid atlas, so a drum takes any grain",
    worstAnisotropy(drum) < 1.01,
  );

  TestValidator.equals(
    "shear follows meridian slope and matches the stated closed form",
    namedFacts(
      [6.5, 13.8, 45, 89.9].map(
        (degrees: number): readonly [string, () => boolean] =>
          [
            `at${degrees}`,
            (): boolean => {
              const measured: number = worstAnisotropy(leaningCone(degrees));
              return (
                nclose(
                  measured,
                  statedWorst(degrees),
                  statedWorst(degrees) * 0.02,
                ) &&
                Math.abs(measured - statedWorst(degrees)) <
                  statedWorst(degrees) * 0.02
              );
            },
          ] as const,
      ),
    ),
    { "at6.5": true, "at13.8": true, at45: true, "at89.9": true },
  );

  const steep: IAutoMovieMesh = leaningCone(45);
  const stretches: (IStretch | null)[] = Array.from(
    { length: steep.indices!.length / 3 },
    (_triangle: unknown, at: number): IStretch | null => stretchOf(steep, at),
  );
  TestValidator.predicate(
    "the distortion is pure shear: every triangle keeps its area",
    stretches.some((stretch: IStretch | null): boolean => stretch !== null) &&
      stretches.every(
        (stretch: IStretch | null): boolean =>
          stretch === null || nclose(stretch.areaScale, 1, 1e-3),
      ),
  );

  // A 45-degree cone standing on its point, and the same cone with the top
  // metre of its meridian cut away so that no vertex sits on the axis at all.
  const cone: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 0, y: 2 },
      { x: 2, y: 0 },
    ],
    segments: 96,
  });
  const frustum: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 1, y: 1 },
      { x: 2, y: 0 },
    ],
    segments: 96,
  });
  const withPole: number = worstAnisotropy(cone);
  const without: number = worstAnisotropy(frustum);
  TestValidator.equals(
    "cutting the pole away changes nothing: the flank shears just as hard",
    namedFacts([
      [
        "frustumHasNoPole",
        (): boolean =>
          Array.from(
            { length: frustum.positions.length / 3 },
            (_vertex: unknown, at: number): number =>
              Math.hypot(
                frustum.positions[at * 3]!,
                frustum.positions[at * 3 + 2]!,
              ),
          ).every((radius: number): boolean => radius > 0),
      ],
      [
        "sameWorstShear",
        (): boolean =>
          nclose(withPole, without, withPole * 0.01) &&
          Math.abs(withPole - without) < withPole * 0.01,
      ],
      ["andItIsSevere", (): boolean => without > 20],
    ]),
    { frustumHasNoPole: true, sameWorstShear: true, andItIsSevere: true },
  );

  // Triangle 0 sits at theta = 0, where `2 * pi - theta` is at its largest, and
  // the last pair sits at the closing segment, where it has run down to zero.
  const last: number = frustum.indices!.length / 3 - 1;
  TestValidator.equals(
    "the shear sweeps around the surface, which is why constant u spirals",
    namedFacts([
      [
        "seamSideIsNearlyRigid",
        (): boolean => stretchOf(frustum, last)!.anisotropy < 1.2,
      ],
      [
        "oppositeIsAtTheWorst",
        (): boolean => stretchOf(frustum, 0)!.anisotropy > 20,
      ],
    ]),
    { seamSideIsNearlyRigid: true, oppositeIsAtTheWorst: true },
  );

  // A square pyramid: the faceted spire the contract sends an author to.
  const spire: IAutoMovieMesh = buildAutoMoviePolyhedron([
    [
      { x: -1, y: 0, z: -1 },
      { x: 1, y: 0, z: -1 },
      { x: 0, y: 2, z: 0 },
    ],
    [
      { x: 1, y: 0, z: -1 },
      { x: 1, y: 0, z: 1 },
      { x: 0, y: 2, z: 0 },
    ],
    [
      { x: 1, y: 0, z: 1 },
      { x: -1, y: 0, z: 1 },
      { x: 0, y: 2, z: 0 },
    ],
    [
      { x: -1, y: 0, z: 1 },
      { x: -1, y: 0, z: -1 },
      { x: 0, y: 2, z: 0 },
    ],
  ]);
  const cap: IAutoMovieMesh = extrudeAutoMovieRegion({
    outer: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ],
    depth: 0.1,
  });
  const taper: IAutoMovieMesh = loftAutoMovieSections({
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 2 },
    ],
    sections: [
      { at: 0, outer: ring(2) },
      { at: 1, outer: ring(0.05) },
    ],
  });
  TestValidator.equals(
    "the named alternatives are rigid, and a tapered loft is not one of them",
    namedFacts([
      ["facetedSpire", (): boolean => nclose(worstAnisotropy(spire), 1, 1e-6)],
      ["flatCap", (): boolean => nclose(worstAnisotropy(cap), 1, 1e-6)],
      [
        "taperedLoftSharesTheDefect",
        (): boolean => worstAnisotropy(taper) > 20,
      ],
    ]),
    { facetedSpire: true, flatCap: true, taperedLoftSharesTheDefect: true },
  );
}
