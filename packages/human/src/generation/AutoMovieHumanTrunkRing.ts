import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import type { IAutoMovieHumanArmRootArc } from "./IAutoMovieHumanArmRootArc";
import { AutoMovieHumanTrunkAssembly } from "./AutoMovieHumanTrunkAssembly";
import { AutoMovieHumanTrunkGuideAnteriorAxillary } from "./AutoMovieHumanTrunkGuideAnteriorAxillary";
import { AutoMovieHumanTrunkGuideBackMidline } from "./AutoMovieHumanTrunkGuideBackMidline";
import { AutoMovieHumanTrunkGuideBustLine } from "./AutoMovieHumanTrunkGuideBustLine";
import { AutoMovieHumanTrunkGuideFrontMidline } from "./AutoMovieHumanTrunkGuideFrontMidline";
import { AutoMovieHumanTrunkGuideMidAxillary } from "./AutoMovieHumanTrunkGuideMidAxillary";
import { AutoMovieHumanTrunkGuidePosteriorAxillary } from "./AutoMovieHumanTrunkGuidePosteriorAxillary";
import { AutoMovieHumanTrunkGuideScapular } from "./AutoMovieHumanTrunkGuideScapular";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkSectorAnteriorFlank } from "./AutoMovieHumanTrunkSectorAnteriorFlank";
import { AutoMovieHumanTrunkSectorErector } from "./AutoMovieHumanTrunkSectorErector";
import { AutoMovieHumanTrunkSectorPectoral } from "./AutoMovieHumanTrunkSectorPectoral";
import { AutoMovieHumanTrunkSectorPosteriorFlank } from "./AutoMovieHumanTrunkSectorPosteriorFlank";
import { AutoMovieHumanTrunkSectorScapular } from "./AutoMovieHumanTrunkSectorScapular";
import { AutoMovieHumanTrunkSectorSternal } from "./AutoMovieHumanTrunkSectorSternal";

/**
 * One trunk section as a chain ring: the seven guides of the canonical left
 * side, the six sectors between them and the right side's reflections,
 * assembled by `AutoMovieHumanTrunkAssembly`.
 *
 * A guide's speed is the mean of its two sectors' arclength rates (the
 * quadrant's own length between the guides over their phase span), so the
 * sectors and the guide's control points run at one speed through each guide.
 */
export namespace AutoMovieHumanTrunkRing {
  /** A left sector's definition: the quadrant it lies on, the lateral shares of its guides and its constructor. */
  interface ISector {
    /** The sector's name in findings. */
    name: string;

    /** The quadrant the sector lies on. */
    side: AutoMovieHumanTrunkQuadrant.Side;

    /** The lateral shares of its first and second guide in a section. */
    shares: (s: AutoMovieHumanTrunkQuadrant.ISection) => [number, number];

    /** The sector's jet function, given the section and its guides' speeds. */
    create: (
      s: AutoMovieHumanTrunkQuadrant.ISection,
      speeds: readonly [number, number],
    ) => AutoMovieHumanTrunkAssembly.Sector;
  }

  /** The left side's guides in knot order, front midline to back midline. */
  const GUIDES: readonly {
    knot: number;
    jet: (s: AutoMovieHumanTrunkQuadrant.ISection) => IAutoMovieHumanSeam.IArcJet;
  }[] = [
    {
      knot: AutoMovieHumanTrunkGuideFrontMidline.KNOT,
      jet: (s: AutoMovieHumanTrunkQuadrant.ISection): IAutoMovieHumanSeam.IArcJet => AutoMovieHumanTrunkGuideFrontMidline.jet(s),
    },
    {
      knot: AutoMovieHumanTrunkGuideBustLine.KNOT,
      jet: (s: AutoMovieHumanTrunkQuadrant.ISection): IAutoMovieHumanSeam.IArcJet => AutoMovieHumanTrunkGuideBustLine.jet(s),
    },
    {
      knot: AutoMovieHumanTrunkGuideAnteriorAxillary.KNOT,
      jet: (s: AutoMovieHumanTrunkQuadrant.ISection): IAutoMovieHumanSeam.IArcJet => AutoMovieHumanTrunkGuideAnteriorAxillary.jet(s),
    },
    {
      knot: AutoMovieHumanTrunkGuideMidAxillary.KNOT,
      jet: (s: AutoMovieHumanTrunkQuadrant.ISection): IAutoMovieHumanSeam.IArcJet => AutoMovieHumanTrunkGuideMidAxillary.jet(s),
    },
    {
      knot: AutoMovieHumanTrunkGuidePosteriorAxillary.KNOT,
      jet: (s: AutoMovieHumanTrunkQuadrant.ISection): IAutoMovieHumanSeam.IArcJet => AutoMovieHumanTrunkGuidePosteriorAxillary.jet(s),
    },
    {
      knot: AutoMovieHumanTrunkGuideScapular.KNOT,
      jet: (s: AutoMovieHumanTrunkQuadrant.ISection): IAutoMovieHumanSeam.IArcJet => AutoMovieHumanTrunkGuideScapular.jet(s),
    },
    {
      knot: AutoMovieHumanTrunkGuideBackMidline.KNOT,
      jet: (s: AutoMovieHumanTrunkQuadrant.ISection): IAutoMovieHumanSeam.IArcJet => AutoMovieHumanTrunkGuideBackMidline.jet(s),
    },
  ];

