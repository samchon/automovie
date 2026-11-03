import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import type { AutoMovieHumanTrunkAssembly } from "./AutoMovieHumanTrunkAssembly";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";

/**
 * The trunk section's seven guides of the canonical left side and the six
 * sectors between them, as one table: each guide a longitudinal reference
 * line at a fixed knot of the 256-control section with the lateral share it
 * stands at, each sector the quintic Hermite of its two guides' jets at the
 * quadrant's own speeds (`AutoMovieHumanTrunkQuadrant.between`), so it meets
 * both with their point, tangent and curvature (G2) and holds no number of its
 * own. The reference lines are Gray 1918's and ISO 8559-1's
 * (`docs/techniques/surface-composition.md`, Sectors and guides):
 *
 * - front midline M, knot 0: the linea alba and the sternum. It owns the front
 *   place, the tangent across the midline and the curvature of the front
 *   quadrant's parabola through the bust line guide, the crotch fold's
 *   curvature added.
 * - bust line K, knot 24: the mid-clavicular vertical through the bust point
 *   at the chest, at the clavicle's midpoint, half of the sternoclavicular
 *   joint's and the acromion's half breadths (about 20 and 183 mm, ANSUR II
 *   biacromial breadth), over the chest's half breadth below the axilla (about
 *   150 mm on the four references): share 0.65.
 * - anterior axillary line A, knot 46: the lower border of pectoralis major
 *   from the anterior axillary fold point, at the section's own lateral share,
 *   which the front interscye length sets at the axilla and which falls back
 *   to 0.9 below it. Its knot is where the arm's arc of the shoulder ring starts.
 * - mid-axillary line L, knot 70: the section's widest point. Its tangent runs
 *   straight back; its curvature is the mean of the front and back quadrants'
 *   parabolas through the anterior and posterior axillary guides, declared once
 *   so both flank sectors share it; the crotch fold has ended before it.
 * - posterior axillary line P, knot 94: latissimus dorsi and teres major down
 *   from the posterior axillary fold point, at share 0.9 or the section's own.
 *   Its knot is where the arm's arc of the shoulder ring ends.
 * - scapular line E, knot 108: the vertical through the inferior scapular
 *   angle, the erector column's lateral edge below it, the inferior angle about
 *   80 mm off the midline (Gray 1918) over the chest's half breadth: share 0.55.
 * - back midline S, knot 128: the spinous processes and the sacrum. It owns the
 *   back place, the tangent across the midline and the curvature of the back
 *   quadrant's parabola through the scapular guide, the gluteal cleft's
 *   curvature added.
 *
 * The sectors, each after the guide of the same index:
 *
 * - sternal, M to K: the linea alba and rectus below, the sternum and the
 *   pectorals' medial part above; the crotch fold acts on it.
 * - pectoral, K to A: pectoralis major over the ribs above, the rectus' lateral
 *   edge and the oblique below; the crotch fold acts on it and ends at A.
 * - anterior flank, A to L: serratus anterior and the external oblique over the
 *   ribs, the iliac roll at the pelvis.
 * - posterior flank, L to P: latissimus dorsi over the ribs, the iliac crest's
 *   back at the pelvis.
 * - scapular, P to E: the scapula's lateral border and teres major above,
 *   latissimus below, the gluteus medius at the pelvis; the gluteal cleft's
 *   displacement ends at P.
 * - erector, E to S: the erector spinae column, the sacrum and the gluteal
 *   cleft at the pelvis; the spinal furrow is a relief over it, not this arc.
 */
export namespace AutoMovieHumanTrunkGuides {
  /** A guide of the canonical left side. */
  export type Guide = "frontMidline" | "bustLine" | "anteriorAxillary" | "midAxillary" | "posteriorAxillary" | "scapular" | "backMidline";

  /** The guides in knot order, front midline to back midline. */
  export const ORDER: readonly Guide[] = ["frontMidline", "bustLine", "anteriorAxillary", "midAxillary", "posteriorAxillary", "scapular", "backMidline"];

  /** Each guide's knot of the 256-control section, on the canonical left side. */
  export const KNOT: Readonly<Record<Guide, number>> = {
    frontMidline: 0,
    bustLine: 24,
    anteriorAxillary: 46,
    midAxillary: 70,
    posteriorAxillary: 94,
    scapular: 108,
    backMidline: 128,
  };

  /**
   * The lateral share of the half width a quadrant guide stands at: the bust
   * line's and the scapular line's always, the anterior axillary line's away
   * from the axilla, the posterior axillary line's where the section gives none.
   */
  export const SHARE: Readonly<Record<"bustLine" | "anteriorAxillary" | "posteriorAxillary" | "scapular", number>> = {
    bustLine: 0.65,
    anteriorAxillary: 0.9,
    posteriorAxillary: 0.9,
    scapular: 0.55,
  };

