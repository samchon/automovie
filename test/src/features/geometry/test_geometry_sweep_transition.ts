import {
  type AutoMovieSurfaceTier,
  type IAutoMovieSurfaceCage,
  layoutAutoMovieSurfaceTransition,
  mapAutoMovieSurfaceTier,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/namedFacts";
import { sweepTransitionTube } from "../internal/sweepTransitionTube";
import { sweepTransitionDeviation } from "../internal/sweepTransitionDeviation";
import { throwsError } from "../internal/throwsError";

/** Stated bounds of the straight tube's limit surface by tier: radial deviation over the radius, and normal angle from the radial direction in degrees. */
const BOUNDS: Record<Exclude<AutoMovieSurfaceTier, "high">, [number, number]> = {
  lowest: [0.07, 20],
  low: [0.012, 5],
  medium: [0.012, 5],
};

/**
 * A transition band changes a sweep's column count with quads only: its
 * cage stays a closed manifold with regular rings and only the band's poles
 * extraordinary, its blocks mirror, its faces map between tiers, and a
 * cylinder changing count stays within stated bounds of its radius and
 * normal.
 *
 * Scenarios:
 *
 * 1. The tube going from 8 to 16 columns and from 16 to 12 at the medium
 *    tier: its only extraordinary vertices are two valence-three poles per
 *    block, the four corners between the 8-to-16 band's four adjacent blocks
 *    at valence six and the four corners beside the 16-to-12 band's two
 *    separated blocks at valence five, and the only boundary is the two end
 *    rings.
 * 2. A band's layout reversed in `s` is the same set of quads for 8 to 16
 *    and for 16 to 12 columns.
 * 3. Points on band faces map from the medium tier to the low tier and back
 *    to their own face within 1e-12.
 * 4. The straight tube's limit surface, subdivided twice, stays within the
 *    stated radial deviation and normal angle of its cylinder at the lowest,
 *    low and medium tiers; the high tier has its own scenario.
 * 5. Odd differences, more than a halving and non-integer counts are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples transition networks with `sampleAutoMovieSurfaceNetwork`, lays bands out with `layoutAutoMovieSurfaceTransition`, maps with `mapAutoMovieSurfaceTier` and measures the subdivided limit surface; extra or misplaced poles, triangles, asymmetric blocks, a grid-only locator or a dent beyond the bound fails, while any quad reduction with interior poles within the bounds passes.
 * @evidence contracts/testing.md#independent-expectations Valences, boundary edges and the mirror are counted from the faces in this test; the expected extraordinary vertices follow from the pattern: two valence-three poles per block, a valence-six corner between adjacent blocks and valence-five corners beside straight columns; the round trip returns its start; the cylinder's radius and radial normal are analytic. The bounds are the measured accuracy of a valence-three reduction on a tube of 4, 8 and 8 coarse columns, about four times the plain tube's, stated as the pattern's cost.
 * @evidence contracts/testing.md#distinguishing-cases Covers growing and shedding bands, a 2-to-1 and a 4-to-3 ratio, the lowest, low and medium tiers, mirrored layouts, band faces in tier mapping and each refusal; the high tier's bound is owned by the high-tier scenario and sweep sampling by the network tests.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_transition` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_transition(): void {
  const cage: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network: sweepTransitionTube(), tier: "medium" });
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
  // a ring vertex borders two faces, any other vertex its valence
  const irregular: Record<number, number> = {};
  valence.forEach((n: number, v: number): void => {
    const degree: number = ringed.has(v) ? n + 2 : n;
    if (degree !== 4) irregular[degree] = (irregular[degree] ?? 0) + 1;
  });
  const boundary: number = [...edges.values()].filter((n: number): boolean => n === 1).length;
  TestValidator.equals(
    "bands have exactly their blocks' poles and corners as extraordinary vertices",
    namedFacts([
      ["poles", (): boolean => JSON.stringify(irregular) === JSON.stringify({ 3: 2 * (4 + 2), 5: 4, 6: 4 })],
      ["boundary", (): boolean => boundary === 8 + 12 && [...edges.values()].every((n: number): boolean => n === 1 || n === 2)],
    ]),
    { poles: true, boundary: true },
  );

  const mirrored = (start: number, end: number): boolean => {
    const key = (q: Array<{ s: number; t: number }>): string =>
      q
        .map((c: { s: number; t: number }): string => `${Math.round(c.s * 1e9)},${Math.round(c.t * 1e9)}`)
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
        .join(";");
    const quads: Array<Array<{ s: number; t: number }>> = layoutAutoMovieSurfaceTransition(start, end, 1);
    const set: Set<string> = new Set(quads.map(key));
    return quads.every((q: Array<{ s: number; t: number }>): boolean => set.has(key(q.map((c: { s: number; t: number }) => ({ s: 1 - c.s, t: c.t })))));
  };
  TestValidator.equals("a band reversed in s is the same band", [mirrored(8, 16), mirrored(16, 12)], [true, true]);

  const low: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network: sweepTransitionTube(), tier: "low" });
  const bands: number[] = cage.patches.flatMap((p: IAutoMovieSurfaceCage.IPatch): number[] => (p.grid ? [] : p.faces));
  TestValidator.predicate(
    "points on band faces round-trip between tiers",
    bands.every((face: number, k: number): boolean => {
      const at = { face, corner: null, u: 0.1 + 0.8 * ((k * 0.618) % 1), v: 0.1 + 0.8 * ((k * 0.382) % 1) };
      const back = mapAutoMovieSurfaceTier({ from: low, to: cage, at: mapAutoMovieSurfaceTier({ from: cage, to: low, at }).at }).at;
      return back.face === face && Math.abs(back.u - at.u) <= 1e-12 && Math.abs(back.v - at.v) <= 1e-12;
    }),
  );

  TestValidator.equals(
    "a cylinder changing count stays within the stated bounds",
    (Object.keys(BOUNDS) as Array<keyof typeof BOUNDS>).map((tier): boolean => {
      const [radial, normal] = sweepTransitionDeviation(tier);
      return radial <= BOUNDS[tier][0] && normal <= BOUNDS[tier][1];
    }),
    [true, true, true],
  );

  const invalids: Array<readonly [string, () => unknown, string]> = [
    ["an odd difference", (): unknown => layoutAutoMovieSurfaceTransition(8, 11, 1), "must differ by an even number"],
    ["more than a halving", (): unknown => layoutAutoMovieSurfaceTransition(4, 10, 1), "more than twice"],
    ["a fractional count", (): unknown => layoutAutoMovieSurfaceTransition(8, 12.5, 1), "positive integers"],
    ["no rows", (): unknown => layoutAutoMovieSurfaceTransition(8, 12, 0), "positive integers"],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(`${name} is refused by its own diagnostic`, throwsError(callback, message));
}