  /** The left side's sectors, each after the guide of the same index. */
  const SECTORS: readonly ISector[] = [
    {
      name: "trunk.sternal",
      side: "front",
      shares: (): [number, number] => [0, AutoMovieHumanTrunkGuideBustLine.SHARE],
      create: AutoMovieHumanTrunkSectorSternal.create,
    },
    {
      name: "trunk.pectoral",
      side: "front",
      shares: (s: AutoMovieHumanTrunkQuadrant.ISection): [number, number] => [AutoMovieHumanTrunkGuideBustLine.SHARE, s.anterior],
      create: AutoMovieHumanTrunkSectorPectoral.create,
    },
    {
      name: "trunk.anteriorFlank",
      side: "front",
      shares: (s: AutoMovieHumanTrunkQuadrant.ISection): [number, number] => [s.anterior, 1],
      create: AutoMovieHumanTrunkSectorAnteriorFlank.create,
    },
    {
      name: "trunk.posteriorFlank",
      side: "back",
      shares: (s: AutoMovieHumanTrunkQuadrant.ISection): [number, number] => [1, s.posterior ?? AutoMovieHumanTrunkGuidePosteriorAxillary.SHARE],
      create: AutoMovieHumanTrunkSectorPosteriorFlank.create,
    },
    {
      name: "trunk.scapular",
      side: "back",
      shares: (s: AutoMovieHumanTrunkQuadrant.ISection): [number, number] => [s.posterior ?? AutoMovieHumanTrunkGuidePosteriorAxillary.SHARE, AutoMovieHumanTrunkGuideScapular.SHARE],
      create: AutoMovieHumanTrunkSectorScapular.create,
    },
    {
      name: "trunk.erector",
      side: "back",
      shares: (): [number, number] => [AutoMovieHumanTrunkGuideScapular.SHARE, 0],
      create: AutoMovieHumanTrunkSectorErector.create,
    },
  ];

  /**
   * The speed of every guide of the left side, mm per radian.
   *
   * @param s The section.
   * @param arc The arm's arc, which replaces the two flank sectors; absent, the torso's own flanks.
   * @returns One speed per guide, midline to midline.
   */
  export function speeds(s: AutoMovieHumanTrunkQuadrant.ISection, arc?: IAutoMovieHumanArmRootArc): number[] {
    const rates: number[] = SECTORS.map((sector: ISector, i: number): number => {
      const [a, b]: [number, number] = sector.shares(s);
      const span: number = AutoMovieHumanTrunkQuadrant.phase(GUIDES[i + 1]!.knot - GUIDES[i]!.knot);
      const own: number = AutoMovieHumanTrunkQuadrant.arclength(s, sector.side, a, b) / span;

      // The arc's flank rates carry the torso's by its weight, so at the vault
      // the folds run at the torso's own speeds.
      if (arc !== undefined && (i === 2 || i === 3)) return arc.torso * own + (1 - arc.torso) * arc.rates[i - 2]!;
      return own;
    });

    return GUIDES.map((_: unknown, j: number): number =>
      j === 0 ? rates[0]! : j === GUIDES.length - 1 ? rates[rates.length - 1]! : (rates[j - 1]! + rates[j]!) / 2,
    );
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
      (g: (typeof GUIDES)[number], j: number): AutoMovieHumanTrunkAssembly.IGuide => ({
        knot: g.knot,
        jet: arc !== undefined && j >= 2 && j <= 4 ? arc.guides[j - 2]! : g.jet(section),
        speed: v[j]!,
      }),
    );
    const sectors: AutoMovieHumanTrunkAssembly.Sector[] = SECTORS.map(
      (sector: ISector, j: number): AutoMovieHumanTrunkAssembly.Sector => {
        if (arc !== undefined && j === 2) return arc.front([v[j]!, v[j + 1]!]);
        if (arc !== undefined && j === 3) return arc.back([v[j]!, v[j + 1]!]);

        return sector.create(section, [v[j]!, v[j + 1]!]);
      },
    );

    return AutoMovieHumanTrunkAssembly.controls(guides, sectors);
  }
}
