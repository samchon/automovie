import type { AutoMovieHumanFootConstruction } from "../AutoMovieHumanFootConstruction";
import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanDigitInterim } from "../limb/AutoMovieHumanDigitInterim";
import type { AutoMovieHumanDigitWalk } from "../limb/AutoMovieHumanDigitWalk";
import type { AutoMovieHumanFootPart } from "./AutoMovieHumanFootPart";

type Vec3 = [number, number, number];

/**
 * A foot and its toes from the person's foot dimensions and the reference set's
 * foot outline (`AutoMovieHumanReferenceOutlines.FOOT`: lateral and medial
 * edges about the heel-to-toe axis and the dorsum's and sole's heights, per
 * foot length; `AutoMovieHumanFootPlaces`: the foot's yaw, the ankle's place
 * along it, the toes' heads; estimated from the private reference set, no
 * published source gives a foot's outline).
 *
 * The foot's axis turns out by its yaw from the heel, which stands behind the
 * ankle centre by the ankle's place. Its sites are the heel half-way to the
 * ankle's place, the ankle's place, the instep and the ball (`instepLength`,
 * `ballOfFootLength`); sites closer than the layer spacing are one site. The
 * axis stands at half the lowest dorsum among the sites, and each site's box
 * is the table's edges about the axis there. The forefoot closes half-way
 * from the ball to the shortest toe's tip, where the toes have taken over.
 *
 * Each toe runs from the ball line at its head's place across the foot to its
 * tip. Its breadth is its share of the forefoot: the mean gap to its
 * neighbours' heads, or the one gap at either end, since the toes fill the
 * forefoot side by side. Its depth is the dorsum's height over the sole at
 * its middle, and it is a two-bone walk whose base sits inside the forefoot.
 */
export namespace AutoMovieHumanFootInterim {
  /**
   * The foot part's input.
   *
   * @param name The side.
   * @param d The foot's dimensions, calibration mm.
   * @param ankle The ankle centre.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The foot part's input.
   */
  export function of(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, ankle: Vec3, measures: IAutoMovieHumanBodyMeasures, scale: number): AutoMovieHumanFootPart.IInput {
    const frame: IFrame = place(name, d, ankle, scale);
    const L: number = d.length;
    const T: typeof AutoMovieHumanReferenceOutlines = AutoMovieHumanReferenceOutlines;
    const read = (column: string, share: number): number => T.at(T.FOOT, column, share) * L;

    // The sites by rising share, merged where closer than a layer apart.
    const named: [string, number][] = [
      ["heel", frame.back / L / 2],
      ["ankle", frame.back / L],
      ["instep", (measures.instepLength * scale) / L],
      ["ball", (measures.ballOfFootLength * scale) / L],
    ];
    named.sort((p: [string, number], q: [string, number]): number => p[1] - q[1]);
    const kept: [string, number][] = [];
    for (const s of named) if (kept.length === 0 || (s[1] - kept[kept.length - 1]![1]) * L > AutoMovieHumanTrunkRows.MAX_GAP) kept.push(s);
    const height: number = Math.min(...kept.map(([, s]: [string, number]): number => read("dorsum", s))) / 2;

    // Each site's box about the axis, its sides in the law's order (up,
    // lateral, down, medial).
    const sites: { site: string; law: AutoMovieHumanFootPart.ISiteLaw }[] = kept.map(([site, s]: [string, number]): { site: string; law: AutoMovieHumanFootPart.ISiteLaw } => ({
      site,
      law: { share: s, edges: [read("dorsum", s) - height, read("lateral", s), read("plantar", s) - height, -read("medial", s)], fullness: { shoulder: Math.SQRT2 - 1 } },
    }));
    const ball: number = kept[kept.length - 1]![1];
    const shortest: number = Math.min(...AutoMovieHumanFootPlaces.TOES.map((t: { tip: number }): number => t.tip));
    const end: number = Math.max((ball + shortest) / 2, ball + AutoMovieHumanTrunkRows.MAX_GAP / L);
    return { name: `foot.${name}`, heel: frame.heel, along: frame.along, height, length: L, poles: [0, end], sites, side: name, order: 128, gap: AutoMovieHumanTrunkRows.MAX_GAP };
  }

