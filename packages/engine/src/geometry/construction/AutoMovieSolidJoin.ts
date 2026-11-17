import type { IAutoMovieSolidAtlas, IAutoMovieSolidSurface, AutoMovieVector3Tuple, IAutoMovieLoftContract, IAutoMovieSolidIntersection, IAutoMovieSolidJoin, IAutoMovieSolidRail } from "@automovie/interface";

import { AutoMovieSolidBlend } from "./AutoMovieSolidBlend";
import { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidRail } from "./AutoMovieSolidRail";
import { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

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
    input: IAutoMovieSolidJoin.IInput,
    keep: IAutoMovieSolidRail.Keep,
  ): IAutoMovieSolidJoin.IResult {
    const traced: IAutoMovieSolidIntersection.IResult =
      input.curve !== undefined
        ? { curve: input.curve, diagnostics: [] }
        : AutoMovieSolidIntersection.trace(input);
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [
      ...traced.diagnostics,
    ];
    const producer: string = `solid.join.${input.part.name}.${input.host.name}`;
    const host: IAutoMovieSolidAtlas = AutoMovieSolidIntersection.atlas(
      input.host,
    );

    /** Append this failed premise without claiming rollback of any caller-owned body. */
    const fail: (contract: string, detail: string) => IAutoMovieSolidJoin.IResult = (
      contract: string,
      detail: string,
    ): IAutoMovieSolidJoin.IResult => {
      diagnostics.push({ producer, level: 6, contract, detail });
      return { join: null, diagnostics };
    };
    if (traced.curve === null) return { join: null, diagnostics };
    if (diagnostics.length !== 0) return { join: null, diagnostics };
    const curve: IAutoMovieSolidIntersection.ICurve = traced.curve;
    const period: number = 2 * Math.PI;
    const t0: number = curve.points[0]!.t;
    const mode: IAutoMovieSolidRail.Mode =
      input.parameter === undefined || input.parameter.kind === "phase"
        ? "station"
        : "square";

    // Rails by parameter, solved once: the join's checks, the blend's columns and the clip ask for the same
    // parameters (the traced points' and the columns', bitwise the same values), and callers only read them.
    const rails: Map<number, IAutoMovieSolidRail.IRail | null> = new Map();

    /** Map numeric-key equality reuses a rail or null failure for this join's lifetime. */
    const rail: IAutoMovieSolidJoin.IJoin["rail"] = (
      t: number,
    ): IAutoMovieSolidRail.IRail | null => {
      const known: IAutoMovieSolidRail.IRail | null | undefined = rails.get(t);
      if (known !== undefined) return known;
      const p: IAutoMovieSolidIntersection.IPoint | null = curve.at(t);
      const solved: IAutoMovieSolidRail.IRail | null =
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
    const explain: IAutoMovieSolidJoin.IJoin["explain"] = (
      t: number,
    ): IAutoMovieSolidRail.IExplanation | null => {
      const p: IAutoMovieSolidIntersection.IPoint | null = curve.at(t);
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
      const read: IAutoMovieSolidRail.IExplanation | null = explain(t);
      if (read === null) return "the curve has no point there";
      const numbers: string = Object.entries(read.quantities)
        .map(([key, value]: [string, number]): string => `${key} ${Number(value.toPrecision(6))}`)
        .join(", ");
      return read.refusal === null
        ? `the rails solved but their ribbons did not (${numbers})`
        : `${read.refusal} (${numbers})`;
    };

    /** Rebuild both surface ribbons at the cached rail; columns themselves are not cached. */
    const column: IAutoMovieSolidJoin.IJoin["column"] = (t: number): IAutoMovieSolidJoin.IColumn | null => {
      const r: IAutoMovieSolidRail.IRail | null = rail(t);
      return r === null
        ? null
        : ribbons(input.part, host.faces[r.hostFace]!, r);
    };

    /** Read the host rail loop at uniform curve parameters from the seed. */
    const loop: IAutoMovieSolidJoin.IJoin["loop"] = (count: number): [number, number][] | null => {
      const out: [number, number][] = [];
      for (let i: number = 0; i < count; i++) {
        const r: IAutoMovieSolidRail.IRail | null = rail(
          t0 + (period * i) / count,
        );
        if (r === null) return null;
        out.push(r.host);
      }
      return out;
    };

    // Every traced point carries both rails.
    const columns: IAutoMovieSolidJoin.IColumn[] = [];
    for (const p of curve.points) {
      const c: IAutoMovieSolidJoin.IColumn | null = column(p.t);
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
      (c: IAutoMovieSolidJoin.IColumn): boolean => c.rail.hostFace === columns[0]!.rail.hostFace,
    );
    const crossing: string | null = !single
      ? null
      : crossed(
          columns.map((c: IAutoMovieSolidJoin.IColumn): [number, number] => c.rail.host),
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
      const before: IAutoMovieSolidJoin.IColumn | null = column(c.rail.curve.t - step);
      const after: IAutoMovieSolidJoin.IColumn | null = column(c.rail.curve.t + step);
      if (before === null || after === null)
        return fail("rails", `no rail beside t ${c.rail.curve.t}`);
      let previous: AutoMovieVector3Tuple | null = null;
      for (let k: number = 0; k <= FOLD_SHARES; k++) {
        const w: number = k / FOLD_SHARES;
        const along: AutoMovieVector3Tuple = sub(
          AutoMovieSolidBlend.jet(after.start, after.end, w).point,
          AutoMovieSolidBlend.jet(before.start, before.end, w).point,
        );
        const n: AutoMovieVector3Tuple = cross(
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
    const widths: IAutoMovieSolidJoin.IJoin["widths"] = (
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
    rail: IAutoMovieSolidRail.IRail,
  ): IAutoMovieSolidJoin.IColumn {
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
      ) as AutoMovieVector3Tuple,
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
