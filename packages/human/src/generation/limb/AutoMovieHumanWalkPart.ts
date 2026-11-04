import type { AutoMovieHumanSolidVector } from "../../lofting/AutoMovieHumanSolidVector";
import { AutoMovieHumanJointedAxis } from "./AutoMovieHumanJointedAxis";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";

type Vec3 = AutoMovieHumanSolidVector.Vec3;

/**
 * A part lofted as one walk over a bone chain (a digit over its phalanges, a
 * toe, the arm and palm, the leg): the jointed axis on the chain's joint
 * centres (`AutoMovieHumanJointedAxis`) and the site knots along it
 * (`AutoMovieHumanSiteViewPart`), each site placed on a bone by its share
 * from that bone's proximal centre, so a landmark is a share of its own bone
 * and moves with that bone alone.
 *
 * Ends. The walk's first centre is its proximal end, inside the host it
 * merges onto (the palm, the forefoot, the trunk), where the part stays open
 * because the merge trims it; the distal end is either open (continued by the
 * next part's merge) or closed by a G2 dome at the tip
 * (`IAutoMovieHumanViewPart.pole`, the zero knots the operator requires), the
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
    joints: AutoMovieHumanJointedAxis.IJoint[];

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

    // A tip continues the last bone straight: its centre is one more knot
    // of the axis, joined to the last bone with no turn.
    const last: Vec3 = input.centres[input.centres.length - 1]!;
    const before: Vec3 = input.centres[input.centres.length - 2]!;
    const length: number = Math.hypot(last[0] - before[0], last[1] - before[1], last[2] - before[2]);
    const axis: AutoMovieHumanJointedAxis.IAxis | null = AutoMovieHumanJointedAxis.create({ centres: input.centres, joints: input.joints, u: input.u });
    if (axis === null || !(length > 0))
      return { part: null, loft: null, diagnostics: [{ producer, level: 2, contract: "axis", detail: `the chain of ${input.centres.length} centres and ${input.joints.length} joints makes no axis` }] };

    // Each site's station from its bone and share.
    const sites: AutoMovieHumanSiteViewPart.ISite[] = input.sites.map((s: ISite): AutoMovieHumanSiteViewPart.ISite => {
      const from: number = axis.stations[s.bone]!;
      const to: number = axis.stations[s.bone + 1]!;
      return { site: s.site, station: from + s.share * (to - from), edges: s.edges, fullness: s.fullness };
    });
    const end: number = axis.stations[axis.stations.length - 1]!;
    return AutoMovieHumanSiteViewPart.create({
      name: input.name,
      axis,
      sites,
      ...pole(input, end),
      order: input.order,
      samples: input.samples,
      gap: input.gap,
    });
  }

  /**
   * The walk's closing domes: at the first centre (station 0) for a base
   * inside its host, at the tip past the last centre, or both.
   *
   * @param input The walk.
   * @param end The last centre's station, mm.
   * @returns The site part's pole, or nothing for two open ends.
   */
  function pole(input: IInput, end: number): Pick<AutoMovieHumanSiteViewPart.IInput, "pole"> {
    if (input.base === true && input.tip !== undefined) return { pole: { end: "both", bottom: 0, top: end + input.tip } };
    if (input.base === true) return { pole: { end: "bottom", station: 0 } };
    if (input.tip !== undefined) return { pole: { end: "top", station: end + input.tip } };
    return {};
  }
}
