import {
  layoutAutoMovieSurfaceTransition,
  mapAutoMovieSurfaceTier,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import type {
  AutoMovieSurfaceTier,
  IAutoMovieSubdivisionParameter,
  IAutoMovieSurfaceCage,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepTransitionDeviation } from "../../../internal/sweepTransitionDeviation";
import { sweepTransitionTube } from "../../../internal/sweepTransitionTube";
import { throwsError } from "../../../internal/throwsError";

type Corner = { s: number; t: number };

/**
 * `layoutAutoMovieSurfaceTransition` changes a sweep's column count with quads
 * only, and the sampled cage (`sampleAutoMovieSurfaceNetwork`) and tier map
 * (`mapAutoMovieSurfaceTier`) keep it a closed manifold that holds its
 * cylinder.
 *
 * Fixture: the straight tube going from 8 to 16 columns and from 16 to 12
 * (`sweepTransitionTube`); bounds by tier, radial deviation over the radius
 * and normal angle from the radial direction in degrees: lowest 0.07 and 20,
 * low and medium 0.012 and 5, high 0.003 and 2.5.
 *
 * Scenarios:
 *
 * 1. At the medium tier the only extraordinary vertices are two valence-three
 *    poles per block (2 (4 + 2)), four valence-six corners beside the 8-to-16
 *    band and four valence-five corners beside the 16-to-12 band; the only
 *    boundary is the two end rings, 8 + 12 edges, every other edge two-faced.
 * 2. A band's layout mirrored in s is itself, for 8 to 16 and 16 to 12.
 * 3. Points on band faces map medium to low and back to their own face within
 *    1e-12.
 * 4. Subdivided twice, the tube stays within each tier's bounds.
 * 5. An odd difference, more than a doubling and zero rows are refused.
 */
export function test_unit_engine_geometry_sweep_transition(): void {
  const cage: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: sweepTransitionTube(),
    tier: "medium",
  });

  // 1.
  const valence: number[] = new Array<number>(cage.targets.length / 3).fill(0);
  const edges: Map<string, number> = new Map();
  for (const quad of cage.cage.faces)
    quad.forEach((v: number, k: number): void => {
      ++valence[v]!;
      const w: number = quad[(k + 1) % 4]!;
      const key: string = v < w ? `${v},${w}` : `${w},${v}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    });
  const ringed: Set<number> = new Set(Object.values(cage.rings).flat());
  const irregular: Record<number, number> = {};
  valence.forEach((n: number, v: number): void => {
    // A ring vertex borders two faces fewer than its degree.
    const degree: number = ringed.has(v) ? n + 2 : n;
    if (degree !== 4) irregular[degree] = (irregular[degree] ?? 0) + 1;
  });
  TestValidator.equals("extraordinary vertices", irregular, { 3: 12, 5: 4, 6: 4 });
  const counts: number[] = [...edges.values()];
  TestValidator.equals("boundary edges", counts.filter((n: number) => n === 1).length, 20);
  TestValidator.predicate("manifold", counts.every((n: number): boolean => n === 1 || n === 2));

  // 2.
  const key = (q: Corner[]): string =>
    q
      .map((c: Corner): string => `${Math.round(c.s * 1e9)},${Math.round(c.t * 1e9)}`)
      .sort()
      .join(";");
  for (const [start, end] of [
    [8, 16],
    [16, 12],
  ]) {
    const quads: Corner[][] = layoutAutoMovieSurfaceTransition(start!, end!, 1);
    const set: Set<string> = new Set(quads.map(key));
    TestValidator.predicate(
      `${start} to ${end} mirrored`,
      quads.every((q: Corner[]): boolean =>
        set.has(key(q.map((c: Corner): Corner => ({ s: 1 - c.s, t: c.t })))),
      ),
    );
  }

  // 3.
  const low: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: sweepTransitionTube(),
    tier: "low",
  });
  const bands: number[] = cage.patches.flatMap(
    (p: IAutoMovieSurfaceCage.IPatch): number[] => (p.grid ? [] : p.faces),
  );
  TestValidator.predicate(
    "band faces round-trip",
    bands.every((face: number, k: number): boolean => {
      const at: IAutoMovieSubdivisionParameter = {
        face,
        corner: null,
        u: 0.1 + 0.8 * ((k * 0.618) % 1),
        v: 0.1 + 0.8 * ((k * 0.382) % 1),
      };
      const back: IAutoMovieSubdivisionParameter = mapAutoMovieSurfaceTier({
        from: low,
        to: cage,
        at: mapAutoMovieSurfaceTier({ from: cage, to: low, at }).at,
      }).at;
      return (
        back.face === face &&
        Math.abs(back.u - at.u) <= 1e-12 &&
        Math.abs(back.v - at.v) <= 1e-12
      );
    }),
  );

  // 4.
  for (const [tier, radial, normal] of [
    ["lowest", 0.07, 20],
    ["low", 0.012, 5],
    ["medium", 0.012, 5],
    ["high", 0.003, 2.5],
  ] satisfies [AutoMovieSurfaceTier, number, number][]) {
    const [r, n]: [number, number] = sweepTransitionDeviation(tier);
    TestValidator.predicate(`${tier}: ${r} radial, ${n} degrees`, r <= radial && n <= normal);
  }

  // 5.
  for (const [label, start, end, rows, message] of [
    ["odd difference", 8, 11, 1, "must differ by an even number"],
    ["more than a doubling", 4, 10, 1, "more than twice"],
    ["no rows", 8, 12, 0, "positive integers"],
  ] satisfies [string, number, number, number, string][])
    TestValidator.predicate(
      label,
      throwsError((): unknown => layoutAutoMovieSurfaceTransition(start, end, rows), message),
    );
}
