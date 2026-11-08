import {
  type AutoMovieLoftViewSource,
  AutoMovieLoftViewWorldJet,
  AutoMovieSolidVector,
  type IAutoMovieSolidSurface,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanConstructionView } from "./AutoMovieHumanConstructionView";
import { AutoMovieHumanMassSource } from "./AutoMovieHumanMassSource";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";

type Vec3 = AutoMovieSolidVector.Vec3;
const {
  add,
  cross,
  dot,
  scale,
  sub,
  unit,
}: Pick<
  typeof AutoMovieSolidVector,
  "add" | "cross" | "dot" | "scale" | "sub" | "unit"
> = AutoMovieSolidVector;

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
 * sacrum's line under the buttock, the upper chest under the breast). An
 * explicit original-source frame instead fixes its wall point and axis;
 * the same actual original world jet supplies the retained embedding clock. An anatomical AP
 * extreme can keep its declared Y/Z rather than following the base's oblique
 * normal or a sampled closest point.
 *
 * Views. The footprint is the box at its named wall station, offset from the internal start at station zero: four
 * edges from the centre, each a law of the caller's (the breast's from the
 * inframammary fold, the second rib, the sternal edge and the anterior
 * axillary line). The profile is the share of each edge left at each share of
 * the amplitude, one knot per station of the caller's profile law, down to the
 * apex's pole at the amplitude. The caller owns the distance from the same
 * original wall point to its declared apex. Whole-depth differences at
 * different heights do not independently define that local projection.
 *
 * Embedding. The centre's actual world2 supplies tilt and an osculating-circle
 * sagitta `R - sqrt(R^2 - e^2)`, with `R = 1 / kappa`, on four footprint rays.
 * Clipping e to R and adding one tenth of the amplitude is the retained
 * legacy estimate. It is exact for that circle, not a bound on the entire
 * host, its opposite wall or every phase's crossing. Production reads the
 * same jet directly from the original source, without a raw loft.
 *
 * The named footprint/profile values own the radial source. Explicit C2
 * jets keep each interval between its endpoint values and hold the internal
 * embedded-to-wall footprint, rather than letting a global natural solve
 * inflate it from the external taper. This changes the old interpolated
 * exterior between its preserved named values; it is not exact replay of
 * the analytic bump that supplied those samples.
 *
 * A supplied shared connection owns the actual root and embedding from its
 * whole-parent local chords. MassSource.rebase preserves this declared
 * source when translating its clock. Neither the root mapping nor a held
 * internal footprint proves whole-parent containment, all-phase crossing,
 * exact G2 at a pole or a successful final join.
 */
export namespace AutoMovieHumanMassPart {
  /** What a mass is built from. */
  export interface IInput {
    /** Chain name, such as `breast.left`. */
    name: string;
    /** Actual shared whole-parent root/contact; the old curvature estimate only retains the old exterior clock. */
    connection?: AutoMovieHumanMassSource.IConnection;

    /** Retained standalone host reader; production originals use originalSource instead. */
    host?: IAutoMovieSolidSurface;
    /** Identical original parent and its admitted scalar owner, with declared outward orientation. */
    originalSource?: {
      part: IAutoMovieViewPart;
      source: AutoMovieLoftViewSource.ISource;
      orientation: 1 | -1;
    };

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

    /** Optional original-source wall point in calibration mm and unit anatomical axis. The host jet then supplies embedding curvature only; its sampled position/normal does not move the visible source placement. */
    sourceFrame?: { origin: Vec3; normal: Vec3 };

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

  /** Original mass and its consumed whole-parent connection, before raw lofting. */
  export interface IDefinition extends AutoMovieHumanSiteViewPart.IDefinition {
    /** Actual placement owner; absent only for retained standalone legacy callers. */
    massConnection?: AutoMovieHumanMassSource.IConnection;
  }

  /**
   * Build the mass.
   *
   * @param input The host, the centre, the footprint, the amplitude and the profile.
   * @returns The part, its loft and the diagnostics; a degenerate host normal or a malformed profile gives none.
   */
  export function create(input: IInput): AutoMovieHumanSiteViewPart.IResult {
    return AutoMovieHumanSiteViewPart.loft(define(input));
  }

