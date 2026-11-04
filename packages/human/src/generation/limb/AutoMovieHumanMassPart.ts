import { AutoMovieHumanSolidVector } from "../../lofting/AutoMovieHumanSolidVector";
import { AutoMovieHumanViewAxis } from "../../lofting/AutoMovieHumanViewAxis";
import type { IAutoMovieHumanSolidSurface } from "../../lofting/IAutoMovieHumanSolidSurface";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";

type Vec3 = AutoMovieHumanSolidVector.Vec3;
const { add, cross, dot, scale, sub, unit } = AutoMovieHumanSolidVector;

/**
 * A mass that rises from its host along the host's outward normal (a breast
 * on the chest wall, a gluteal mass on the pelvis, the patella on the knee,
 * the olecranon on the elbow), lofted as a straight part in its own frame and
 * merged onto the host by `AutoMovieHumanFoldJoin`, so the fold under it (the
 * inframammary fold, the gluteal fold) is the merge's blend (#3044,
 * construction step 2; #3047, #3048, #3050).
 *
 * Frame. The axis stands at the mass's centre on the host (a host chart point
 * the caller places from landmarks), along the host's outward normal there;
 * `u` is the caller's up direction (the body's +Y for the trunk's masses)
 * made square to the normal, `v = n x u`, so the kernel's `front` pair is the
 * footprint's upper and lower edges and its `side` pair its two lateral edges
 * in the caller's naming.
 *
 * Views. The footprint is the box at the host's surface (station 0): four
 * edges from the centre, each a law of the caller's (the breast's from the
 * inframammary fold, the second rib, the sternal edge and the anterior
 * axillary line). The profile is the share of each edge left at each share of
 * the amplitude, one knot per station of the caller's profile law, down to the
 * apex's pole at the amplitude. The amplitude is an outline difference from
 * inputs (the chest's depth less the chest wall's, the buttock's less the
 * waist's), so no measure is counted twice.
 *
 * Embedding. The part starts inside its host so that every phase's station
 * line crosses the host within the part's layers: the host's surface falls
 * away from the tangent plane by its sagitta `kappa e^2 / 2` over a footprint
 * edge `e` with normal curvature `kappa`, read from the host's jet in each
 * edge's direction; the part starts at twice the largest sagitta below the
 * centre (and never less than a tenth of the amplitude), holding the
 * footprint there, so the curve where the part leaves the host lies on its
 * cylinder below station 0 or on its dome above.
 */
export namespace AutoMovieHumanMassPart {
  /** What a mass is built from. */
  export interface IInput {
    /** Chain name, such as `breast.left`. */
    name: string;

    /** The host. */
    host: IAutoMovieHumanSolidSurface;

    /** The mass's centre on the host, its chart point `[u, v]`. */
    centre: [number, number];

    /** The caller's up direction, made square to the host's normal for the chart's `u`. */
    up: Vec3;

    /** Footprint edges from the centre at the host's surface, mm, positive: along `+u`, `+v`, `-u`, `-v`. */
    footprint: [number, number, number, number];

    /** Height of the apex over the host's surface, mm, positive. */
    amplitude: number;

    /** The profile law: shares of the amplitude in `(0, 1)` rising, each with the share of every footprint edge left there in `(0, 1]`. */
    profile: { at: number; shares: [number, number, number, number] }[];

    /** The sourced conic shoulder of the sections, or the ellipse's (`AutoMovieHumanViewSection.ELLIPSE`), the least-information conic. */
    shoulder: number;

    /** Control points of every section, a multiple of 4. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;

    /** Widest spacing between layers, mm. */
    gap: number;
  }

