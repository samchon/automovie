import { type AutoMovieSolidVector, AutoMovieViewAxis } from "@automovie/engine";
import { AutoMovieHumanConstructionView } from "./AutoMovieHumanConstructionView";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";

type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * A part lofted as one walk over a bone chain (a digit over its phalanges, a
 * toe, the arm and palm, the leg): the engine's jointed axis on the chain's
 * joint centres (`IAutoMovieConstructionJointedAxis`, its station the
 * course's arclength) and the site knots along it
 * (`AutoMovieHumanSiteViewPart`), each site placed on a bone by its share
 * from that bone's proximal centre, so a landmark is a share of its own bone
 * and moves with that bone alone.
 *
 * Ends. The walk's first centre is its proximal end, inside the host it
 * merges onto (the palm, the forefoot, the trunk), where the part stays open
 * because the merge trims it; the distal end is either open (continued by the
 * next part's merge) or closed by a G2 dome at the tip
 * (`IAutoMovieViewPart.pole`, the zero knots the operator requires), the
 * tip standing past the last centre by the caller's distance (a fingertip's
 * pulp beyond the distal phalanx's end).
 */
export namespace AutoMovieHumanWalkPart {
  /** One site on a bone. */
  export interface ISite {
    /** The measurement site, named in diagnostics. */
    site: string;

    /** The bone, 0 the first (proximal). */
    bone: number;

    /** Share of that bone from its proximal centre, in `[0, 1]`. */
    share: number;

    /** The box's edges `[+u, +v, -u, -v]` relative to the axis, mm (`AutoMovieHumanSiteViewPart.ISite.edges`). */
    edges: [number, number, number, number];

    /** A tape solved on the site's box, or a sourced shoulder. */
    fullness: AutoMovieHumanSiteViewPart.ISite["fullness"];
  }

  /** What a walk part is built from. */
  export interface IInput {
    /** Chain name. */
    name: string;

    /** The joint centres, proximal first, at least two (one bone). */
    centres: Vec3[];

    /** Each interior joint's turn half length, mm: its skin depth. */
    joints: { half: number }[];

    /** The chart's `u` on the first bone (dorsal on a digit, anterior on a limb). */
    u: Vec3;

    /** The sites, by rising place along the walk. */
    sites: ISite[];

    /**
     * Whether the walk closes at its first centre in a G2 dome: the base of a
     * part whose inner end lies inside its host (a limb in the trunk, a digit
     * in the palm), so its station lines start inside the host at every phase
     * and leave it once, as the merge's trace needs. No site may stand at the
     * first centre then. Absent, the base is an open section.
     */
    base?: boolean;

    /** The tip's distance past the last centre, mm (zero closes at the last centre itself), where the walk closes in a dome; absent, the distal end is open. */
    tip?: number;

    /** Control points of every section, a multiple of 4. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;

    /** Widest spacing between layers, mm. */
    gap: number;
  }

  /**
   * Build and loft the walk.
   *
   * @param input The centres, joints, sites and tip.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(input: IInput): AutoMovieHumanSiteViewPart.IResult {
    const producer: string = `walk.${input.name}`;

    const fail = (detail: string): AutoMovieHumanSiteViewPart.IResult => ({ part: null, loft: null, view: null, diagnostics: [{ producer, level: 2, contract: "axis", detail }] });

    // A tip continues the last bone straight: its point is one more centre,
    // joined to the last bone with no turn over a quarter of the shorter of
    // the two (a straight joint sets back by its half length, which must stay
    // inside both segments).
    const last: Vec3 = input.centres[input.centres.length - 1]!;
    const before: Vec3 = input.centres[input.centres.length - 2]!;
    const length: number = Math.hypot(last[0] - before[0], last[1] - before[1], last[2] - before[2]);
    if (!(length > 0)) return fail(`the last bone of ${input.centres.length} centres has no length`);
    const tip: number = input.tip ?? 0;
    const centres: Vec3[] = tip > 0 ? [...input.centres, [0, 1, 2].map((c: number): number => last[c]! + ((last[c]! - before[c]!) * tip) / length) as Vec3] : [...input.centres];
    const halves: number[] = [...input.joints.map((j: { half: number }): number => j.half), ...(tip > 0 ? [Math.min(tip, length) / 4] : [])];
    const runs: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(centres, halves);
    if (typeof runs === "string") return fail(runs);

    // Each site's station from its bone and share, then its edges in the
    // engine's chart.
    const sites: AutoMovieHumanSiteViewPart.ISite[] = input.sites.map(
      (s: ISite): AutoMovieHumanSiteViewPart.ISite => ({ site: s.site, station: station(centres, runs, s.bone, s.share), edges: engine(s.edges), fullness: s.fullness }),
    );
    const end: number = runs[input.centres.length - 2]!.end;
    return AutoMovieHumanSiteViewPart.create({
      name: input.name,
      axis: {
        type: "jointed",
        centres: centres.map(AutoMovieHumanConstructionView.point),
        halves: halves.map((h: number): number => h * AutoMovieHumanConstructionView.METRES),
        up: AutoMovieHumanConstructionView.direction(input.u),
      },
      sites,
      ...pole(input, tip > 0 ? runs[runs.length - 1]!.end : end),
      order: input.order,
      samples: input.samples,
      gap: input.gap,
    });
  }

  /**
   * Station adapter: the station of the point a share along a bone, on the
   * engine's jointed course (`AutoMovieViewAxis.runs`). On the bone's straight
   * run it is the run's own station; inside a turn, where the course cuts the
   * corner and no station lies on the bone's line, it is read linearly in the
   * distance along the bones between the turn's two run ends, so the stations
   * keep the bones' order and meet the runs at both ends of the turn.
   *
   * @param centres The course's centres, mm.
   * @param runs Each segment's straight run.
   * @param bone The bone, 0 the first.
   * @param share The share along it from its proximal centre.
   * @returns The station, mm.
   */
  function station(centres: readonly Vec3[], runs: readonly AutoMovieViewAxis.IRun[], bone: number, share: number): number {
    const span = (i: number): number => {
      const a: Vec3 = centres[i]!;
      const b: Vec3 = centres[i + 1]!;
      return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    };
    const run: AutoMovieViewAxis.IRun = runs[bone]!;
    const x: number = share * span(bone);
    if (x > run.to && bone + 1 < runs.length) {
      const next: AutoMovieViewAxis.IRun = runs[bone + 1]!;
      return run.end + ((x - run.to) * (next.start - run.end)) / (span(bone) - run.to + next.from);
    }
    if (x < run.from && bone > 0) {
      const previous: AutoMovieViewAxis.IRun = runs[bone - 1]!;
      const back: number = span(bone - 1) - previous.to;
      return previous.end + ((back + x) * (run.start - previous.end)) / (back + run.from);
    }
    return run.start + (x - run.from);
  }

  /**
   * Side adapter: a box given in the walk's chart (`v = t x u`, the laws'
   * and `AutoMovieHumanSegmentChart`'s) as the engine's (`v = u x t`, so its
   * stations advance along `v x u = t`): the side pair swaps and changes sign.
   *
   * @param e The edges `[+u, +v, -u, -v]` in the walk's chart.
   * @returns The edges in the engine's chart.
   */
  function engine(e: readonly [number, number, number, number]): [number, number, number, number] {
    return [e[0], -e[3], e[2], -e[1]];
  }

  /**
   * The walk's closing domes: at the first centre (station 0) for a base
   * inside its host, at the tip past the last centre, or both.
   *
   * @param input The walk.
   * @param top The tip's station, mm: past the last centre by the tip, or the last centre's.
   * @returns The site part's pole, or nothing for two open ends.
   */
  function pole(input: IInput, top: number): Pick<AutoMovieHumanSiteViewPart.IInput, "pole"> {
    if (input.base === true && input.tip !== undefined) return { pole: { end: "both", bottom: 0, top } };
    if (input.base === true) return { pole: { end: "bottom", station: 0 } };
    if (input.tip !== undefined) return { pole: { end: "top", station: top } };
    return {};
  }
}
