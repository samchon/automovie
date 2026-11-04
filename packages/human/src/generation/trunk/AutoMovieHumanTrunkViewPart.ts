import type { AutoMovieLoftContract } from "@automovie/engine";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import type { IAutoMovieConstructionKnot, IAutoMovieConstructionLevelAxis } from "@automovie/interface";
import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * The trunk base as a part lofted from its own views (campaign #3044,
 * construction step 1; #3047): the chain `trunk` from the perineum's pole to
 * the neck, every station a level section that touches
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
 * quarters lands. A head supplies a top pole inside its neck volume: the
 * trunk closes there before the merge trims its hidden dome away. An open
 * neck ring alone gives the fold no host surface above the intersection.
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
   * The trunk's hidden top closure, on the head mass's own axis and above
   * the last neck section, in calibration millimetres. The caller derives
   * it from the neck section and the head axis, never a sampled skin mesh.
   */
  export interface ITop {
    /** Forward place of the head mass's axis, mm. */
    x: number;

    /** Height inside the head mass's neck domain, mm. */
    y: number;
  }

  /**
   * Build the trunk base from its views.
   *
   * @param views The perineum and the sites' knots.
   * @param top Optional top pole inside the head. Without a head, the last section remains open for standalone inspection.
   * @returns The part, its loft and the diagnostics; generation keeps going on a null loft, whose diagnostics say why.
   *
   * @evidence contracts/common.md#principled-implementation The named outline knots keep their measured values. A supplied top adds a zero-radius pole through the existing engine dome operator, so the head merge has host surface beyond its crossing instead of reading an open end outside its domain.
   * @evidence contracts/common.md#clear-and-simple-design Converts the trunk's anatomical view record into the shared body view builder; the optional pole is an internal closure point owned by the head/trunk connection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The pole has no person selector or fitted position; its caller derives it from the neck section and the head's defining axis. Malformed sites and a closure outside its station order produce diagnostics.
   * @evidence contracts/common.md#meaningful-documentation States the anatomical/chart mapping, source of the hidden pole, standalone open-end behavior and failure publication.
   * @evidence contracts/performance.md#efficient-algorithms Converts each of n sites once and adds at most one axis knot; the shared operator owns loft generation and its sampling cost.
   * @evidence contracts/performance.md#reuse-equivalent-work The same converted view record is the operator input and the tree input through SiteViewPart, so no second geometric definition owns the cap.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned view and loft belong to this call's result; the conversion retains no cache or host resource.
   */
  export function create(views: IAutoMovieHumanTrunkViews, top?: ITop): IResult {
    // A site whose back stands at or before its front has no depth, and one
    // at or under the perineum no place above the pole.
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    if (views.sites.length < 2)
      diagnostics.push({ producer: `view.${NAME}`, level: 2, contract: "sites", detail: "the trunk needs at least two sites above its perineum" });
    for (const s of views.sites)
      if (!(s.front > s.back) || !(s.y > views.perineum.y))
        diagnostics.push({ producer: `view.${NAME}`, level: 2, contract: "sites", detail: `site ${s.site} at ${s.y} mm: front ${s.front} mm over back ${s.back} mm, perineum at ${views.perineum.y} mm` });
    if (diagnostics.length !== 0) return { part: null, loft: null, view: null, diagnostics };

    const last: IAutoMovieHumanTrunkViews.ISite = views.sites[views.sites.length - 1]!;
    if (top !== undefined && (!(top.y > last.y) || !Number.isFinite(top.y) || !Number.isFinite(top.x)))
      return {
        part: null,
        loft: null,
        view: null,
        diagnostics: [{ producer: `view.${NAME}`, level: 2, contract: "top closure", detail: `top [${top.x}, ${top.y}] mm must be finite and above the last neck site at ${last.y} mm` }],
      };

    return AutoMovieHumanSiteViewPart.create({
      name: NAME,
      axis: level([
        { site: "perineum", y: views.perineum.y, x: views.perineum.x },
        ...views.sites.map((s: IAutoMovieHumanTrunkViews.ISite): { site: string; y: number; x: number } => ({ site: s.site, y: s.y, x: (s.front + s.back) / 2 })),
        ...(top === undefined ? [] : [{ site: "top pole", y: top.y, x: top.x }]),
      ]),
      sites: views.sites.map((s: IAutoMovieHumanTrunkViews.ISite): AutoMovieHumanSiteViewPart.ISite => {
        const depth: number = (s.front - s.back) / 2;
        return { site: s.site, station: s.y, edges: [depth, s.half, -depth, -s.half], fullness: s.fullness };
      }),
      pole: top === undefined ? { end: "bottom", station: views.perineum.y } : { end: "both", bottom: views.perineum.y, top: top.y },
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
