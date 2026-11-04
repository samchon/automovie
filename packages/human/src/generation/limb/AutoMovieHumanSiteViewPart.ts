import { type AutoMovieLoftContract, type AutoMovieViewAxis, AutoMovieViewLoft, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

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
 * knot and the outline is C2 between.
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
  }

  /** What a part is built from. */
  export interface IInput {
    /** Chain name of the part. */
    name: string;

    /** The part's axis. */
    axis: AutoMovieViewAxis.IAxis;

    /** The sites by strictly rising station, at least two besides a pole. */
    sites: ISite[];

    /** Closing points, each a G2 dome where every edge meets the axis: the station below the first site (`bottom`), above the last (`top`), or both (the foot's heel and forefoot cap). Absent, both ends are open sections. */
    pole?: { end: "bottom" | "top"; station: number } | { end: "both"; bottom: number; top: number };

    /** Sourced departures of each quarter's shoulder, knots by station; absent means none. */
    departures?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;

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

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
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
      return { part: null, loft: null, diagnostics };
    };

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
    const edge = (q: 0 | 1 | 2 | 3): IAutoMovieViewPart.IOutline => knots((s: ISite): number => s.edges[q], 0, 0);
    const stationList: number[] = sites.map((s: ISite): number => s.station);
    if (bottom !== null) stationList.unshift(bottom);
    if (top !== null) stationList.push(top);
    const part: IAutoMovieViewPart = {
      name: input.name,
      axis: input.axis,
      stations: subdivide(stationList, input.gap),
      front: { positive: edge(0), negative: edge(2) },
      side: { positive: edge(1), negative: edge(3) },
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
    return { part, loft, diagnostics };
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
