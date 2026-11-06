import {
  type AutoMovieLoftContract,
  AutoMovieViewParameter,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanTrunkAxis } from "./AutoMovieHumanTrunkAxis";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * The trunk base as a part lofted from its own views (campaign #3044,
 * construction step 1; #3047): the chain `trunk` from the perineum's pole to
 * the neck, every station a level section that touches
 * the box of the front view's half breadth and the side view's two profiles.
 *
 * Views to the kernel's chart. The planes are level. TrunkAxis adds the
 * actual back and AP radius in their common root/angle source parameter,
 * retaining both jets at their combined knots; world Y stays physical height.
 * `u` forward and `v` left, so the kernel's `front` pair (the extremes along
 * `u`) is the anatomical side view and its `side` pair (along `v`) the
 * anatomical front view. Every edge is given relative to the axis's origin,
 * the mid-depth `c = (front + back) / 2` at each named site: its profiles become
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
 * With that internal cap, signed scalar hull ranges keep opposite outlines
 * apart on the entire closed span. Its top source tangent is the secant from
 * the last neck radius to the pole in the shared angle parameter, with zero
 * second parameter derivative. It is nonzero; a range filter must not flatten
 * a wrong-way pole tangent to zero. Physical station derivatives remain
 * singular there, and this source condition is not a final-surface G2 proof.
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
   * @evidence contracts/common.md#principled-implementation Named values and the derived pole/axis remain fixed. Signed scalar hulls author noncrossing closed-span edges; the top secant and zero second derivative are normalized angle jets, not finite physical-station jets. This supplies an internal cap without certifying final-surface G2.
   * @evidence contracts/common.md#clear-and-simple-design Converts the trunk's anatomical view record into the shared body view builder; the optional pole is an internal closure point owned by the head/trunk connection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The pole has no person selector or fitted position; its caller derives it from the neck section and the head's defining axis. Malformed sites and a closure outside its station order produce diagnostics.
   * @evidence contracts/common.md#meaningful-documentation States the anatomical/chart mapping, source of the hidden pole, standalone open-end behavior and failure publication.
   * @evidence contracts/performance.md#efficient-algorithms Converts n named sites and m retained back rows into shared scalar declarations. TrunkAxis prepares and combines their common partition with O((n+m) squared) small-list identity scans; the shared operator owns loft generation and sampling cost.
   * @evidence contracts/performance.md#reuse-equivalent-work The same converted view record is the operator input and the tree input through SiteViewPart, so no second geometric definition owns the cap.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned view and loft belong to this call's result; the conversion retains no cache or host resource.
   */
  export function create(
    views: IAutoMovieHumanTrunkViews,
    top?: ITop,
  ): IResult {
    // A site whose back stands at or before its front has no depth, and one
    // at or under the perineum no place above the pole.
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    if (views.sites.length < 2)
      diagnostics.push({
        producer: `view.${NAME}`,
        level: 2,
        contract: "sites",
        detail: "the trunk needs at least two sites above its perineum",
      });
    for (const s of views.sites)
      if (!(s.front > s.back) || !(s.y > views.perineum.y))
        diagnostics.push({
          producer: `view.${NAME}`,
          level: 2,
          contract: "sites",
          detail: `site ${s.site} at ${s.y} mm: front ${s.front} mm over back ${s.back} mm, perineum at ${views.perineum.y} mm`,
        });
    if (diagnostics.length !== 0)
      return { part: null, loft: null, view: null, diagnostics };

    const last: IAutoMovieHumanTrunkViews.ISite =
      views.sites[views.sites.length - 1]!;
    if (
      top !== undefined &&
      (!(top.y > last.y) || !Number.isFinite(top.y) || !Number.isFinite(top.x))
    )
      return {
        part: null,
        loft: null,
        view: null,
        diagnostics: [
          {
            producer: `view.${NAME}`,
            level: 2,
            contract: "top closure",
            detail: `top [${top.x}, ${top.y}] mm must be finite and above the last neck site at ${last.y} mm`,
          },
        ],
      };

    // The hidden cap's nonzero tangent is authored in normalized angle tau.
    // The shared map owns theta; no physical station jet is fabricated at a pole.
    let poleJets: AutoMovieHumanSiteViewPart.IInput["poleJets"] = undefined;
    if (top !== undefined) {
      const theta: number = AutoMovieViewParameter.at(
        { type: "angle", bottom: views.perineum.y, top: top.y },
        last.y,
      );
      const secant: number = -Math.PI / (Math.PI - theta);
      const depth: number = (last.front - last.back) / 2;
      const jet = (edge: number): IAutoMovieViewPart.IKnot["jet"] => ({
        first: edge * secant,
        second: 0,
      });
      poleJets = {
        top: [jet(depth), jet(last.half), jet(-depth), jet(-last.half)],
      };
    }

    const definition: Pick<
      AutoMovieHumanSiteViewPart.IInput,
      "sites" | "pole" | "poleJets" | "ranges"
    > = {
      sites: views.sites.map(
        (
          s: IAutoMovieHumanTrunkViews.ISite,
        ): AutoMovieHumanSiteViewPart.ISite => {
          const depth: number = (s.front - s.back) / 2;
          return {
            site: s.site,
            station: s.y,
            edges: [depth, s.half, -depth, -s.half],
            fullness: s.fullness,
          };
        },
      ),
      pole:
        top === undefined
          ? { end: "bottom", station: views.perineum.y }
          : { end: "both", bottom: views.perineum.y, top: top.y },
      ...(top === undefined
        ? {}
        : {
            poleJets,
            ranges: [
              { minimum: 0, maximum: null },
              { minimum: 0, maximum: null },
              { minimum: null, maximum: 0 },
              { minimum: null, maximum: 0 },
            ] as NonNullable<AutoMovieHumanSiteViewPart.IInput["ranges"]>,
          }),
    };
    const back: IAutoMovieViewPart.IOutline = {
      knots: [
        {
          site: "perineum",
          station: views.perineum.y,
          value: views.perineum.x,
        },
        ...views.sites.map(
          (s: IAutoMovieHumanTrunkViews.ISite): IAutoMovieViewPart.IKnot => ({
            site: s.site,
            station: s.y,
            value: s.back,
          }),
        ),
        ...(top === undefined
          ? []
          : [{ site: "top pole", station: top.y, value: top.x }]),
        ...(views.backProfile ?? []).map(
          (
            s: NonNullable<IAutoMovieHumanTrunkViews["backProfile"]>[number],
          ): IAutoMovieViewPart.IKnot => ({
            site: s.site,
            station: s.y,
            value: s.back,
          }),
        ),
      ].sort(
        (a: IAutoMovieViewPart.IKnot, b: IAutoMovieViewPart.IKnot): number =>
          a.station - b.station,
      ),
    };
    const axis: AutoMovieHumanTrunkAxis.IResult | string =
      AutoMovieHumanTrunkAxis.create(
        back,
        AutoMovieHumanSiteViewPart.outline(definition, 0),
        {
          bottom: views.perineum.y,
          ...(top === undefined ? {} : { top: top.y }),
        },
      );
    if (typeof axis === "string")
      return {
        part: null,
        loft: null,
        view: null,
        diagnostics: [
          {
            producer: `view.${NAME}`,
            level: 2,
            contract: "world back source",
            detail: axis,
          },
        ],
      };
    return AutoMovieHumanSiteViewPart.create({
      name: NAME,
      axis: axis.axis,
      ...definition,
      order: ORDER,
      samples: SAMPLES,
      gap: GAP,
    });
  }
}
