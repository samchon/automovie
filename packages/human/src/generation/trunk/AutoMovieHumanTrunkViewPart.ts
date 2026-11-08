import {
  type AutoMovieLoftContract,
  AutoMovieViewParameter,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanTrunkAxis } from "./AutoMovieHumanTrunkAxis";
import { AutoMovieHumanTrunkConnection } from "./AutoMovieHumanTrunkConnection";
import { AutoMovieHumanTrunkSectionFamily } from "./AutoMovieHumanTrunkSectionFamily";
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
 * quarters lands. The head supplies the same upper scalar-support datum as
 * before, preserving the original angle parameter and lower polynomials.
 * A shared neck ends the actual part at its regular connection: the support
 * above that end is not a lofted cap. Signed scalar hull ranges retain the
 * original noncrossing support span. Its upper support tangent is the secant from
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
   * The trunk's retained upper scalar-support datum, on the head axis above
   * the regular connection, in calibration millimetres. A shared connection
   * excludes it from the actual part domain without changing the source clock.
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
   * @param top Optional upper source support. A shared neck restricts the actual part to its regular end; standalone callers can explicitly retain the closure.
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
    return AutoMovieHumanSiteViewPart.loft(define(views, top));
  }

  /** Prepare the identical original outlines, fullness, canonical neck and axis before raw lofting. */
  export function define(
    views: IAutoMovieHumanTrunkViews,
    top?: ITop,
    sections: ReadonlyMap<
      string,
      AutoMovieHumanTrunkSectionFamily.IPlane
    > = AutoMovieHumanTrunkSectionFamily.define(views),
  ): AutoMovieHumanSiteViewPart.IDefinition {
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
      return { part: null, view: null, diagnostics };

    // Candidate shoulders remain candidate-dependent. Independent tape sites
    // retain the same box and solve once for this common original family.
    const fullness: Map<string, { shoulder: number }> = new Map();
    let unavailable: boolean = false;
    for (const site of views.sites) {
      const plane: AutoMovieHumanTrunkSectionFamily.IPlane | undefined =
        sections.get(site.site);
      const depth: number = (site.front - site.back) / 2;
      const extents: readonly number[] = site.sectionBox?.extents ?? [depth, site.half, depth, site.half];
      if (
        plane === undefined ||
        plane.y !== site.y ||
        plane.back !== site.back ||
        plane.origin[0] !== (site.sectionBox === undefined ? (site.front + site.back) / 2 : site.back + extents[2]!) ||
        plane.origin[1] !== 0 ||
        (site.sectionBox !== undefined &&
          (extents[0] !== extents[2] || extents[1] !== site.half || extents[3] !== site.half ||
            site.front !== site.back + (extents[0]! + extents[2]!))) ||
        plane.box.extents.some(
          (extent: number, quarter: number): boolean =>
            extent !== extents[quarter],
        )
      ) {
        diagnostics.push({
          producer: `view.${NAME}`,
          level: 2,
          contract: "original section family",
          detail: `site ${site.site} does not belong to the supplied common plane`,
        });
        unavailable = true;
        continue;
      }
      if ("shoulder" in site.fullness) {
        fullness.set(site.site, site.fullness);
        continue;
      }
      if (
        plane.fullness !== site.fullness &&
        (!("girth" in plane.fullness) ||
          plane.fullness.girth !== site.fullness.girth)
      ) {
        diagnostics.push({
          producer: `view.${NAME}`,
          level: 2,
          contract: "original section family",
          detail: `tape ${site.site} does not belong to the supplied common plane`,
        });
        unavailable = true;
        continue;
      }
      const solved: AutoMovieHumanTrunkSectionFamily.IFullness =
        plane.resolve();
      diagnostics.push(...solved.diagnostics);
      if (solved.fullness === null) unavailable = true;
      else fullness.set(site.site, solved.fullness);
    }
    if (unavailable) return { part: null, view: null, diagnostics };

    const last: IAutoMovieHumanTrunkViews.ISite =
      views.sites[views.sites.length - 1]!;
    if (
      top !== undefined &&
      (!(top.y > last.y) || !Number.isFinite(top.y) || !Number.isFinite(top.x))
    )
      return {
        part: null,
        view: null,
        diagnostics: [
          ...diagnostics,
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
      const jet: (edge: number) => IAutoMovieViewPart.IKnot["jet"] = (
        edge: number,
      ): IAutoMovieViewPart.IKnot["jet"] => ({
        first: edge * secant,
        second: 0,
      });
      poleJets = {
        top: [jet(depth), jet(last.half), jet(-depth), jet(-last.half)],
      };
    }

    const definition: Pick<
      AutoMovieHumanSiteViewPart.IInput,
      "sites" | "pole" | "poleJets" | "ranges" | "fullnessRange"
    > = {
      // Native shoulder values must stay in (0,1) between their named sites.
      // The existing C2 hull law prepares automatic jets here, before the
      // connection transfers those real derivatives into explicit quarters.
      // Positive endpoint values and this closed control hull keep every
      // interior shoulder positive without clamping an evaluated source.
      fullnessRange: { minimum: 0, maximum: 1 },
      sites: views.sites.map(
        (
          s: IAutoMovieHumanTrunkViews.ISite,
        ): AutoMovieHumanSiteViewPart.ISite => {
          const plane: AutoMovieHumanTrunkSectionFamily.IPlane = sections.get(
            s.site,
          )!;
          return {
            site: s.site,
            station: plane.y,
            edges: [
              plane.box.extents[0]!,
              plane.box.extents[1]!,
              -plane.box.extents[2]!,
              -plane.box.extents[3]!,
            ],
            fullness: fullness.get(s.site)!,
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
            value: sections.get(s.site)!.back,
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
        view: null,
        diagnostics: [
          ...diagnostics,
          {
            producer: `view.${NAME}`,
            level: 2,
            contract: "world back source",
            detail: axis,
          },
        ],
      };
    const built: AutoMovieHumanSiteViewPart.IDefinition =
      AutoMovieHumanSiteViewPart.define({
        name: NAME,
        axis: axis.axis,
        ...definition,
        order: ORDER,
        samples: SAMPLES,
        gap: GAP,
      });
    const prepared: AutoMovieHumanSiteViewPart.IDefinition = {
      ...built,
      diagnostics: [...diagnostics, ...built.diagnostics],
    };
    return views.connection === undefined
      ? prepared
      : AutoMovieHumanTrunkConnection.apply(prepared, views.connection);
  }
}
