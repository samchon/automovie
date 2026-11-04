import { AutoMovieHumanBodyApertures } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyApertures";
import { AutoMovieHumanBodyRoots } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyRoots";
import { AutoMovieHumanLoftAperture } from "../../../../../../packages/human/src/lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanPeople } from "../../../internal/HumanPeople";

type V3 = [number, number, number];

/**
 * A reading, not a check: for every opening of a person, the chains whose
 * station range holds the opening's margin, and how closely each chain's
 * trim loop (`AutoMovieHumanBodyRoots.trim`) lands on the opening's outline,
 * so that each opening's base chain can be chosen by a rule on these numbers.
 *
 * Scenarios:
 * 1. For each person of `HumanPeople` (or `AUTOMOVIE_HUMAN_PEOPLE`), every prepared opening prints its margin's height range and, for every chain whose layers span that range, the trim loop's largest distance from the outline in the projection plane, its station and phase extents.
 *
 * @evidence contracts/testing.md#behavioral-verification Calibrates each person (`HumanPeople.person`), prepares the openings (`AutoMovieHumanBodyApertures.prepare`), and for every chain whose first and last layer heights hold the margin's height range solves the trim loop and evaluates it back on the chain (`AutoMovieHumanLoftChain.ring`), printing the largest in-plane distance to the outline point it solved for and the loop's station and phase ranges.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports.
 * @evidence contracts/testing.md#distinguishing-cases Both eyes, both nostrils and the mouth, on every core person.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_aperture_base_reading`, calibrating in process with no browser or GPU.
 */
export function test_human_aperture_base_reading(): void {
  for (const name of HumanPeople.names()) {
    const body: HumanPeople.IPerson["body"] = HumanPeople.person(name).body;
    const prepared: AutoMovieHumanBodyApertures.IPrepared[] = AutoMovieHumanBodyApertures.prepare(body.apertures, body.eyes);
    for (const opening of prepared) {
      const margin: AutoMovieHumanLoftAperture.Point[] = AutoMovieHumanLoftAperture.polyline(opening.aperture);
      const range: [number, number] = AutoMovieHumanLoftAperture.range(margin);
      const rows: string[] = [];
      for (const chain of body.chains) {
        const y0: number = chain.layers[0]!.y;
        const y1: number = chain.layers[chain.layers.length - 1]!.y;
        if (!(y0 <= range[0] && range[1] <= y1)) continue;
        rows.push(`${chain.name} [${y0.toFixed(1)}, ${y1.toFixed(1)}] ${reading(chain, opening.outline, range)}`);
      }
      console.log(`  ${name} ${opening.aperture.name} heights [${range[0].toFixed(1)}, ${range[1].toFixed(1)}]: ${rows.join("; ") || "no chain holds it"}`);
    }
  }
}

/** The trim loop on one chain: largest in-plane miss and extents. */
function reading(chain: IAutoMovieHumanLoftChain, outline: AutoMovieHumanLoftAperture.IOutline, range: [number, number]): string {
  const loop: [number, number][] = AutoMovieHumanBodyRoots.trim(chain, outline, range);
  let miss: number = 0;
  loop.forEach(([s, t]: [number, number], i: number): void => {
    const p: V3 = AutoMovieHumanLoftChain.ring(chain, s, [t])[0]! as V3;
    const a: number = dot(p, outline.lateral);
    const b: number = dot(p, outline.up);
    const target: [number, number] = outline.points[i]!;
    miss = Math.max(miss, Math.hypot(a - target[0], b - target[1]));
  });
  const ss: number[] = loop.map((p: [number, number]): number => p[0]);
  const ts: number[] = loop.map((p: [number, number]): number => p[1]);
  return `miss ${miss.toFixed(3)} mm, stations [${Math.min(...ss).toFixed(1)}, ${Math.max(...ss).toFixed(1)}], phases [${Math.min(...ts).toFixed(2)}, ${Math.max(...ts).toFixed(2)}]`;
}

const dot = (a: V3, b: readonly number[]): number => a[0] * b[0]! + a[1] * b[1]! + a[2] * b[2]!;
