import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import type { AutoMovieHumanFootConstruction } from "../AutoMovieHumanFootConstruction";
import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";
import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanChainBox } from "../limb/AutoMovieHumanChainBox";
import type { AutoMovieHumanFootPart } from "./AutoMovieHumanFootPart";

type Vec3 = [number, number, number];

/**
 * The foot's interim input (#3044's rule for priors the campaign has not
 * yet replaced; `log-body.md`, "Interim accessors"): the foot part's sites
 * read on today's foot chain, swapped for the foot's laws when they land.
 */
export namespace AutoMovieHumanFootInterim {
  /**
   * Interim accessor: a foot's sites' boxes read on today's foot chain
   * (`AutoMovieHumanChainBox`), on the foot's axis by its estimated yaw and
   * ankle place (`AutoMovieHumanFootPlaces`) through the ankle centre: the
   * heel half-way to the ankle's place, the ankle's place, the instep
   * (`instepLength`) and the ball (`ballOfFootLength`), closing at the heel
   * (pternion) and at the toes' first rings, the farthest along the foot.
   * Sites closer than the layer spacing to the one before are one site. The
   * axis stands at half the lowest dorsum over the floor among the sites,
   * read about today's sections' own axis points. Owed laws: the foot's yaw,
   * the ankle's place, the dorsum's heights, the forefoot's end.
   *
   * @param name The side.
   * @param old Today's foot chain.
   * @param toes Today's toe chains on that foot.
   * @param d The foot's dimensions, calibration mm.
   * @param ankle The ankle centre.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The foot part's input.
   */
  export function of(
    name: "left" | "right",
    old: IAutoMovieLoftChain,
    toes: readonly IAutoMovieLoftChain[],
    d: AutoMovieHumanFootConstruction.IDimensions,
    ankle: Vec3,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ): AutoMovieHumanFootPart.IInput {
    // The foot's axis turned out by its yaw, the heel behind the ankle
    // centre by the ankle's place along the foot (`AutoMovieHumanFootPlaces`,
    // estimated from the private reference set: no published source found).
    const sign: number = name === "left" ? 1 : -1;
    const yaw: number = (AutoMovieHumanFootPlaces.YAW * Math.PI) / 180;
    const along: Vec3 = [Math.cos(yaw), 0, sign * Math.sin(yaw)];
    const back: number = AutoMovieHumanFootPlaces.ankle(d.length / scale) * scale;
    const heel: Vec3 = [ankle[0] - along[0] * back, 0, ankle[2] - along[2] * back];
    const up: Vec3 = [0, 1, 0];
    const v: Vec3 = [along[2], 0, -along[0]];
    const at = (share: number, h: number): Vec3 => [heel[0] + along[0] * share * d.length, h, heel[2] + along[2] * share * d.length];
    const share = (p: Vec3): number => ((p[0] - heel[0]) * along[0] + (p[2] - heel[2]) * along[2]) / d.length;

    // The sites by rising share, merged where closer than a layer apart.
    const named: [string, number][] = [
      ["heel", back / d.length / 2],
      ["ankle", back / d.length],
      ["instep", (measures.instepLength * scale) / d.length],
      ["ball", (measures.ballOfFootLength * scale) / d.length],
    ];
    named.sort((p: [string, number], q: [string, number]): number => p[1] - q[1]);
    const kept: [string, number][] = [];
    for (const s of named) if (kept.length === 0 || (s[1] - kept[kept.length - 1]![1]) * d.length > AutoMovieHumanTrunkRows.MAX_GAP) kept.push(s);
    const end: number = Math.max(...toes.map((t: IAutoMovieLoftChain): number => share(AutoMovieLoftChain.axis(t, t.layers[0]!.y))));

    // The axis's height: half the lowest dorsum, read about today's axes.
    const dorsum: number[] = kept.flatMap(([, s]: [string, number]): number[] => {
      const b: AutoMovieHumanChainBox.IBox | null = AutoMovieHumanChainBox.at(old, at(s, d.ankle), up, v, true);
      return b === null ? [] : [b.centre[1] + b.edges[0]];
    });
    const height: number = dorsum.length === 0 ? d.ankle / 2 : Math.min(...dorsum) / 2;

    // Each site's box about the new axis, its sides in the law's order (up,
    // lateral, down, medial): the chart's v is medial on the left foot.
    const sites: { site: string; law: AutoMovieHumanFootPart.ISiteLaw }[] = kept.flatMap(([site, s]: [string, number]): { site: string; law: AutoMovieHumanFootPart.ISiteLaw }[] => {
      const b: AutoMovieHumanChainBox.IBox | null = AutoMovieHumanChainBox.at(old, at(s, height), up, v);
      if (b === null) return [];
      const e: [number, number, number, number] = b.edges;
      const edges: [number, number, number, number] = name === "left" ? [e[0], -e[3], e[2], -e[1]] : e;
      return [{ site, law: { share: s, edges, fullness: { shoulder: b.shoulder } } }];
    });
    return { name: `foot.${name}`, heel, along, height, length: d.length, poles: [0, Math.max(end, kept[kept.length - 1]![1] + AutoMovieHumanTrunkRows.MAX_GAP / d.length)], sites, side: name, order: 128, gap: AutoMovieHumanTrunkRows.MAX_GAP };
  }
}
