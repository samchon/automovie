import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftContract,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidJoin,
  IAutoMovieSolidRail,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieEngineSolidIntersection } from "./AutoMovieEngineSolidIntersection";
import { AutoMovieEngineSolidRail } from "./AutoMovieEngineSolidRail";
import { AutoMovieEngineSolidRibbon } from "./AutoMovieEngineSolidRibbon";
import { AutoMovieEngineSolidVector } from "./AutoMovieEngineSolidVector";
import { solidJoinCrossing } from "./construction/internal/solidJoinCrossing";
import { solidJoinNormalCheck } from "./construction/internal/solidJoinNormalCheck";

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
 * (`AutoMovieEngineSolidSharedCurve`), tangential over part of its turn. Its `toward`
 * reader then names each rail's side at every point, which the normals cannot
 * where they are parallel; the rails, the ribbons and every check here are
 * otherwise the traced join's own.
 */
export namespace AutoMovieEngineSolidJoin {
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
        : AutoMovieEngineSolidIntersection.trace(input);
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [
      ...traced.diagnostics,
    ];
    const producer: string = `solid.join.${input.part.name}.${input.host.name}`;
    const host: IAutoMovieSolidAtlas = AutoMovieEngineSolidIntersection.atlas(
      input.host,
    );

    /*
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

    // Rails by parameter, solved once: the join's checks, the blend's columns and the clip ask for the same
    // parameters (the traced points' and the columns', bitwise the same values), and callers only read them.
    const rails: Map<number, IAutoMovieSolidRail.IRail | null> = new Map();

    /*
     * Map numeric-key equality reuses a rail or null failure for this join's
     * lifetime.
     */
    const rail: IAutoMovieSolidJoin.IJoin["rail"] = (
      t: number,
    ): IAutoMovieSolidRail.IRail | null => {
      const known: IAutoMovieSolidRail.IRail | null | undefined = rails.get(t);
      if (known !== undefined) return known;
      const p: IAutoMovieSolidIntersection.IPoint | null = curve.at(t);

      // A declared loop's sides where it supplies them; a point at which it cannot name them has no rail.
      const sides: IAutoMovieSolidRail.IToward | null | undefined =
        p === null ? null : input.toward?.(p);
      const solved: IAutoMovieSolidRail.IRail | null =
        p === null || sides === null
          ? null
          : AutoMovieEngineSolidRail.at(
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
      rails.set(t, solved);
      return solved;
    };

    /*
     * The same solve as `rail`, explained.
     */
    const explain: IAutoMovieSolidJoin.IJoin["explain"] = (
      t: number,
    ): IAutoMovieSolidRail.IExplanation | null => {
      const p: IAutoMovieSolidIntersection.IPoint | null = curve.at(t);
      return p === null
        ? null
        : AutoMovieEngineSolidRail.explain(
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

    /*
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

    /*
     * Rebuild both surface ribbons at the cached rail; columns themselves are
     * not cached.
     */
    const column: IAutoMovieSolidJoin.IJoin["column"] = (
      t: number,
    ): IAutoMovieSolidJoin.IColumn | null => {
      const r: IAutoMovieSolidRail.IRail | null = rail(t);
      return r === null
        ? null
        : ribbons(input.part, host.faces[r.hostFace]!, r);
    };

    /*
     * Read the host rail loop at uniform curve parameters from the seed.
     */
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
    const columns: IAutoMovieSolidJoin.IColumn[] = [];
    for (const p of curve.points) {
      const c: IAutoMovieSolidJoin.IColumn | null = column(p.t);
      if (c === null)
        return fail(
          "rails",
          `no rail at t ${p.t} (host width ${input.width.host(p.t)} mm): ${missing(p.t)}`,
        );
      const outside: string | null =
        AutoMovieEngineSolidIntersection.beyond(input.part, c.rail.s) ??
        AutoMovieEngineSolidIntersection.beyond(
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
    const crossing: string | null = !single
      ? null
      : solidJoinCrossing(
          columns.map(
            (c: IAutoMovieSolidJoin.IColumn): [number, number] => c.rail.host,
          ),
          curve.winding === 0,
        );
    if (crossing !== null)
      return fail(
        "simple rail",
        `the host's rail crosses itself ${crossing}; a width passes the rail's radius of curvature`,
      );

    // Preserve the sampled predicate while reporting its already read operands.
    const normalCheck: ReturnType<typeof solidJoinNormalCheck> =
      solidJoinNormalCheck(
        columns,
        column,
        period,
        curve,
        FOLD_SHARES,
        keep,
        mode,
      );
    if (normalCheck !== null)
      return fail(normalCheck.contract, normalCheck.detail);

    /*
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

  /*
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
      start: AutoMovieEngineSolidRibbon.of(
        host,
        rail.host[0],
        rail.host[1],
        -rail.across[0],
        -rail.across[1],
        chord / hostSpeed,
      ),
      end: AutoMovieEngineSolidRibbon.of(
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

/*
 * Shared vector operations preserve the existing arithmetic and allocation
 * owners.
 */
const {
  combine,
  cross,
  norm,
  sub,
}: Pick<typeof AutoMovieEngineSolidVector, "combine" | "cross" | "norm" | "sub"> =
  AutoMovieEngineSolidVector;
