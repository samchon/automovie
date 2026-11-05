import { AutoMovieConstructionViews, type AutoMovieLoftContract, type AutoMovieViewAxis, AutoMovieViewLoft, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieConstructionAxis, IAutoMovieConstructionView } from "@automovie/interface";
import { AutoMovieHumanConstructionView } from "./AutoMovieHumanConstructionView";

/**
 * A body part lofted from view knots at named sites: the composition every
 * body part shares between its own laws and the view-to-section operator
 * (`AutoMovieViewLoft`), so the trunk, the limbs and the digits differ
 * only in their axis and their knots.
 *
 * Knots. Each site stands at a station of the part's axis and gives the four
 * edges of the box there as signed chart coordinates relative to the axis
 * (the extremes along `+u`, `+v`, `-u`, `-v`), and what owns the fullness: a
 * taut-tape girth or a sourced conic shoulder. Every outline is the natural
 * cubic spline of its knots (the operator's), so each published measure is a
 * knot and the outline is C2 between. Explicit jets/ranges select the shared
 * C2 quintic owner instead of the default natural cubic.
 *
 * Fullness by ownership. A tape's site gets its common conic shoulder solved
 * on that site's box by the Illinois rule on the taut-tape girth
 * (`AutoMovieViewSection.solve`; a tape outside the box's reach keeps the
 * reach's end with the operator's diagnostic); an untaped site keeps the
 * caller's sourced shoulder. Both become knots of one shoulder outline
 * (`kind: "shoulder"`), so one owner kind runs along the whole part; the
 * caller's sourced quarter departures, if any, ride beside it. A pole's knot
 * repeats its neighbouring site's shoulder, since no owner speaks there and
 * the pole's own station carries no section.
 *
 * Stations. Every site is a layer, so every measure stands on a section of its
 * own; each run between two consecutive sites is cut into the fewest equal
 * intervals no wider than the caller's gap. The caller keeps sites apart:
 * two sites a millimetre apart leave an interval a fraction of its
 * neighbours', which the C2 station rule prints as a ring.
 *
 * Diagnostics, never a throw: sites not strictly rising, a box that does not
 * hold its axis (an edge on the wrong side), a tape no section fits; the
 * operator's own follow.
 */
export namespace AutoMovieHumanSiteViewPart {
  /** One site's knots. */
  export interface ISite {
    /** The measurement site, such as `stylion` or `waist`, named in diagnostics. */
    site: string;

    /** Station along the part's axis, mm. */
    station: number;

    /** The box's edges `[+u, +v, -u, -v]` as signed chart coordinates relative to the axis, mm: the first two above zero, the last two below. */
    edges: [number, number, number, number];

    /** A taut-tape girth (mm) solved on the site's box, or a sourced conic shoulder in `(0, 1)`. */
    fullness: { girth: number } | { shoulder: number };

    /** Optional four edge jets in the whole source's normalized parameter, each with its edge value's units. */
    jets?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>;
  }

  /** What a part is built from. */
  export interface IInput {
    /** Chain name of the part. */
    name: string;

    /** The part's axis as the construction tree's record, metres; the operator's frame is the engine's own reading of it (`AutoMovieConstructionViews.frame`), so the part lofted here is the part the tree realizes. */
    axis: AutoMovieConstructionAxis;

    /** The sites by strictly rising station, at least two besides a pole. */
    sites: ISite[];

    /** Closing points where every edge meets the axis, below the first site (`bottom`), above the last (`top`), or both. The shared root/angle parameter owns endpoint regularity; a closing point alone does not certify a final G2 surface. Absent, both ends are open sections. */
    pole?: { end: "bottom" | "top"; station: number } | { end: "both"; bottom: number; top: number };

    /** Optional closing-knot jets, in the whole source's normalized root/angle parameter and edge-value units. A physical station derivative at a pole remains singular. */
    poleJets?: { bottom?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>; top?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]> };

    /** Sourced departures of each quarter's shoulder, knots by station; absent means none. */
    departures?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;

    /** Optional sufficient scalar bounds for the four closed edge spans; these do not impose a moving world-plane constraint. */
    ranges?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline["range"]>;