  /**
   * Build the mass.
   *
   * @param input The host, the centre, the footprint, the amplitude and the profile.
   * @returns The part, its loft and the diagnostics; a degenerate host normal or a malformed profile gives none.
   */
  export function create(input: IInput): AutoMovieHumanSiteViewPart.IResult {
    const producer: string = `mass.${input.name}`;
    const fail = (detail: string): AutoMovieHumanSiteViewPart.IResult => ({
      part: null,
      loft: null,
      diagnostics: [{ producer, level: 3, contract: "mass", detail }],
    });

    // The frame at the centre: the host's outward normal and the caller's up.
    const j: IAutoMovieHumanSolidSurface.IJet = input.host.jet(input.centre[0], input.centre[1]);
    const raw: Vec3 | null = unit(cross(j.u, j.v));
    if (raw === null) return fail(`the host's chart degenerates at [${input.centre.join(", ")}]`);
    const n: Vec3 = scale(raw, input.host.orientation);
    const u: Vec3 | null = unit(sub(input.up, scale(n, dot(input.up, n))));
    if (u === null) return fail("the up direction lies along the host's normal");
    const v: Vec3 = cross(n, u);
    if (!(input.amplitude > 0) || !input.footprint.every((e: number): boolean => e > 0)) return fail(`amplitude ${input.amplitude} mm, footprint [${input.footprint.join(", ")}] mm`);
    for (let k: number = 0; k < input.profile.length; k++) {
      const p: IInput["profile"][number] = input.profile[k]!;
      if (!(p.at > 0 && p.at < 1) || (k > 0 && !(p.at > input.profile[k - 1]!.at)) || !p.shares.every((s: number): boolean => s > 0 && s <= 1))
        return fail(`profile knot ${k} at share ${p.at} with shares [${p.shares.join(", ")}]`);
    }

    // The host's sagitta over each footprint edge, by the normal curvature
    // in that edge's direction: the direction's chart components (a, b) solve
    // the first fundamental form [[E, F], [F, G]] (a, b) = (d . S_u, d . S_v),
    // and kappa = n . S_dd / |S_d|^2 along it.
    const E: number = dot(j.u, j.u);
    const F: number = dot(j.u, j.v);
    const G: number = dot(j.v, j.v);
    const det: number = E * G - F * F;
    if (!(det > 0)) return fail(`the host's first fundamental form is singular at [${input.centre.join(", ")}]`);
    const sagitta: number = Math.max(
      ...[u, v, scale(u, -1), scale(v, -1)].map((d: Vec3, q: number): number => {
        const du: number = dot(d, j.u);
        const dv: number = dot(d, j.v);
        const a: number = (G * du - F * dv) / det;
        const b: number = (E * dv - F * du) / det;
        const along: Vec3 = add(scale(j.u, a), scale(j.v, b));
        const second: Vec3 = add(add(scale(j.uu, a * a), scale(j.uv, 2 * a * b)), scale(j.vv, b * b));
        const length2: number = dot(along, along);
        const kappa: number = length2 > 0 ? Math.abs(dot(n, second)) / length2 : 0;
        return (kappa * input.footprint[q]! ** 2) / 2;
      }),
    );
    const embed: number = Math.max(2 * sagitta, input.amplitude / 10);

    // Sites: the footprint held from inside the host to its surface, then the
    // profile's knots, then the apex's pole.
    const edges = (shares: [number, number, number, number]): [number, number, number, number] => [
      input.footprint[0] * shares[0],
      input.footprint[1] * shares[1],
      -input.footprint[2] * shares[2],
      -input.footprint[3] * shares[3],
    ];
    const sites: AutoMovieHumanSiteViewPart.ISite[] = [
      { site: "embedded", station: 0, edges: edges([1, 1, 1, 1]), fullness: { shoulder: input.shoulder } },
      { site: "footprint", station: embed, edges: edges([1, 1, 1, 1]), fullness: { shoulder: input.shoulder } },
      ...input.profile.map(
        (p: IInput["profile"][number], k: number): AutoMovieHumanSiteViewPart.ISite => ({
          site: `profile ${k}`,
          station: embed + p.at * input.amplitude,
          edges: edges(p.shares),
          fullness: { shoulder: input.shoulder },
        }),
      ),
    ];
    return AutoMovieHumanSiteViewPart.create({
      name: input.name,
      axis: AutoMovieHumanViewAxis.straight(sub(j.p, scale(n, embed)), u, v),
      sites,
      pole: { end: "top", station: embed + input.amplitude },
      order: input.order,
      samples: input.samples,
      gap: input.gap,
    });
  }
}
