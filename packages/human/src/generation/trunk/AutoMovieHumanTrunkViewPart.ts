import type { AutoMovieLoftContract } from "@automovie/engine";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import type { IAutoMovieConstructionKnot, IAutoMovieConstructionLevelAxis } from "@automovie/interface";
import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * The trunk base as a part lofted from its own views (campaign #3044,
 * construction step 1; #3047): the chain `trunk` from the perineum's pole to
 * its open top inside the neck, every station a level section that touches
 * the box of the front view's half breadth and the side view's two profiles.
 *
 * Views to the kernel's chart. The axis is level, its origin on the mid-depth
 * course (`IAutoMovieConstructionLevelAxis`, the natural spline of the
 * sites' mid-depths in height),
 * `u` forward and `v` left, so the kernel's `front` pair (the extremes along
 * `u`) is the anatomical side view and its `side` pair (along `v`) the
 * anatomical front view. Every edge is given relative to the axis's origin,
 * the mid-depth `c = (front + back) / 2`: the front and back profiles become
 * `+-(front - back) / 2`, and the lateral outline `+-half`, the right side the
 * left's reflection (J6). At the perineum all four meet and the chain closes
 * there by its pole.
 *
 * Fullness and stations follow `AutoMovieHumanSiteViewPart`: a tape's site
 * solves its common conic shoulder on its own box, so every trunk tape reads
 * back at its site; an untaped site keeps its sourced shoulder. The box is
 * symmetric along `u` about the mid-depth, so one common shoulder serves the
 * four quarters with no departure until a sourced law of the front and back
 * quarters lands.
 */
export namespace AutoMovieHumanTrunkViewPart {
  /** The trunk's chain name. */
  export const NAME: string = "trunk";

  /** Control points of every section: 256, the trunk's density (`generalization.md`, Trunk), a multiple of 4 so each guide stands on a knot. */
  export const ORDER: number = 256;

  /** Uniform phases of the chain's rings: two per control point. */
  export const SAMPLES: number = 512;

  /** Widest spacing between layers, mm: `AutoMovieHumanTrunkRows.MAX_GAP`, under the reference's densest mean section gap of 3.9 mm. */
  export const GAP: number = 3.5;

  /** The part and its loft. */
  export type IResult = AutoMovieHumanSiteViewPart.IResult;

  /**
   * Build the trunk base from its views.
   *
   * @param views The perineum and the sites' knots.
   * @returns The part, its loft and the diagnostics; generation keeps going on a null loft, whose diagnostics say why.
   */
  export function create(views: IAutoMovieHumanTrunkViews): IResult {
    // A site whose back stands at or before its front has no depth, and one
    // at or under the perineum no place above the pole.
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    for (const s of views.sites)
      if (!(s.front > s.back) || !(s.y > views.perineum.y))
        diagnostics.push({ producer: `view.${NAME}`, level: 2, contract: "sites", detail: `site ${s.site} at ${s.y} mm: front ${s.front} mm over back ${s.back} mm, perineum at ${views.perineum.y} mm` });
    if (diagnostics.length !== 0) return { part: null, loft: null, view: null, diagnostics };

    return AutoMovieHumanSiteViewPart.create({
      name: NAME,
      axis: level([
        { site: "perineum", y: views.perineum.y, x: views.perineum.x },
        ...views.sites.map((s: IAutoMovieHumanTrunkViews.ISite): { site: string; y: number; x: number } => ({ site: s.site, y: s.y, x: (s.front + s.back) / 2 })),
      ]),
      sites: views.sites.map((s: IAutoMovieHumanTrunkViews.ISite): AutoMovieHumanSiteViewPart.ISite => {
        const depth: number = (s.front - s.back) / 2;
        return { site: s.site, station: s.y, edges: [depth, s.half, -depth, -s.half], fullness: s.fullness };
      }),
      pole: { end: "bottom", station: views.perineum.y },
      order: ORDER,
      samples: SAMPLES,
      gap: GAP,
    });
  }

  /**
   * The level axis record whose origin runs on the mid-depth course: its `x`
   * the natural spline of the knots' forward places in height, its `z` the
   * median plane.
   *
   * @param knots The course's knots by rising height, mm.
   * @returns The axis record, metres.
   */
  function level(knots: readonly { site: string; y: number; x: number }[]): IAutoMovieConstructionLevelAxis {
    const M: number = AutoMovieHumanConstructionView.METRES;
    return {
      type: "level",
      origin: {
        x: { knots: knots.map((k: { site: string; y: number; x: number }): IAutoMovieConstructionKnot => ({ site: k.site, station: k.y * M, value: k.x * M })) },
        z: { knots: knots.map((k: { site: string; y: number; x: number }): IAutoMovieConstructionKnot => ({ site: k.site, station: k.y * M, value: 0 })) },
      },
    };
  }
}
