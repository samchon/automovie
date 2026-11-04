import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanChainBox } from "./AutoMovieHumanChainBox";
import type { AutoMovieHumanDigitWalk } from "./AutoMovieHumanDigitWalk";
import { AutoMovieHumanSegmentChart } from "./AutoMovieHumanSegmentChart";

type Vec3 = [number, number, number];

/**
 * The digits' interim input (#3044's rule for priors the campaign has not
 * yet replaced; `log-body.md`, "Interim accessors"): each finger's, thumb's
 * and toe's site laws read on today's digit chain, swapped for the digits'
 * laws when they land.
 */
export namespace AutoMovieHumanDigitInterim {
  /**
   * Interim accessor: a digit's site laws read on today's digit chain
   * (`AutoMovieHumanChainBox`, about today's sections' own axis points), its
   * dorsal direction today's chain frame's `u` at its first section, its tip
   * today's pole past the distal end, or half the distal end's depth where
   * today's chain has none. A site today's chain cannot box takes its
   * neighbour's law. Owed laws: the digits' breadths, depths and pulp.
   *
   * @param name The digit's chain name.
   * @param old Today's digit chain.
   * @param centres The joint centres from the base to the tip.
   * @returns The digit walk's input.
   */
  export function walk(name: string, old: IAutoMovieLoftChain, centres: Vec3[]): AutoMovieHumanDigitWalk.IInput {
    const dorsal: Vec3 = AutoMovieLoftChain.frame(old, old.layers[0]!.y).u;
    const points: [string, Vec3, Vec3, Vec3][] = [["base", centres[0]!, centres[0]!, centres[1]!]];
    for (let k: number = 0; k + 1 < centres.length; k++) {
      points.push([`shaft ${k}`, AutoMovieHumanSegmentChart.lerp(centres[k]!, centres[k + 1]!, 0.5), centres[k]!, centres[k + 1]!]);
      points.push([k + 2 < centres.length ? `joint ${k + 1}` : "end", centres[k + 1]!, centres[k]!, centres[k + 1]!]);
    }
    const laws: Map<string, AutoMovieHumanDigitWalk.ISiteLaw> = new Map();
    let last: AutoMovieHumanDigitWalk.ISiteLaw | null = null;
    const missing: string[] = [];
    for (const [site, p, from, to] of points) {
      const [u, v]: [Vec3, Vec3] = AutoMovieHumanSegmentChart.of(from, to, dorsal);
      const b: AutoMovieHumanChainBox.IBox | null = AutoMovieHumanChainBox.at(old, p, u, v, true);
      if (b === null) {
        if (last !== null) laws.set(site, last);
        else missing.push(site);
        continue;
      }
      const depth: number = b.edges[0] - b.edges[2];
      last = { breadth: b.edges[1] - b.edges[3], depth, dorsal: b.edges[0] / depth, shoulder: b.shoulder };
      laws.set(site, last);
      for (const m of missing.splice(0)) laws.set(m, last);
    }
    const end: Vec3 = centres[centres.length - 1]!;
    const tip: number = old.pole !== undefined ? AutoMovieHumanSegmentChart.distance(old.pole.point, end) : 0;
    return {
      name,
      centres,
      dorsal,
      // A dome over a section of depth D turns round over about D / 2 (a
      // hemisphere's reach), so the tip never stands nearer than that.
      tip: Math.max(tip, (laws.get("end")?.depth ?? 0) / 2),
      law: (site: string): AutoMovieHumanDigitWalk.ISiteLaw => {
        const found: AutoMovieHumanDigitWalk.ISiteLaw | undefined = laws.get(site);
        if (found === undefined) throw new Error(`Today's ${name} boxes no site at all`);
        return found;
      },
      order: 64,
      gap: 1,
    };
  }

  /**
   * A toe's joint centres read on today's toe chain: its first ring's, its
   * middle's and its last ring's axis points, the base moved back from the
   * first ring along the toe's line by half the toe's first segment, so the
   * toe runs into its host.
   *
   * @param toe Today's toe chain.
   * @returns The centres from the base to the tip.
   */
  export function toeCentres(toe: IAutoMovieLoftChain): Vec3[] {
    const first: number = toe.layers[0]!.y;
    const last: number = toe.layers[toe.layers.length - 1]!.y;
    const a: Vec3 = AutoMovieLoftChain.axis(toe, first);
    const m: Vec3 = AutoMovieLoftChain.axis(toe, (first + last) / 2);
    const e: Vec3 = AutoMovieLoftChain.axis(toe, last);
    return [[a[0] - (m[0] - a[0]) / 2, a[1] - (m[1] - a[1]) / 2, a[2] - (m[2] - a[2]) / 2], m, e];
  }
}