  /** Prepare the same original scalar/axis/parent definition without drawing a raw mass loft. */
  export function define(input: IInput): IDefinition {
    const producer: string = `mass.${input.name}`;
    const fail: (detail: string) => IDefinition = (
      detail: string,
    ): IDefinition => ({
      part: null,
      view: null,
      diagnostics: [{ producer, level: 3, contract: "mass", detail }],
    });

    // The frame at the centre: the axis along the host's outward normal (levelled
    // where the caller asks) and the caller's up.
    const j: IAutoMovieSolidSurface.IJet | string | undefined =
      input.originalSource === undefined
        ? input.host?.jet(input.centre[0], input.centre[1])
        : AutoMovieLoftViewWorldJet(
            input.originalSource.source,
            input.originalSource.part.axis,
            input.centre[0],
            input.centre[1],
          );
    if (j === undefined || typeof j === "string")
      return fail(
        typeof j === "string"
          ? j
          : "The mass has no actual parent world2 reader",
      );
    const orientation: 1 | -1 | undefined =
      input.originalSource?.orientation ?? input.host?.orientation;
    if (orientation === undefined)
      return fail("The actual parent has no outward chart orientation");
    const raw: Vec3 | null = unit(cross(j.u, j.v));
    if (raw === null)
      return fail(
        `the host's chart degenerates at [${input.centre.join(", ")}]`,
      );
    const normal: Vec3 = scale(raw, orientation);
    const levelled: Vec3 | null =
      input.sourceFrame !== undefined
        ? unit(input.sourceFrame.normal)
        : input.level === true
          ? unit([normal[0], 0, normal[2]])
          : normal;
    if (levelled === null)
      return fail("the requested mass axis has no finite nonzero direction");
    const n: Vec3 = levelled;
    const origin: Vec3 = input.sourceFrame?.origin ?? j.p;
    if (!origin.every(Number.isFinite))
      return fail("the source wall origin is not finite");
    const u: Vec3 | null = unit(sub(input.up, scale(n, dot(input.up, n))));
    if (u === null)
      return fail("the up direction lies along the host's normal");
    const v: Vec3 = cross(u, n);
    const lean: number = dot(v, input.lateral);
    if (lean === 0 || !Number.isFinite(lean))
      return fail(
        "the lateral direction lies square to the footprint's plane across",
      );
    // Up, lateral, down, medial as the chart's +u, +v, -u, -v.
    const chart: (
      e: readonly [number, number, number, number],
    ) => [number, number, number, number] = (
      e: readonly [number, number, number, number],
    ): [number, number, number, number] =>
      lean > 0 ? [e[0], e[1], e[2], e[3]] : [e[0], e[3], e[2], e[1]];
    const footprint: [number, number, number, number] = chart(input.footprint);
    if (
      !(input.amplitude > 0) ||
      !input.footprint.every((e: number): boolean => e > 0)
    )
      return fail(
        `amplitude ${input.amplitude} mm, footprint [${input.footprint.join(", ")}] mm`,
      );
    for (let k: number = 0; k < input.profile.length; k++) {
      const p: IInput["profile"][number] = input.profile[k]!;
      if (
        !(p.at > 0 && p.at < 1) ||
        (k > 0 && !(p.at > input.profile[k - 1]!.at)) ||
        !p.shares.every((s: number): boolean => s > 0 && s <= 1)
      )
        return fail(
          `profile knot ${k} at share ${p.at} with shares [${p.shares.join(", ")}]`,
        );
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
    if (!(facing > 0))
      return fail("the axis turns away from the host's outward side");
    const E: number = dot(j.u, j.u);
    const F: number = dot(j.u, j.v);
    const G: number = dot(j.v, j.v);
    const det: number = E * G - F * F;
    if (!(det > 0))
      return fail(
        `the host's first fundamental form is singular at [${input.centre.join(", ")}]`,
      );
    const sagitta: number = Math.max(
      ...[u, v, scale(u, -1), scale(v, -1)].map(
        (d: Vec3, q: number): number => {
          const du: number = dot(d, j.u);
          const dv: number = dot(d, j.v);
          const a: number = (G * du - F * dv) / det;
          const b: number = (E * dv - F * du) / det;
          const along: Vec3 = add(scale(j.u, a), scale(j.v, b));
          const second: Vec3 = add(
            add(scale(j.uu, a * a), scale(j.uv, 2 * a * b)),
            scale(j.vv, b * b),
          );
          const length2: number = dot(along, along);
          const kappa: number =
            length2 > 0 ? Math.abs(dot(normal, second)) / length2 : 0;
          const tilt: number = Math.max(
            0,
            (footprint[q]! * dot(d, normal)) / facing,
          );
          if (!(kappa > 0)) return tilt;
          const R: number = 1 / kappa;
          const e: number = Math.min(footprint[q]!, R);
          return tilt + R - Math.sqrt(R * R - e * e);
        },
      ),
    );
    const embed: number = sagitta + input.amplitude / 10;

    // The source below explicitly holds this internal footprint. Its named
    // external samples remain independent of the estimated embedding length.
    const edges: (
      given: [number, number, number, number],
    ) => [number, number, number, number] = (
      given: [number, number, number, number],
    ): [number, number, number, number] => {
      const shares: [number, number, number, number] = chart(given);
      return [
        footprint[0] * shares[0],
        footprint[1] * shares[1],
        -footprint[2] * shares[2],
        -footprint[3] * shares[3],
      ];
    };
    const sites: AutoMovieHumanSiteViewPart.ISite[] = [
      {
        site: "embedded",
        station: 0,
        edges: edges([1, 1, 1, 1]),
        fullness: { shoulder: input.shoulder },
      },
      {
        site: "footprint",
        station: embed,
        edges: edges([1, 1, 1, 1]),
        fullness: { shoulder: input.shoulder },
      },
      ...input.profile.map(
        (
          p: IInput["profile"][number],
          k: number,
        ): AutoMovieHumanSiteViewPart.ISite => ({
          site: `profile ${k}`,
          station: embed + p.at * input.amplitude,
          edges: edges(p.shares),
          fullness: { shoulder: input.shoulder },
        }),
      ),
    ];
    const top: number = embed + input.amplitude;
    const poleJets: NonNullable<AutoMovieHumanSiteViewPart.IInput["poleJets"]> =
      radialJets(sites, top);
    const definition: AutoMovieHumanSiteViewPart.IDefinition =
      AutoMovieHumanSiteViewPart.define({
        name: input.name,
        axis: {
          type: "straight",
          origin: AutoMovieHumanConstructionView.point(
            sub(origin, scale(n, embed)),
          ),
          u: AutoMovieHumanConstructionView.direction(u),
          v: AutoMovieHumanConstructionView.direction(v),
        },
        sites,
        pole: { end: "top", station: top },
        poleJets,
        ranges: footprint.map(
          (
            radius: number,
            quarter: number,
          ): IAutoMovieViewPart.IOutline["range"] =>
            quarter < 2
              ? { minimum: 0, maximum: radius }
              : { minimum: -radius, maximum: 0 },
        ) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline["range"]>,
        order: input.order,
        samples: input.samples,
        gap: input.gap,
      });
    try {
      const result: AutoMovieHumanSiteViewPart.IDefinition =
        input.connection === undefined
          ? definition
          : AutoMovieHumanMassSource.rebase(definition, input.connection);
      return result;
    } catch (error: unknown) {
      return fail(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Author C2 radial jets in the same top-root clock as the public source.
   * Embedded and wall knots have the held footprint's exact zero jets.
   * Elsewhere a knot's first derivative uses the smaller incident secant
   * with the same sign, or zero at a named extremum; second derivatives are
   * explicitly zero in this parameter. Each quintic's derivative Bernstein
   * controls have the secant's sign because both endpoint slopes are at most
   * that secant and their sum at most twice it. Thus an interval cannot add
   * a lobe beyond its named values. These are authored source conditions,
   * not replacements for unavailable parent derivatives or a pole-G2 claim.
   */
  function radialJets(
    sites: AutoMovieHumanSiteViewPart.ISite[],
    top: number,
  ): NonNullable<AutoMovieHumanSiteViewPart.IInput["poleJets"]> {
    const parameters: number[] = [
      ...sites.map(
        (site: AutoMovieHumanSiteViewPart.ISite): number =>
          -Math.sqrt(top - site.station),
      ),
      0,
    ];
    const span: number = -parameters[0]!;
    const jets: NonNullable<AutoMovieHumanSiteViewPart.ISite["jets"]>[] =
      parameters.map(
        (): NonNullable<AutoMovieHumanSiteViewPart.ISite["jets"]> => [
          { first: 0, second: 0 },
          { first: 0, second: 0 },
          { first: 0, second: 0 },
          { first: 0, second: 0 },
        ],
      );
    for (const quarter of [0, 1, 2, 3] as const) {
      const values: number[] = [
        ...sites.map(
          (site: AutoMovieHumanSiteViewPart.ISite): number =>
            site.edges[quarter],
        ),
        0,
      ];
      const secants: number[] = values
        .slice(1)
        .map(
          (value: number, index: number): number =>
            (value - values[index]!) /
            (parameters[index + 1]! - parameters[index]!),
        );
      for (let index: number = 2; index < parameters.length; index++) {
        const before: number = secants[index - 1]!;
        const after: number = secants[index] ?? before;
        const first: number =
          before * after > 0
            ? Math.sign(before) * Math.min(Math.abs(before), Math.abs(after))
            : 0;
        jets[index]![quarter] = { first: first * span, second: 0 };
      }
    }
    sites.forEach(
      (site: AutoMovieHumanSiteViewPart.ISite, index: number): void => {
        site.jets = jets[index]!;
      },
    );
    return { top: jets.at(-1)! };
  }
}