  /**
   * A guide's jet in a section, by arclength in the direction of rising phase.
   *
   * @param guide The guide.
   * @param s The section's measures.
   * @param folded Whether to add the crotch fold; sectors take the guides without it. The mid-axillary line has none.
   * @returns The guide's arclength jet.
   */
  export function jet(guide: Guide, s: AutoMovieHumanTrunkQuadrant.ISection, folded: boolean = true): IAutoMovieHumanSeam.IArcJet {
    switch (guide) {
      case "frontMidline":
        return AutoMovieHumanTrunkQuadrant.onMidline(s, "front", SHARE.bustLine, folded);
      case "bustLine":
        return AutoMovieHumanTrunkQuadrant.onQuadrant(s, "front", SHARE.bustLine, folded);
      case "anteriorAxillary":
        return AutoMovieHumanTrunkQuadrant.onQuadrant(s, "front", s.anterior, folded);
      case "midAxillary":
        return AutoMovieHumanTrunkQuadrant.onWidest(s, s.anterior, SHARE.posteriorAxillary);
      case "posteriorAxillary":
        return AutoMovieHumanTrunkQuadrant.onQuadrant(s, "back", s.posterior ?? SHARE.posteriorAxillary, folded);
      case "scapular":
        return AutoMovieHumanTrunkQuadrant.onQuadrant(s, "back", SHARE.scapular, folded);
      case "backMidline":
        return AutoMovieHumanTrunkQuadrant.onMidline(s, "back", SHARE.scapular, folded);
    }
  }

  /** A left sector: the quadrant it lies on, its two guides and whether the crotch fold acts on it. */
  export interface ISector {
    /** The sector's name in findings. */
    name: string;

    /** The quadrant the sector lies on. */
    side: AutoMovieHumanTrunkQuadrant.Side;

    /** Its first and second guide. */
    guides: readonly [Guide, Guide];

    /** Whether the crotch fold or the gluteal cleft's displacement acts on it. */
    folded: boolean;

    /** The lateral shares of its first and second guide in a section. */
    shares: (s: AutoMovieHumanTrunkQuadrant.ISection) => [number, number];
  }

  /** The left side's sectors, each after the guide of the same index. */
  export const SECTORS: readonly ISector[] = [
    {
      name: "trunk.sternal",
      side: "front",
      guides: ["frontMidline", "bustLine"],
      folded: true,
      shares: (): [number, number] => [0, SHARE.bustLine],
    },
    {
      name: "trunk.pectoral",
      side: "front",
      guides: ["bustLine", "anteriorAxillary"],
      folded: true,
      shares: (s: AutoMovieHumanTrunkQuadrant.ISection): [number, number] => [SHARE.bustLine, s.anterior],
    },
    {
      name: "trunk.anteriorFlank",
      side: "front",
      guides: ["anteriorAxillary", "midAxillary"],
      folded: false,
      shares: (s: AutoMovieHumanTrunkQuadrant.ISection): [number, number] => [s.anterior, 1],
    },
    {
      name: "trunk.posteriorFlank",
      side: "back",
      guides: ["midAxillary", "posteriorAxillary"],
      folded: false,
      shares: (s: AutoMovieHumanTrunkQuadrant.ISection): [number, number] => [1, s.posterior ?? SHARE.posteriorAxillary],
    },
    {
      name: "trunk.scapular",
      side: "back",
      guides: ["posteriorAxillary", "scapular"],
      folded: true,
      shares: (s: AutoMovieHumanTrunkQuadrant.ISection): [number, number] => [s.posterior ?? SHARE.posteriorAxillary, SHARE.scapular],
    },
    {
      name: "trunk.erector",
      side: "back",
      guides: ["scapular", "backMidline"],
      folded: true,
      shares: (): [number, number] => [SHARE.scapular, 0],
    },
  ];

  /**
   * A sector of a section: its jet at a phase between its guides' knots, per
   * radian (point, first and second derivatives), its guides' jets read once
   * without the crotch fold.
   *
   * @param sector The sector.
   * @param s The section's measures.
   * @param speeds Its guides' speeds, mm per radian.
   * @returns The sector's jet function.
   */
  export function sector(sector: ISector, s: AutoMovieHumanTrunkQuadrant.ISection, speeds: readonly [number, number]): AutoMovieHumanTrunkAssembly.Sector {
    const [a, b]: readonly [Guide, Guide] = sector.guides;

    return AutoMovieHumanTrunkQuadrant.between(s, sector.side, jet(a, s, false), jet(b, s, false), [KNOT[a], KNOT[b]], speeds, sector.folded);
  }
}
