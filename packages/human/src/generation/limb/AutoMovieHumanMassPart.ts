import { AutoMovieSolidVector, type IAutoMovieSolidSurface } from "@automovie/engine";
import { AutoMovieHumanConstructionView } from "./AutoMovieHumanConstructionView";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";

type Vec3 = AutoMovieSolidVector.Vec3;
const { add, cross, dot, scale, sub, unit } = AutoMovieSolidVector;

/**
 * A mass that rises from its host along the host's outward normal (a breast
 * on the chest wall, a gluteal mass on the pelvis, the patella on the knee,
 * the olecranon on the elbow), lofted as a straight part in its own frame and
 * merged onto the host by a fold join of the body's tree (`AutoMovieHumanBodyTree`), so the fold under it (the
 * inframammary fold, the gluteal fold) is the merge's blend (#3044,
 * construction step 2; #3047, #3048, #3050).
 *
 * Frame. The axis stands at the mass's centre on the host (a host chart point
 * the caller places from landmarks), along the host's outward normal there;
 * `u` is the caller's up direction (the body's +Y for the trunk's masses)
 * made square to the normal and `v = u x n`, so the straight axis's stations,
 * which advance along `v x u`, run out along `n`. The kernel's `front` pair is
 * the footprint's upper and lower edges and its `side` pair the lateral and
 * medial edges, `+v` taking whichever of the two the caller's lateral
 * direction leans to: `v` turns from one side to the other with the normal (a
 * breast's faces forward, a gluteal mass's back), so the side is read off the
 * frame, never fixed per mass. A caller whose target is the skin's extreme
 * along the depth asks for the normal levelled (`IInput.level`): the finished
 * skin's normal there is level, while the base under it may slope (the
 * sacrum's line under the buttock, the upper chest under the breast).
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
 * away from the footprint's plane by the tilt between its tangent plane and
 * the footprint's (none on an unlevelled axis) plus the sagitta of its circle
 * of curvature,
 * `R - sqrt(R^2 - e^2)` with `R = 1 / kappa`, over a footprint edge `e` with
 * normal curvature `kappa`, read from the host's jet in each edge's
 * direction; an edge reaching past the circle's quarter turn (`e > R`, the
 * host turned away from the footprint's plane) drops by `R`, the most a
 * convex host falls away before its silhouette, so a footprint wide for its
 * host never sinks the part through the host's far side. Each drop is exact
 * for a circle, so the part starts at the largest drop below the centre plus
 * a tenth of the amplitude (the margin that keeps the crossing off the first
 * layer), holding the footprint there, so the curve where the part leaves
 * the host lies on its cylinder below station 0 or on its dome above.
 */
export namespace AutoMovieHumanMassPart {
  /** What a mass is built from. */
  export interface IInput {
    /** Chain name, such as `breast.left`. */
    name: string;

    /** The host. */
    host: IAutoMovieSolidSurface;

    /** The mass's centre on the host, its chart point `[u, v]`. */
    centre: [number, number];

    /** The caller's up direction, made square to the host's normal for the chart's `u`. */
    up: Vec3;

    /**
     * Whether the axis is the host's normal levelled (its vertical component
     * dropped): a mass whose target is the skin's extreme along the depth
     * (the bust point, the buttock's most posterior point) has a level normal
     * there on the finished skin, whatever slope the base has under it.
     * Absent, the axis is the host's normal.
     */
    level?: boolean;

    /** The caller's lateral direction, which picks the side `+v` takes; any vector off the up direction. */
    lateral: Vec3;

    /** Footprint edges from the centre at the host's surface, mm, positive: up, lateral, down and medial. */
    footprint: [number, number, number, number];

    /** Height of the apex over the host's surface, mm, positive. */
    amplitude: number;

    /** The profile law: shares of the amplitude in `(0, 1)` rising, each with the share of every footprint edge (up, lateral, down, medial) left there in `(0, 1]`. */
    profile: { at: number; shares: [number, number, number, number] }[];

