import type { AutoMovieHumanSolidVector } from "../../lofting/AutoMovieHumanSolidVector";
import { AutoMovieHumanViewAxis } from "../../lofting/AutoMovieHumanViewAxis";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";

type Vec3 = AutoMovieHumanSolidVector.Vec3;

/**
 * One foot's body as a part lofted from its views (#3049): straight along the
 * foot's long axis on the floor, its sections the vertical planes square to
 * that axis, closed by a G2 dome at the heel (pternion) and at the forefoot's
 * distal cap past the metatarsal heads, which the toes merge onto and whose
 * skin between them is the webs' blends.
 *
 * Views. The top view (the sole's outline) gives each site's lateral and
 * medial edges; the side view the dorsum above and the plantar edge below.
 * The axis stands at the caller's height over the floor (a height inside every
 * site's box), so a site's lower edge is minus that height where the sole
 * bears on the floor and the sole stands on the floor by construction; the
 * medial arch is the plantar-medial quarter's own shoulder, a sourced
 * departure, never a lifted edge.
 *
 * Sites: the caller's laws by name at their shares of the foot's length from
 * pternion (the heel's breadth, the ankle's front under the malleoli, the
 * instep, the ball at the metatarsal heads with the foot's breadth, the
 * forefoot's end), each with its box and its owner (a tape where one is an
 * input, a sourced shoulder elsewhere). The shank's walk merges onto this
 * part from above (the leg is the part, the foot the host).
 */
export namespace AutoMovieHumanFootPart {
  /** One site's law, calibration mm. */
  export interface ISiteLaw {
    /** Share of the foot's length from pternion, in `(0, 1)`. */
    share: number;

    /** The box's edges from the axis: up (dorsal), lateral, down (plantar, negative), medial (negative), on either foot. */
    edges: [number, number, number, number];

    /** A tape solved on the box, or a sourced shoulder. */
    fullness: AutoMovieHumanSiteViewPart.ISite["fullness"];
  }

  /** What a foot is built from. */
  export interface IInput {
    /** Chain name, `foot.left` or `foot.right`. */
    name: string;

    /** Pternion's plan point on the floor, `[x, 0, z]`, calibration mm. */
    heel: Vec3;

    /** The foot's long axis on the floor, unit and level (its y zero), from the heel toward the toes. */
    along: Vec3;

    /** The axis's height over the floor, mm. */
    height: number;

    /** Foot length, mm: pternion to the longest toe's tip. */
    length: number;

    /** Where the heel's dome closes (a small share behind the first site) and where the forefoot's does, as shares of the length. */
    poles: [number, number];

    /** The sites' laws, by rising share. */
    sites: { site: string; law: ISiteLaw }[];

    /** Whether the foot is the left (its lateral edge toward +Z) or the right. */
    side: "left" | "right";

    /** Control points and ring phases of every section, a multiple of 4. */
    order: number;

    /** Widest spacing between layers, mm. */
    gap: number;
  }

  /**
   * Build and loft the foot.
   *
   * @param input The heel, the axis, the length, the poles and the sites.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(input: IInput): AutoMovieHumanSiteViewPart.IResult {
    // The chart: u up and v = up x along, so the stations advance along
    // v x u = along (`AutoMovieHumanViewAxis.straight`). With the toes
    // forward v points to the body's right: medial on the left foot, lateral
    // on the right. The laws give the left foot's edges as up, lateral, down,
    // medial, so the left foot's side edges swap into the chart and the
    // right's, its reflection (J6), stand as given.
    const up: Vec3 = [0, 1, 0];
    const v: Vec3 = [input.along[2], 0, -input.along[0]];
    const origin: Vec3 = [input.heel[0], input.height, input.heel[2]];
    const swap = (e: [number, number, number, number]): [number, number, number, number] => (input.side === "right" ? e : [e[0], -e[3], e[2], -e[1]]);
    return AutoMovieHumanSiteViewPart.create({
      name: input.name,
      axis: AutoMovieHumanViewAxis.straight(origin, up, v),
      sites: input.sites.map((s: { site: string; law: ISiteLaw }): AutoMovieHumanSiteViewPart.ISite => ({
        site: s.site,
        station: s.law.share * input.length,
        edges: swap(s.law.edges),
        fullness: s.law.fullness,
      })),
      pole: { end: "both", bottom: input.poles[0] * input.length, top: input.poles[1] * input.length },
      order: input.order,
      samples: input.order,
      gap: input.gap,
    });
  }
}
