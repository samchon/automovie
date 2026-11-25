import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftContract,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidJoin,
  IAutoMovieSolidRail,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidJoinCrossing } from "./AutoMovieSolidJoinCrossing";
import { AutoMovieSolidJoinNormalCheck } from "./AutoMovieSolidJoinNormalCheck";
import { AutoMovieSolidRail } from "./AutoMovieSolidRail";
import { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/**
 * Shared vector operations preserve the existing arithmetic and allocation
 * owners.
 */
const {
  combine,
  cross,
  norm,
  sub,
}: Pick<typeof AutoMovieSolidVector, "combine" | "cross" | "norm" | "sub"> =
  AutoMovieSolidVector;

/**
 * Compose merge or diff from an intersection, kept-side rails and analytic
 * ribbons. At parameter t in radians, the host ribbon starts a column at w=0
 * and the part ribbon ends it at w=1; their cross speeds use the rail chord.
 *
 * Admission reads sampled rails/domains, strict proper chart crossings only on
 * a single host face, and nine fold shares per column. These observations do
 * not certify continuous unfolding, simple multi-face rails or final mesh
 * topology. A supplied curve skips tracing and its diagnostics; its provenance
 * and prior admission remain unresolved at the pretracing caller.
 *
 * A supplied curve may be a declared loop both surfaces share
 * (`AutoMovieSolidSharedCurve`), tangential over part of its turn. Its `toward`
 * reader then names each rail's side at every point, which the normals cannot
 * where they are parallel; the rails, the ribbons and every check here are
 * otherwise the traced join's own.
 */
export namespace AutoMovieSolidJoin {
  /** Shares of each column read by the fold check. */
  export const FOLD_SHARES: number = 8;

  /**
   * Compose a join.
   *
   * @param input Borrowed surfaces, seed, trace limits and live width laws.
   * @param keep Outside for a merge, inside for a diff.
   * @returns The contact or null with observed diagnostics; callback exceptions
   *   propagate.
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

    /**
     * Append this failed premise without claiming rollback of any caller-owned
     * body.
     */
    const fail: (
      contract: string,
      detail: string,
    ) => IAutoMovieSolidJoin.IResult = (
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

    // Admission follows the curve's traversal. Its exact request addresses
    // can have nonuniform spacing and need not match the returned phase.
    const columns: IAutoMovieSolidJoin.IColumn[] = [];
    const addresses: number[] = curve.points
      .map((_, i: number): number => i)
      .sort(
        (i: number, j: number): number =>
          curve.points[i]!.t - curve.points[j]!.t,
      );

    /** Resolve the exact predeclared trace column at t, if it is one. */
    const tracedColumn = (
      t: number,
    ): IAutoMovieSolidJoin.IColumn | undefined => {
      let low: number = 0;
      let high: number = addresses.length;
      while (low < high) {
        const middle: number = (low + high) >>> 1;
        if (curve.points[addresses[middle]!]!.t < t) low = middle + 1;
        else high = middle;
      }
      const index: number | undefined = addresses[low];
      return index !== undefined && curve.points[index]!.t === t
        ? columns[index]
        : undefined;
    };

    /** Solve one rail against the actual surfaces and the prepared laws. */
    const readRail: IAutoMovieSolidJoin.IJoin["rail"] = (
      t: number,
    ): IAutoMovieSolidRail.IRail | null => {
      const p: IAutoMovieSolidIntersection.IPoint | null = curve.at(t);

      // A declared loop's sides where it supplies them; a point at which it cannot name them has no rail.
      const sides: IAutoMovieSolidRail.IToward | null | undefined =
        p === null ? null : input.toward?.(p);
      return p === null || sides === null
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
            sides,
          );
    };

    /**
     * Read the rail at an authored trace column or solve the requested
     * parameter.
     */
    const rail: IAutoMovieSolidJoin.IJoin["rail"] = (
      t: number,
    ): IAutoMovieSolidRail.IRail | null => tracedColumn(t)?.rail ?? readRail(t);

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
            input.toward?.(p) ?? undefined,
          );
    };

    /**
     * Why the column at t is missing: the rail's failed premise and its
     * quantities, or the ribbons when the rail solved.
     */
    const missing = (t: number): string => {
      const read: IAutoMovieSolidRail.IExplanation | null = explain(t);
      if (read === null) return "the curve has no point there";
      const numbers: string = Object.entries(read.quantities)
        .map(
          ([key, value]: [string, number]): string =>
            `${key} ${Number(value.toPrecision(6))}`,
        )
        .join(", ");
      return read.refusal === null
        ? `the rails solved but their ribbons did not (${numbers})`
        : `${read.refusal} (${numbers})`;
    };

    /** Prepare both actual surface ribbons at one parameter. */
    const readColumn: IAutoMovieSolidJoin.IJoin["column"] = (
      t: number,
    ): IAutoMovieSolidJoin.IColumn | null => {
      const r: IAutoMovieSolidRail.IRail | null = readRail(t);
      return r === null
        ? null
        : ribbons(input.part, host.faces[r.hostFace]!, r);
    };

    /** Each late query borrows a declared column or reads only its own ribbons. */
    const column: IAutoMovieSolidJoin.IJoin["column"] = (
      t: number,
    ): IAutoMovieSolidJoin.IColumn | null => tracedColumn(t) ?? readColumn(t);

    /** Read the host rail loop at uniform curve parameters from the seed. */
    const loop: IAutoMovieSolidJoin.IJoin["loop"] = (
      count: number,
    ): [number, number][] | null => {
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
    for (const p of curve.points) {
      const c: IAutoMovieSolidJoin.IColumn | null = readColumn(p.t);
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
      (c: IAutoMovieSolidJoin.IColumn): boolean =>
        c.rail.hostFace === columns[0]!.rail.hostFace,
    );
    const crossing: [number, number] | null = !single
      ? null
      : AutoMovieSolidJoinCrossing(
          columns.map(
            (c: IAutoMovieSolidJoin.IColumn): [number, number] => c.rail.host,
          ),
          curve.winding === 0,
        );
    if (crossing !== null) {
      const edges: string = crossing
        .map((i: number): string => {
          const a: IAutoMovieSolidJoin.IColumn = columns[i]!;
          const b: IAutoMovieSolidJoin.IColumn =
            columns[(i + 1) % columns.length]!;
          return `${i}=[${a.rail.host}]-[${b.rail.host}], contact=[${a.rail.curve.y},${a.rail.curve.theta}]-[${b.rail.curve.y},${b.rail.curve.theta}]`;
        })
        .join("; ");
      return fail(
        "simple rail",
        `the host's rail crosses itself between edges ${crossing[0]} and ${crossing[1]} (${edges})`,
      );
    }

    // Preserve the sampled predicate while reporting its already read operands.
    const normalCheck: ReturnType<typeof AutoMovieSolidJoinNormalCheck> =
      AutoMovieSolidJoinNormalCheck(
        columns,
        column,
        missing,
        period,
        curve,
        FOLD_SHARES,
        keep,
        mode,
      );
    if (normalCheck !== null)
      return fail(normalCheck.contract, normalCheck.detail);

    /**
     * Read the original chord laws; a fixed-station part has no varying part
     * chord.
     */
    const widths: IAutoMovieSolidJoin.IJoin["widths"] = (
      t: number,
    ): { host: number; part: number | null } => ({
      host: input.width.host(t),
      part: typeof input.width.part === "function" ? input.width.part(t) : null,
    });
    return {
      join: {
        curve,
        keep,
        continuity: "G2",
        rail,
        explain,
        column,
        loop,
        widths,
      },
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
}
