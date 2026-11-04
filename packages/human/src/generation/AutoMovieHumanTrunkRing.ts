import type { IAutoMovieHumanArmRootArc } from "./IAutoMovieHumanArmRootArc";
import { AutoMovieHumanTrunkAssembly } from "./AutoMovieHumanTrunkAssembly";
import { AutoMovieHumanTrunkGuides } from "./AutoMovieHumanTrunkGuides";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";

/**
 * One trunk section as a chain ring: the seven guides of the canonical left
 * side, the six sectors between them (`AutoMovieHumanTrunkGuides`) and the
 * right side's reflections, assembled by `AutoMovieHumanTrunkAssembly`.
 *
 * A guide's speed is the mean of its two sectors' arclength rates (the
 * quadrant's own length between the guides over their phase span), so the
 * sectors and the guide's control points run at one speed through each guide.
 */
export namespace AutoMovieHumanTrunkRing {
  /** The left side's guides in knot order, front midline to back midline. */
  const GUIDES: readonly AutoMovieHumanTrunkGuides.Guide[] = AutoMovieHumanTrunkGuides.ORDER;

  /** The left side's sectors, each after the guide of the same index. */
  const SECTORS: readonly AutoMovieHumanTrunkGuides.ISector[] = AutoMovieHumanTrunkGuides.SECTORS;

  /** Each guide's knot. */
  const KNOT: Readonly<Record<AutoMovieHumanTrunkGuides.Guide, number>> = AutoMovieHumanTrunkGuides.KNOT;

  /**
   * The speed of every guide of the left side, mm per radian.
   *
   * @param s The section.
   * @param arc The arm's arc, which replaces the two flank sectors; absent, the torso's own flanks.
   * @returns One speed per guide, midline to midline.
   */
  export function speeds(s: AutoMovieHumanTrunkQuadrant.ISection, arc?: IAutoMovieHumanArmRootArc): number[] {
    const rates: number[] = SECTORS.map((sector: AutoMovieHumanTrunkGuides.ISector, i: number): number => {
      const [a, b]: [number, number] = sector.shares(s);
      const span: number = AutoMovieHumanTrunkQuadrant.phase(KNOT[GUIDES[i + 1]!] - KNOT[GUIDES[i]!]);
      const own: number = AutoMovieHumanTrunkQuadrant.arclength(s, sector.side, a, b) / span;

      // The arc's flank rates carry the torso's by its weight, so at the vault
      // the folds run at the torso's own speeds.
      if (arc !== undefined && (i === 2 || i === 3)) return arc.torso * own + (1 - arc.torso) * arc.rates[i - 2]!;
      return own;
    });

    const speeds: number[] = GUIDES.map((_: unknown, j: number): number =>
      j === 0 ? rates[0]! : j === GUIDES.length - 1 ? rates[rates.length - 1]! : (rates[j - 1]! + rates[j]!) / 2,
    );

    // The arc's lateral guide stands on the arm's ellipse, where no torso
    // flank reaches: it runs at the arc's own speed, the mean of its two
    // sectors' path rates, while the axillary guides keep the torso's, so the
    // trunk's top ring still agrees with the ring outside the arc. At the
    // torso's speed a guide standing out at the abducted arm closed a long
    // chord slowly, and the arc drew two straight wings meeting at a beak
    // outside the arm (the shoulders' blades).
    if (arc !== undefined) speeds[3] = (arc.rates[0]! + arc.rates[1]!) / 2;
    return speeds;
  }

  /**
   * The section's controls, `[x_0 .. x_255, z_0 .. z_255]`.
   *
   * @param s The section's measures; with an arc, its anterior and posterior shares are the arc's.
   * @param arc The arm's arc, which replaces the anterior, lateral and posterior guides and the two flank sectors between them.
   * @returns The 256-control section.
   */
  export function controls(s: AutoMovieHumanTrunkQuadrant.ISection, arc?: IAutoMovieHumanArmRootArc): number[] {
    const section: AutoMovieHumanTrunkQuadrant.ISection =
      arc === undefined ? s : { ...s, anterior: arc.anterior, posterior: arc.posterior };
    const v: number[] = speeds(section, arc);
    const guides: AutoMovieHumanTrunkAssembly.IGuide[] = GUIDES.map(
      (g: AutoMovieHumanTrunkGuides.Guide, j: number): AutoMovieHumanTrunkAssembly.IGuide => ({
        knot: KNOT[g],
        jet: arc !== undefined && j >= 2 && j <= 4 ? arc.guides[j - 2]! : AutoMovieHumanTrunkGuides.jet(g, section),
        speed: v[j]!,
      }),
    );
    const sectors: AutoMovieHumanTrunkAssembly.Sector[] = SECTORS.map(
      (sector: AutoMovieHumanTrunkGuides.ISector, j: number): AutoMovieHumanTrunkAssembly.Sector => {
        if (arc !== undefined && j === 2) return arc.front([v[j]!, v[j + 1]!]);
        if (arc !== undefined && j === 3) return arc.back([v[j]!, v[j + 1]!]);

        return AutoMovieHumanTrunkGuides.sector(sector, section, [v[j]!, v[j + 1]!]);
      },
    );

    return AutoMovieHumanTrunkAssembly.controls(guides, sectors);
  }
}