    /** Control points of every section, a multiple of 4. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;

    /** Widest spacing between layers, mm. */
    gap: number;
  }

  /** The part and its loft. */
  export interface IResult {
    /** The view part handed to the operator, or null when the knots are malformed. */
    part: IAutoMovieViewPart | null;

    /** The operator's result, or null with the part. */
    loft: AutoMovieViewLoft.IResult | null;

    /** The part as the construction tree's view record, metres, or null with the part. */
    view: IAutoMovieConstructionView | null;

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** An actual named builder result, retained even when part or loft admission failed. */
  export interface ISource {
    /** The requested anatomical name, also available when the result has no part. */
    name: string;
    /** The identical result produced by the source builder; no replacement loft is made. */
    result: IResult;
  }

  /**
   * Build and loft a part from its sites.
   *
   * @param input The axis, the sites, the pole and the sampling.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(input: IInput): IResult {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const producer: string = `view.${input.name}`;
    const fail = (contract: string, detail: string): IResult => {
      diagnostics.push({ producer, level: 2, contract, detail });
      return { part: null, loft: null, view: null, diagnostics };
    };

    const frame: AutoMovieViewAxis.IAxis | string = AutoMovieConstructionViews.frame(input.axis);
    if (typeof frame === "string") return fail("axis", frame);

    // The sites rise, each box holds its axis, and a pole lies beyond them.
    const sites: ISite[] = input.sites;
    if (sites.length < 2) return fail("sites", `${sites.length} sites; a part needs at least two`);
    for (let k: number = 0; k < sites.length; k++) {
      const s: ISite = sites[k]!;
      if (k > 0 && !(s.station > sites[k - 1]!.station)) return fail("sites", `site ${s.site} at ${s.station} mm does not rise above ${sites[k - 1]!.site}`);
      if (!(s.edges[0] > 0 && s.edges[1] > 0 && s.edges[2] < 0 && s.edges[3] < 0)) return fail("sites", `site ${s.site}: edges [${s.edges.join(", ")}] mm do not hold the axis inside the box`);
    }
    // The closing stations, each beyond its end's site.
    const pole: IInput["pole"] = input.pole;
    const bottom: number | null = pole === undefined || pole.end === "top" ? null : pole.end === "both" ? pole.bottom : pole.station;
    const top: number | null = pole === undefined || pole.end === "bottom" ? null : pole.end === "both" ? pole.top : pole.station;
    if ((input.poleJets?.bottom !== undefined && bottom === null) || (input.poleJets?.top !== undefined && top === null)) return fail("pole jets", "closing-knot jets require the corresponding declared pole");
    if (bottom !== null && !(bottom < sites[0]!.station)) return fail("pole", `the bottom pole at ${bottom} mm does not lie below the first site`);
    if (top !== null && !(top > sites[sites.length - 1]!.station)) return fail("pole", `the top pole at ${top} mm does not lie above the last site`);

    // The common shoulder at each site: solved from its tape, or given.
    const shoulders: number[] = [];
    for (const s of sites) {
      if ("shoulder" in s.fullness) {
        shoulders.push(s.fullness.shoulder);
        continue;
      }
      const solved: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(`${producer} ${s.site}`, { extents: [s.edges[0], s.edges[1], -s.edges[2], -s.edges[3]] }, s.fullness.girth);
      diagnostics.push(...solved.diagnostics);
      if (solved.section === null) return fail("fullness", `site ${s.site}: no section fits the tape ${s.fullness.girth} mm`);
      shoulders.push(solved.section.shoulders[0]);
    }

    // Each outline through its sites, each pole's knot at zero (the shoulder
    // repeats its neighbouring site's there).
    const knots = (value: (s: ISite, k: number) => number, atBottom: number, atTop: number): IAutoMovieViewPart.IOutline => {
      const out: IAutoMovieViewPart.IKnot[] = sites.map((s: ISite, k: number): IAutoMovieViewPart.IKnot => ({ site: s.site, station: s.station, value: value(s, k) }));
      if (bottom !== null) out.unshift({ site: "bottom pole", station: bottom, value: atBottom });
      if (top !== null) out.push({ site: "top pole", station: top, value: atTop });
      return { knots: out };
    };
    const stationList: number[] = sites.map((s: ISite): number => s.station);
    if (bottom !== null) stationList.unshift(bottom);
    if (top !== null) stationList.push(top);
    const part: IAutoMovieViewPart = {
      name: input.name,
      axis: frame,
      stations: subdivide(stationList, input.gap),
      front: { positive: outline(input, 0), negative: outline(input, 2) },
      side: { positive: outline(input, 1), negative: outline(input, 3) },
      fullness: {
        kind: "shoulder",
        shoulder: knots((_: ISite, k: number): number => shoulders[k]!, shoulders[0]!, shoulders[shoulders.length - 1]!),
        ...(input.departures !== undefined ? { departures: input.departures } : {}),
      },
      ...(pole !== undefined ? { pole: pole.end } : {}),
      order: input.order,
      samples: input.samples,
    };
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    diagnostics.push(...loft.diagnostics);
    return { part, loft, view: AutoMovieHumanConstructionView.of(part, input.axis), diagnostics };
  }

  /**
   * The identical original edge used by construction and input-dimension
   * solves, before any fullness, section or loft is realized.
   *
   * @evidence contracts/common.md#principled-implementation Copies the same named signed edge, authored jets, scalar range and zero closing knots that create supplies to the shared engine source owner.
   * @evidence contracts/common.md#clear-and-simple-design One edge conversion is shared by actual construction and source-only metric queries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads defining sites only; no final section, sampled polygon or replacement spline supplies an edge.
   * @evidence contracts/common.md#meaningful-documentation Separates original scalar declaration from section/fullness realization and preserves normalized-jet units.
   * @evidence contracts/performance.md#efficient-algorithms Copies n knots and at most two poles in O(n) time and space; it runs no loft or girth solve.
   * @evidence contracts/performance.md#reuse-equivalent-work Both consumers use this owner, so a changed source field cannot silently be dropped by a parallel conversion.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns an owned declaration with no cache or source-result lifetime beyond its caller.
   */
  export function outline(input: Pick<IInput, "sites" | "pole" | "poleJets" | "ranges">, quarter: 0 | 1 | 2 | 3): IAutoMovieViewPart.IOutline {
    const knots: IAutoMovieViewPart.IKnot[] = input.sites.map((site: ISite): IAutoMovieViewPart.IKnot => ({ site: site.site, station: site.station, value: site.edges[quarter], ...(site.jets?.[quarter] === undefined ? {} : { jet: site.jets[quarter] }) }));
    const pole: IInput["pole"] = input.pole;
    if (pole !== undefined && pole.end !== "top") knots.unshift({ site: "bottom pole", station: pole.end === "both" ? pole.bottom : pole.station, value: 0, ...(input.poleJets?.bottom?.[quarter] === undefined ? {} : { jet: input.poleJets.bottom[quarter] }) });
    if (pole !== undefined && pole.end !== "bottom") knots.push({ site: "top pole", station: pole.end === "both" ? pole.top : pole.station, value: 0, ...(input.poleJets?.top?.[quarter] === undefined ? {} : { jet: input.poleJets.top[quarter] }) });
    const range: IAutoMovieViewPart.IOutline["range"] = input.ranges?.[quarter];
    return { knots, ...(range === undefined ? {} : { range }) };
  }

  /**
   * The layer stations: every kept station, and each run between two cut into
   * the fewest equal intervals no wider than the gap.
   *
   * @param kept Strictly rising stations, mm.
   * @param gap Widest interval, mm, positive.
   * @returns Strictly rising stations holding every kept one exactly.
   */
  function subdivide(kept: readonly number[], gap: number): number[] {
    const out: number[] = [kept[0]!];
    for (let k: number = 1; k < kept.length; k++) {
      const a: number = kept[k - 1]!;
      const b: number = kept[k]!;
      const count: number = Math.max(1, Math.ceil((b - a) / gap - 1e-9));
      for (let i: number = 1; i <= count; i++) out.push(i === count ? b : a + ((b - a) * i) / count);
    }
    return out;
  }
}