  /**
   * The toes' walks, the hallux first.
   *
   * @param name The side.
   * @param d The foot's dimensions, calibration mm.
   * @param ankle The ankle centre.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns Each toe's walk.
   */
  export function toes(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, ankle: Vec3, measures: IAutoMovieHumanBodyMeasures, scale: number): AutoMovieHumanDigitWalk.IInput[] {
    const frame: IFrame = place(name, d, ankle, scale);
    const L: number = d.length;
    const T: typeof AutoMovieHumanReferenceOutlines = AutoMovieHumanReferenceOutlines;
    const heads: readonly { tip: number; across: number }[] = AutoMovieHumanFootPlaces.TOES;
    const ball: number = (measures.ballOfFootLength * scale) / L;
    return heads.map((t: { tip: number; across: number }, k: number): AutoMovieHumanDigitWalk.IInput => {
      const gaps: number[] = [k > 0 ? t.across - heads[k - 1]!.across : null, k + 1 < heads.length ? heads[k + 1]!.across - t.across : null].filter((g: number | null): g is number => g !== null);
      const breadth: number = (gaps.reduce((a: number, g: number): number => a + Math.abs(g), 0) / gaps.length) * L;
      const middle: number = (ball + t.tip) / 2;
      const depth: number = (T.at(T.FOOT, "dorsum", middle) - Math.max(0, T.at(T.FOOT, "plantar", middle))) * L;
      const law: AutoMovieHumanDigitWalk.ISiteLaw = { breadth, depth, dorsal: 0.5, shoulder: Math.SQRT2 - 1 };
      const at = (share: number): Vec3 => [
        frame.heel[0] + frame.along[0] * share * L + frame.lateral[0] * t.across * L,
        depth / 2,
        frame.heel[2] + frame.along[2] * share * L + frame.lateral[2] * t.across * L,
      ];
      const base: Vec3 = at(Math.min(ball, t.tip - (2 * depth) / L));
      const tip: Vec3 = at(t.tip - depth / 2 / L);
      const mid: Vec3 = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2, (base[2] + tip[2]) / 2];
      const inside: Vec3 = [base[0] - (mid[0] - base[0]) / 2, base[1] - (mid[1] - base[1]) / 2, base[2] - (mid[2] - base[2]) / 2];
      return AutoMovieHumanDigitInterim.walk(`toe.${name}.${k + 1}`, [inside, mid, tip], [0, 1, 0], law, law);
    });
  }

  /** A foot's frame on the floor. */
  interface IFrame {
    /** The heel's rearmost point on the floor. */
    heel: Vec3;

    /** The unit direction from the heel to the toes. */
    along: Vec3;

    /** The unit lateral direction on the floor. */
    lateral: Vec3;

    /** The ankle's place ahead of the heel, mm. */
    back: number;
  }

  /**
   * The foot's frame: the axis turned out by its yaw, the heel behind the
   * ankle centre by the ankle's place along the foot (`AutoMovieHumanFootPlaces`).
   *
   * @param name The side.
   * @param d The foot's dimensions, calibration mm.
   * @param ankle The ankle centre.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The frame.
   */
  function place(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, ankle: Vec3, scale: number): IFrame {
    const sign: number = name === "left" ? 1 : -1;
    const yaw: number = (AutoMovieHumanFootPlaces.YAW * Math.PI) / 180;
    const along: Vec3 = [Math.cos(yaw), 0, sign * Math.sin(yaw)];
    const back: number = AutoMovieHumanFootPlaces.ankle(d.length / scale) * scale;
    const heel: Vec3 = [ankle[0] - along[0] * back, 0, ankle[2] - along[2] * back];
    return { heel, along, lateral: [-sign * along[2], 0, sign * along[0]], back };
  }
}