    /** The sourced conic shoulder of the sections, or the ellipse's (`AutoMovieViewSection.ELLIPSE`), the least-information conic. */
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
      view: null,
      diagnostics: [{ producer, level: 3, contract: "mass", detail }],
    });

    // The frame at the centre: the axis along the host's outward normal (levelled
    // where the caller asks) and the caller's up.
    const j: IAutoMovieSolidSurface.IJet = input.host.jet(input.centre[0], input.centre[1]);
    const raw: Vec3 | null = unit(cross(j.u, j.v));
    if (raw === null) return fail(`the host's chart degenerates at [${input.centre.join(", ")}]`);
    const normal: Vec3 = scale(raw, input.host.orientation);
    const levelled: Vec3 | null = input.level === true ? unit([normal[0], 0, normal[2]]) : normal;
    if (levelled === null) return fail("the host's normal stands vertical, so it has no level direction");
    const n: Vec3 = levelled;
    const u: Vec3 | null = unit(sub(input.up, scale(n, dot(input.up, n))));
    if (u === null) return fail("the up direction lies along the host's normal");
    const v: Vec3 = cross(u, n);
    const lean: number = dot(v, input.lateral);
    if (lean === 0 || !Number.isFinite(lean)) return fail("the lateral direction lies square to the footprint's plane across");
    // Up, lateral, down, medial as the chart's +u, +v, -u, -v.
    const chart = (e: readonly [number, number, number, number]): [number, number, number, number] => (lean > 0 ? [e[0], e[1], e[2], e[3]] : [e[0], e[3], e[2], e[1]]);
    const footprint: [number, number, number, number] = chart(input.footprint);
    if (!(input.amplitude > 0) || !input.footprint.every((e: number): boolean => e > 0)) return fail(`amplitude ${input.amplitude} mm, footprint [${input.footprint.join(", ")}] mm`);
    for (let k: number = 0; k < input.profile.length; k++) {
      const p: IInput["profile"][number] = input.profile[k]!;
      if (!(p.at > 0 && p.at < 1) || (k > 0 && !(p.at > input.profile[k - 1]!.at)) || !p.shares.every((s: number): boolean => s > 0 && s <= 1))
        return fail(`profile knot ${k} at share ${p.at} with shares [${p.shares.join(", ")}]`);
    }

    // The host's drop under the footprint's plane over each footprint edge:
    // the tilt of the host's tangent plane against the footprint's (the host
    // at `e d + h n` with `(e d + h n) . N = 0`, so it lies `e (d . N) / (n . N)`
    // under the plane, `N` the host's normal, nothing where it rises above)
    // plus its circle of curvature in that edge's direction: the direction's
    // chart components (a, b) solve the first fundamental form
    // [[E, F], [F, G]] (a, b) = (d . S_u, d . S_v), and
    // kappa = N . S_dd / |S_d|^2 along it.
    const facing: number = dot(n, normal);
    if (!(facing > 0)) return fail("the axis turns away from the host's outward side");
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
        const kappa: number = length2 > 0 ? Math.abs(dot(normal, second)) / length2 : 0;
        const tilt: number = Math.max(0, (footprint[q]! * dot(d, normal)) / facing);
        if (!(kappa > 0)) return tilt;
        const R: number = 1 / kappa;
        const e: number = Math.min(footprint[q]!, R);
        return tilt + R - Math.sqrt(R * R - e * e);
      }),
    );
    const embed: number = sagitta + input.amplitude / 10;

    // Sites: the footprint held from inside the host to its surface, then the
    // profile's knots, then the apex's pole.
    const edges = (given: [number, number, number, number]): [number, number, number, number] => {
      const shares: [number, number, number, number] = chart(given);
      return [
        footprint[0] * shares[0],
        footprint[1] * shares[1],
        -footprint[2] * shares[2],
        -footprint[3] * shares[3],
      ];
    };
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
      axis: { type: "straight", origin: AutoMovieHumanConstructionView.point(sub(j.p, scale(n, embed))), u: AutoMovieHumanConstructionView.direction(u), v: AutoMovieHumanConstructionView.direction(v) },
      sites,
      pole: { end: "top", station: embed + input.amplitude },
      order: input.order,
      samples: input.samples,
      gap: input.gap,
    });
  }
}
