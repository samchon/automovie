import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieSolidBlend } from "./AutoMovieSolidBlend";
import { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidRail } from "./AutoMovieSolidRail";
import { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World point or chart derivative in the source surface's units. */
type Vec3 = AutoMovieSolidVector.Vec3;

/** Analytic boundary jet carried by one side of a blend. */
type IRibbon = AutoMovieSolidRibbon.IRibbon;

/** Shared vector operations preserve the existing arithmetic and allocation owners. */
const {
  combine,
  cross,
  dot,
  norm,
  sub,
}: Pick<
  typeof AutoMovieSolidVector,
  "combine" | "cross" | "dot" | "norm" | "sub"
> = AutoMovieSolidVector;

/**
 * Compose merge or diff from an intersection, kept-side rails and analytic
 * ribbons. At parameter t in radians, the host ribbon starts a column at w=0
 * and the part ribbon ends it at w=1; their cross speeds use the rail chord.
 *
 * Admission reads sampled rails/domains, strict proper chart crossings only
 * on a single host face, and nine fold shares per column. These observations
 * do not certify continuous unfolding, simple multi-face rails or final mesh
 * topology. A supplied curve skips tracing and its diagnostics; its provenance
 * and prior admission remain unresolved at the pretracing caller.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States parameter units, boundary order, sampled acceptance and the supplied-curve diagnostic boundary.
 * @evidence contracts/development/design.md#principled-representation Represents Compose merge or diff from an intersection, kept-side rails and analytic ribbons: companion namespace of 8 members (`IJoin`, `IColumn`, `IInput`, `IResult`, `FOLD_SHARES`, `create`, ...); units and frames named in its text: radian, radians, local, second, world. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidJoin` in packages/engine/src/geometry/construction/AutoMovieSolidJoin.ts; its surface is the 8 members listed and the text shows 17 other files naming it, mostly packages/engine (10), test (7), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidJoin {
  /**
   * A composed contact and its readers; t is the curve's radian parameter.
   *
   * @evidence contracts/development/design.md#principled-representation The curve, keep side and analytic boundary readers describe one composed contact under regular source-jet premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One result separates its captured curve and four readers from later blend publication.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The G2 literal declares boundary matching; the record proves no continuous unfolding, manifold mesh or mutation safety.
   * @evidence contracts/development/common.md#meaningful-documentation Readers distinguish rail failure, fresh column data, borrowed chart loops and live chord laws.
   */
  export interface IJoin {
    /** The intersection curve. */
    curve: AutoMovieSolidIntersection.ICurve;

    /** Which side of the host the part keeps. */
    keep: AutoMovieSolidRail.Keep;

    /**
     * Declared G2 boundary continuity under regular compatible source/width
     * jets; sampled admission and later publication do not certify the whole skin.
     */
    continuity: "G2";

    /**
     * Read the rails at finite curve parameter t in radians, or null on a local solve failure.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Corrects the same curve at t and solves kept-side chord rails on its actual surface jets.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One Map lookup precedes curve correction and rail preparation on a miss.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Finite queries and unchanged source/law data remain premises; cached nulls are reused and callback throws propagate.
     * @evidence contracts/development/common.md#meaningful-documentation States curve-parameter units and nullable failure rather than assuming every mode uses part phase.
     * @evidence contracts/development/implementation.md#efficient-algorithms A hit uses expected constant lookup work; a miss includes the existing continuation and rail-solver callback costs.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Map key equality reuses rails including null; it supplies no invalidation after input or cached-record mutation.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each new numeric key retains its rail/null for the join lifetime; no size limit, eviction or release hook exists.
     */
    rail(t: number): AutoMovieSolidRail.IRail | null;

    /**
     * Solve the rails at radian parameter t again, reporting the quantities read and the failed premise (`AutoMovieSolidRail.explain`);
     * null when the curve has no point at t.
     *
     * @evidence contracts/development/implementation.md#principled-implementation The same curve point, widths and mode as `rail`, through the same solve.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure A diagnostic reader beside `rail`; it caches nothing.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts It changes no rail: `rail` and the join's checks read their own cache.
     * @evidence contracts/development/common.md#meaningful-documentation States the parameter's units and the null case.
     * @evidence contracts/development/implementation.md#efficient-algorithms One curve correction and one rail solve per call.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the join's curve and width laws.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
     */
    explain(t: number): AutoMovieSolidRail.IExplanation | null;

    /**
     * Read host-first and part-last boundary ribbons at radian parameter t; null means no rail.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Uses the original cached rail and source 2-jets, scaling cross derivatives by rail chord over source cross-speed.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One rail read feeds the same host/part ribbon builder and analytic host outward vector.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonzero regular cross-speeds remain premises; no zero-speed substitute, new finite guard or mesh normal is supplied.
     * @evidence contracts/development/common.md#meaningful-documentation States parameter, host/part order, borrowed rail, fresh ribbons and null result.
     * @evidence contracts/development/implementation.md#efficient-algorithms Includes the rail read and four surface jet calls in ribbon preparation; columns are rebuilt for each request.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses only the rail cache, not prior ribbon/column objects or their source-jet evaluations.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns fresh ribbons/outward data while the returned column borrows a cached rail; the join keeps no column cache.
     */
    column(t: number): IColumn | null;

    /**
     * Sample the host chart loop at count uniform radian parameters from the seed, or null on a failed rail.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Reads the host preimage of each original uniformly parameterized rail in traversal order.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered loop returns chart tuples without introducing a second geometric approximation owner.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A positive finite integral count is a caller premise; no count guard or continuous simplicity certificate is added.
     * @evidence contracts/development/common.md#meaningful-documentation States chart coordinates, uniform seed-relative samples and early null; chart tuples are borrowed from cached rails.
     * @evidence contracts/development/implementation.md#efficient-algorithms For C requested samples, performs C rail reads with their hit/miss costs and O(C) output references.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Repeated parameters share the rail cache; the returned tuples are the same mutable host arrays, not detached copies.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the output container while its tuples alias cached rails; distinct samples can grow the join cache without bound.
     */
    loop(count: number): [number, number][] | null;

    /**
     * Read current chord laws at radian t, in mm; part is null for a fixed station.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Reads host then varying part chord from the original laws, preserving the fixed-station null distinction.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One small record separates authored chord values from rail geometry and station coordinates.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No positivity or finiteness admission occurs here; changed laws can disagree with already cached rails.
     * @evidence contracts/development/common.md#meaningful-documentation States t in radians, chord values in mm and the part-null meaning.
     * @evidence contracts/development/implementation.md#efficient-algorithms Calls the host law and at most one part law, plus a fixed result allocation; arbitrary callback costs remain included.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads live laws on every call without memoizing widths or rebuilding previously cached rails.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one scalar record; the reader retains its original input dependency but no query history.
     */
    widths(t: number): { host: number; part: number | null };
  }

  /**
   * The blend's two edge ribbons and outward source at one curve parameter.
   *
   * @evidence contracts/development/design.md#principled-representation The actual rail identifies the two analytic surface ribbons; the host rail's oriented chart cross product declares the blend's outward side independently of its storage origin.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One value record keeps rail identity, both boundary 2-jets and their host outward direction together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No mesh-derived normal or tube-centre guess is stored. This type alone does not validate finiteness or prove unfolding.
   * @evidence contracts/development/common.md#meaningful-documentation Members state host/part order, blend shares and the unnormalized analytic outward meaning.
   */
  export interface IColumn {
    /** The rails it runs between. */
    rail: AutoMovieSolidRail.IRail;

    /** The host's ribbon, `w = 0`. */
    start: IRibbon;

    /** The part's ribbon, `w = 1`. */
    end: IRibbon;

    /** World direction cross(host.u,host.v)*host.orientation at the host rail; unnormalized, with magnitude inherited from that chart's units. */
    outward: Vec3;
  }

  /**
   * Borrowed surfaces, trace request and width laws for one kept-side join.
   *
   * @evidence contracts/development/design.md#principled-representation Names the periodic part, host atlas, trace seed/parameter and original mm chord or fixed-station width inputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One request shares authored geometry and optional pretraced curve without a consumer-local join implementation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Supplied curves bypass trace diagnostics/provenance checks; actual preliminary tracing currently forwards nonnull curves without their grazing diagnostics.
   * @evidence contracts/development/common.md#meaningful-documentation Members state radian parameters, mm lengths, optional defaults and the original curve-match requirement.
   */
  export interface IInput {
    /** The attached part or cutter, `v` periodic. */
    part: IAutoMovieSolidSurface;

    /** The host or base: one surface, or an atlas of the faces of a solid already merged (`IAutoMovieSolidAtlas`). */
    host: IAutoMovieSolidSurface | IAutoMovieSolidAtlas;

    /** The intersection's seed, from the landmarks that locate the contact. */
    seed: AutoMovieSolidIntersection.IInput["seed"];

    /**
     * The curve parameter, defaulting to phase. Phase uses a station rail;
     * both angle and arc use the original square rail direction in the part's
     * chart. Width laws use that same curve parameter in radians.
     */
    parameter?: AutoMovieSolidIntersection.Parameter;

    /** Traced points over one turn, at least 8. */
    count: number;

    /** Intended mm meeting tolerance; the existing solver also includes the unscaled law residual. */
    tolerance: number;

    /** Least angle between the tangent planes along the curve, radians. */
    grazing: number;

    /** The curve already traced from this seed on these surfaces with this parameter, count and tolerance, when the caller traced it to read a width law from it; absent, the join traces it. */
    curve?: AutoMovieSolidIntersection.ICurve;

    /** Width laws in the curve's parameter: chords from the curve to each rail, mm, positive. */
    width: {
      /**
       * On the part: a chord per parameter, or `{ station }` (phase parameter only), the part's rail at
       * one station for every phase, where a lofted part's first own section
       * stands, beyond the curve's farthest reach along the part.
       */
      part: ((t: number) => number) | { station: number };

      /** On the host. */
      host(t: number): number;
    };
  }

  /**
   * The nullable contact and its ordered observed diagnostics.
   *
   * @evidence contracts/development/design.md#principled-representation Pairs the original nullable join with diagnostics from the path actually executed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record separates reported rejection from a published contact and its retained readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It does not recover skipped supplied-curve diagnostics, certify all premises or convert thrown callbacks to results.
   * @evidence contracts/development/common.md#meaningful-documentation States null on a reported failed check and ownership of the returned diagnostic list.
   */
  export interface IResult {
    /** The join, or null when a check fails. */
    join: IJoin | null;

    /** Diagnostics observed by this execution path, in order. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** Shares of each column read by the fold check. */
  export const FOLD_SHARES: number = 8;

  /**
   * Compose a join.
   *
   * @param input Borrowed surfaces, seed, trace limits and live width laws.
   * @param keep outside for a merge, inside for a diff.
   * @returns The contact or null with observed diagnostics; callback exceptions propagate.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Composes the trace or supplied curve, chord rails and analytic ribbons, then performs the original sampled domain/crossing/fold checks.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation owns admission order and returned closures while trace, rail, ribbon and blend owners retain their numerical methods.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A supplied curve suppresses its trace diagnostics; multi-face crossing and unsampled fold/domain behavior remain unchecked, with no width shrink or numerical repair.
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed callbacks, supplied-curve admission gap, observed failures, units and result lifetime.
   * @evidence contracts/development/implementation.md#efficient-algorithms C sampled columns include cached/missed rail solves and fixed fold shares; the single-face strict crossing scan is O(C²).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Caches rails and nulls at Map-equivalent parameters; neighbouring fold columns and ribbons are deliberately rebuilt.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only successful returned readers retain the local Map/input/curve/atlas; keys are unbounded and no resource handle is acquired.
   */ export function create(
    input: IInput,
    keep: AutoMovieSolidRail.Keep,
  ): IResult {
    const traced: AutoMovieSolidIntersection.IResult =
      input.curve !== undefined
        ? { curve: input.curve, diagnostics: [] }
        : AutoMovieSolidIntersection.trace(input);
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [
      ...traced.diagnostics,
    ];
    const producer: string = `solid.join.${input.part.name}.${input.host.name}`;
    const host: IAutoMovieSolidAtlas = AutoMovieSolidIntersection.atlas(
      input.host,
    );

    /** Append this failed premise without claiming rollback of any caller-owned body. */
    const fail: (contract: string, detail: string) => IResult = (
      contract: string,
      detail: string,
    ): IResult => {
      diagnostics.push({ producer, level: 6, contract, detail });
      return { join: null, diagnostics };
    };
    if (traced.curve === null) return { join: null, diagnostics };
    if (diagnostics.length !== 0) return { join: null, diagnostics };
    const curve: AutoMovieSolidIntersection.ICurve = traced.curve;
    const period: number = 2 * Math.PI;
    const t0: number = curve.points[0]!.t;
    const mode: AutoMovieSolidRail.Mode =
      input.parameter === undefined || input.parameter.kind === "phase"
        ? "station"
        : "square";

    // Rails by parameter, solved once: the join's checks, the blend's columns and the clip ask for the same
    // parameters (the traced points' and the columns', bitwise the same values), and callers only read them.
    const rails: Map<number, AutoMovieSolidRail.IRail | null> = new Map();

    /** Map numeric-key equality reuses a rail or null failure for this join's lifetime. */
    const rail: IJoin["rail"] = (
      t: number,
    ): AutoMovieSolidRail.IRail | null => {
      const known: AutoMovieSolidRail.IRail | null | undefined = rails.get(t);
      if (known !== undefined) return known;
      const p: AutoMovieSolidIntersection.IPoint | null = curve.at(t);
      const solved: AutoMovieSolidRail.IRail | null =
        p === null
          ? null
          : AutoMovieSolidRail.at(
              input.part,
              host,
              p,
              keep,
              typeof input.width.part === "function"
                ? input.width.part(t)
                : input.width.part,
              input.width.host(t),
              mode,
            );
      rails.set(t, solved);
      return solved;
    };

    /** The same solve as `rail`, explained. */
    const explain: IJoin["explain"] = (
      t: number,
    ): AutoMovieSolidRail.IExplanation | null => {
      const p: AutoMovieSolidIntersection.IPoint | null = curve.at(t);
      return p === null
        ? null
        : AutoMovieSolidRail.explain(
            input.part,
            host,
            p,
            keep,
            typeof input.width.part === "function"
              ? input.width.part(t)
              : input.width.part,
            input.width.host(t),
            mode,
          );
    };

    /** Why the column at t is missing: the rail's failed premise and its quantities, or the ribbons when the rail solved. */
    const missing = (t: number): string => {
      const read: AutoMovieSolidRail.IExplanation | null = explain(t);
      if (read === null) return "the curve has no point there";
      const numbers: string = Object.entries(read.quantities)
        .map(([key, value]: [string, number]): string => `${key} ${Number(value.toPrecision(6))}`)
        .join(", ");
      return read.refusal === null
        ? `the rails solved but their ribbons did not (${numbers})`
        : `${read.refusal} (${numbers})`;
    };

    /** Rebuild both surface ribbons at the cached rail; columns themselves are not cached. */
    const column: IJoin["column"] = (t: number): IColumn | null => {
      const r: AutoMovieSolidRail.IRail | null = rail(t);
      return r === null
        ? null
        : ribbons(input.part, host.faces[r.hostFace]!, r);
    };

    /** Read the host rail loop at uniform curve parameters from the seed. */
    const loop: IJoin["loop"] = (count: number): [number, number][] | null => {
      const out: [number, number][] = [];
      for (let i: number = 0; i < count; i++) {
        const r: AutoMovieSolidRail.IRail | null = rail(
          t0 + (period * i) / count,
        );
        if (r === null) return null;
        out.push(r.host);
      }
      return out;
    };

    // Every traced point carries both rails.
    const columns: IColumn[] = [];
    for (const p of curve.points) {
      const c: IColumn | null = column(p.t);
      if (c === null)
        return fail(
          "rails",
          `no rail at t ${p.t} (host width ${input.width.host(p.t)} mm): ${missing(p.t)}`,
        );
      const outside: string | null =
        AutoMovieSolidIntersection.beyond(input.part, c.rail.s) ??
        AutoMovieSolidIntersection.beyond(
          host.faces[c.rail.hostFace]!,
          c.rail.host[0],
        );
      if (outside !== null)
        return fail("inside the layers", `the rails at t ${p.t}: ${outside}`);
      columns.push(c);
    }

    // The host's rail loop must stay simple in the chart (read where it
    // lies on one face; across faces each piece is clipped into its face).
    const single: boolean = columns.every(
      (c: IColumn): boolean => c.rail.hostFace === columns[0]!.rail.hostFace,
    );
    const crossing: string | null = !single
      ? null
      : crossed(
          columns.map((c: IColumn): [number, number] => c.rail.host),
          curve.winding === 0,
        );
    if (crossing !== null)
      return fail(
        "simple rail",
        `the host's rail crosses itself ${crossing}; a width passes the rail's radius of curvature`,
      );

    // The blend's normal must not reverse along a column.
    const step: number = period / (16 * curve.points.length);
    for (const c of columns) {
      const before: IColumn | null = column(c.rail.curve.t - step);
      const after: IColumn | null = column(c.rail.curve.t + step);
      if (before === null || after === null)
        return fail("rails", `no rail beside t ${c.rail.curve.t}`);
      let previous: Vec3 | null = null;
      for (let k: number = 0; k <= FOLD_SHARES; k++) {
        const w: number = k / FOLD_SHARES;
        const along: Vec3 = sub(
          AutoMovieSolidBlend.jet(after.start, after.end, w).point,
          AutoMovieSolidBlend.jet(before.start, before.end, w).point,
        );
        const n: Vec3 = cross(
          along,
          AutoMovieSolidBlend.jet(c.start, c.end, w).first,
        );
        if (previous !== null && !(dot(previous, n) > 0))
          return fail(
            "unfolded blend",
            `the blend's normal reverses at t ${c.rail.curve.t}, share ${w}`,
          );
        previous = n;
      }
    }

    /** Read the original chord laws; a fixed-station part has no varying part chord. */
    const widths: IJoin["widths"] = (
      t: number,
    ): { host: number; part: number | null } => ({
      host: input.width.host(t),
      part: typeof input.width.part === "function" ? input.width.part(t) : null,
    });
    return {
      join: { curve, keep, continuity: "G2", rail, explain, column, loop, widths },
      diagnostics,
    };
  }

  /**
   * Build host-first and part-last ribbons from the rail's preimages and the
   * two source jets, scaled to their chord. Returns the original rail and
   * host-oriented outward vector; nonzero cross-speeds remain a premise.
   */ function ribbons(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidSurface,
    rail: AutoMovieSolidRail.IRail,
  ): IColumn {
    const chord: number = norm(sub(rail.partPoint, rail.hostPoint));
    const b: IAutoMovieSolidSurface.IJet = host.jet(rail.host[0], rail.host[1]);
    const hostSpeed: number = norm(
      combine([
        [rail.across[0], b.u],
        [rail.across[1], b.v],
      ]),
    );
    const a: IAutoMovieSolidSurface.IJet = part.jet(rail.s, rail.phi);
    const partSpeed: number = norm(
      combine([
        [rail.partAcross[0], a.u],
        [rail.partAcross[1], a.v],
      ]),
    );
    return {
      rail,
      start: AutoMovieSolidRibbon.of(
        host,
        rail.host[0],
        rail.host[1],
        -rail.across[0],
        -rail.across[1],
        chord / hostSpeed,
      ),
      end: AutoMovieSolidRibbon.of(
        part,
        rail.s,
        rail.phi,
        rail.partAcross[0],
        rail.partAcross[1],
        chord / partSpeed,
      ),
      outward: cross(b.u, b.v).map(
        (x: number): number => x * host.orientation,
      ) as Vec3,
    };
  }

  /**
   * Scan ordered nonadjacent chart edges for strict proper crossings.
   * points supplies the polygon; closed includes its closing edge, while a
   * winding chart path omits it. Returns the first description or null;
   * collinear overlap and touching edges do not count as crossings here.
   */ function crossed(
    points: readonly [number, number][],
    closed: boolean,
  ): string | null {
    const n: number = points.length;
    const edges: number = closed ? n : n - 1;

    /** Oriented chart cross product used by the existing strict crossing test. */
    const turn: (
      a: readonly [number, number],
      b: readonly [number, number],
      c: readonly [number, number],
    ) => number = (
      a: readonly [number, number],
      b: readonly [number, number],
      c: readonly [number, number],
    ): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    for (let i: number = 0; i < edges; i++) {
      const a: [number, number] = points[i]!;
      const b: [number, number] = points[(i + 1) % n]!;
      for (let j: number = i + 2; j < edges; j++) {
        if (closed && i === 0 && j === n - 1) continue;
        const c: [number, number] = points[j]!;
        const d: [number, number] = points[(j + 1) % n]!;
        if (
          turn(a, b, c) * turn(a, b, d) < 0 &&
          turn(c, d, a) * turn(c, d, b) < 0
        )
          return `between edges ${i} and ${j}`;
      }
    }
    return null;
  }
}
