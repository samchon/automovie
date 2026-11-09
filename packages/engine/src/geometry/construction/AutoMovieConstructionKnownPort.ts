import type { IAutoMovieConstructionKnownPort } from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { IAutoMovieConstructionKnownPortSource } from "./IAutoMovieConstructionKnownPortSource";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** One resolved immutable original neighboring field and its actual chart map. */
interface Side {
  /** Same immutable original field used by the band, in kernel world millimetres. */
  field: IAutoMovieSolidSurface;

  /** Same original-clock/transverse map used for this field's exact pullback. */
  map: IAutoMovieConstructionKnownPortSource.IMap;
}

/** Kernel world vector, in millimetres per the indicated band derivatives. */
type Vector = [number, number, number];

/**
 * Actual-field C2 band using a quintic partition of unity, without contact recovery.
 *
 * With P and Q the two complete pulled-back original fields, B=(1-h)P+hQ
 * and h=10v^3-15v^4+6v^5. At each rail h and its first two derivatives select
 * the corresponding whole field total2. Interior derivatives use both fields
 * and all chart/product-rule terms, so boundary jets are never extrapolated.
 * The emitted kernel chart is (transverse, original clock), so its second
 * coordinate carries the actual period. Swapping total2 and the outward sign
 * preserves the authored tangential-cross-transverse orientation.
 *
 * This returns a surface reader, not a final skin or a global topology proof.
 * Each actual jet query refuses nonfinite or rank-zero output; whole-domain
 * fold/self-intersection and sewn-rail atlas publication remain separate
 * realization obligations. Supplied neighboring fields/maps must be C2 on
 * the rectangle, including their explicit actual validity domains.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Exact second-order pullback of actual C2 functions and endpoint-flat polynomial weights prove the promised boundary total2; no source derivatives above order two are required.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve two source/map pairs once, then one surface evaluates Point0 or complete total2 with explicit domain and original owner failures.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No generated-loft intersection, numerical refit, boundary Taylor strip, finite difference or missing derivative is used. A finite set of regular queries is not claimed to certify an entire band or its topology.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the composition law, chart/world units, endpoint specialization, immutable callback lifetime and separation of local numeric admission from global realization.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed preparation and at most two original field/map readings per query precede constant-size chain/product rules; original owner evaluation costs remain included.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Resolved original owners are shared for the reader lifetime; each query reuses one actual map/field total2 and no boundary is reconstructed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A returned surface owns a copied descriptor and two borrowed side references; fixed-size vectors have query lifetime and no persistent query cache or external handle is acquired.
 */
export function AutoMovieConstructionKnownPort(
  source: IAutoMovieConstructionKnownPortSource,
): AutoMovieConstructionKnownPort.IPrepared {
  const definition: IAutoMovieConstructionKnownPort = structuredClone(
    source.definition,
  );
  if (
    !interval(definition.domain) ||
    !definition.name ||
    (definition.orientation !== 1 && definition.orientation !== -1) ||
    (definition.period !== undefined &&
      !(Number.isFinite(definition.period) && definition.period > 0))
  )
    fail(
      "A known port needs finite increasing clock bounds, identity and outward sign.",
    );
  if (
    definition.period !== undefined &&
    definition.domain[1] !== definition.domain[0] + definition.period
  )
    fail("A periodic known port must own one complete original clock period.");
  const parent: Side = side(source, definition.parent);
  const child: Side = side(source, definition.child);
  for (const current of [parent, child])
    if (
      !interval(current.map.domain) ||
      !interval(current.map.transverse) ||
      current.map.domain[0] > definition.domain[0] ||
      current.map.domain[1] < definition.domain[1] ||
      current.map.transverse[0] > 0 ||
      current.map.transverse[1] < 1
    )
      fail("A known port map does not own the complete band rectangle.");

  /** Preserve actual open limits; a period is metadata, not permission to change clocks. */
  const admit: (u: number, v: number) => void = (
    u: number,
    v: number,
  ): void => {
    if (
      !Number.isFinite(u) ||
      !Number.isFinite(v) ||
      u < definition.domain[0] ||
      u > definition.domain[1] ||
      v < 0 ||
      v > 1
    )
      fail("A known port query is outside its actual band domain.");
  };
  return {
    name: definition.name,
    domain: [0, 1],
    orientation: definition.orientation === 1 ? -1 : 1,
    definition,
    rails: { parent, child },
    ...(definition.period === undefined ? {} : { period: definition.period }),
    point: (transverse: number, clock: number): Vector => {
      admit(clock, transverse);
      if (transverse === 0 || transverse === 1)
        return point(transverse === 0 ? parent : child, clock, transverse);
      const weight: readonly [number, number, number] = weights(transverse);
      const value: Vector = combine(
        point(parent, clock, transverse),
        point(child, clock, transverse),
        weight[0],
      );
      vector(value);
      return value;
    },
    jet: (transverse: number, clock: number): IAutoMovieSolidSurface.IJet => {
      admit(clock, transverse);
      if (transverse === 0 || transverse === 1)
        return transpose(
          regular(
            pullback(transverse === 0 ? parent : child, clock, transverse),
          ),
        );
      const a: IAutoMovieSolidSurface.IJet = pullback(
        parent,
        clock,
        transverse,
      );
      const b: IAutoMovieSolidSurface.IJet = pullback(child, clock, transverse);
      const [h, d, dd]: readonly [number, number, number] = weights(transverse);
      const out: IAutoMovieSolidSurface.IJet = {
        p: combine(a.p, b.p, h),
        u: combine(a.u, b.u, h),
        v: add(combine(a.v, b.v, h), difference(a.p, b.p, d)),
        uu: combine(a.uu, b.uu, h),
        uv: add(combine(a.uv, b.uv, h), difference(a.u, b.u, d)),
        vv: add(
          add(combine(a.vv, b.vv, h), difference(a.v, b.v, 2 * d)),
          difference(a.p, b.p, dd),
        ),
      };
      return transpose(regular(out));
    },
  };
}

/**
 * The emitted kernel surface keeps its original rail owners and addresses.
 *
 * The descriptor is copied; each field/map is the same immutable original
 * selected at preparation. Binding and material strings remain addresses
 * for the actual downstream owners, not evaluated weights or a certificate
 * that two independently supplied fields have compatible bindings.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States detached metadata, borrowed immutable original functions and the unverified downstream binding obligations.
 * @evidence contracts/development/design.md#principled-representation Represents The emitted kernel surface keeps its original rail owners and addresses: companion namespace of 1 member (`IPrepared`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionKnownPort` in packages/engine/src/geometry/construction/AutoMovieConstructionKnownPort.ts; its surface is the 1 member listed and the text shows 5 other files naming it, mostly packages/human (2), test (2), packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieConstructionKnownPort {
  /** Actual kernel chart and its same original authored rail/material/binding addresses. */
  export interface IPrepared extends IAutoMovieSolidSurface {
    /** Detached descriptor retains original clock bounds and authored outward convention. */
    definition: IAutoMovieConstructionKnownPort;

    /** Actual immutable field/map owners of both rails; labels alone certify no weights. */
    rails: { parent: Side; child: Side };
  }
}

/** Existing kernel consumers make the second coordinate periodic; all mixed orders stay exact. */
function transpose(
  value: IAutoMovieSolidSurface.IJet,
): IAutoMovieSolidSurface.IJet {
  return {
    p: value.p,
    u: value.v,
    v: value.u,
    uu: value.vv,
    uv: value.uv,
    vv: value.uu,
  };
}

/** Resolve explicit original owners and material/binding references without inferred aliases. */
function side(
  source: IAutoMovieConstructionKnownPortSource,
  input: IAutoMovieConstructionKnownPort.ISide,
): Side {
  const field: IAutoMovieSolidSurface | undefined = source.fields.get(
    input.field,
  );
  const map: IAutoMovieConstructionKnownPortSource.IMap | undefined =
    source.maps.get(input.map);
  if (
    field === undefined ||
    map === undefined ||
    !input.boundary ||
    !input.material ||
    !input.binding
  )
    fail(
      "A known port has a missing original field/map/boundary/material/binding owner.",
    );
  return { field: field!, map: map! };
}

/** Read one actual chart and preserve original field Point0 separately from its total2. */
function point(side: Side, u: number, v: number): Vector {
  const chart: IAutoMovieConstructionKnownPortSource.Vector = side.map.point(
    u,
    v,
  );
  chartPoint(side.field, chart);
  const value: Vector =
    side.field.point?.(chart[0], chart[1]) ??
    side.field.jet(chart[0], chart[1]).p;
  vector(value);
  return [...value];
}

/** Full second-order chain rule of the actual neighboring function with its own C2 map. */
function pullback(
  side: Side,
  u: number,
  v: number,
): IAutoMovieSolidSurface.IJet {
  const map: IAutoMovieConstructionKnownPortSource.IJet | null = side.map.jet(
    u,
    v,
  );
  if (map === null) fail("A known port has unavailable actual chart total2.");
  for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
    if (
      !Array.isArray(map![key]) ||
      map![key].length !== 2 ||
      !map![key].every(Number.isFinite)
    )
      fail("A known port has incomplete or nonfinite actual chart total2.");
  chartPoint(side.field, map!.p);
  const field: IAutoMovieSolidSurface.IJet = side.field.jet(
    map!.p[0],
    map!.p[1],
  );
  for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
    vector(field[key]);

  /** First-order pullback preserves actual map direction and scale. */
  const first: (a: readonly number[]) => Vector = (
    a: readonly number[],
  ): Vector =>
    [0, 1, 2].map(
      (k: number): number => field.u[k]! * a[0]! + field.v[k]! * a[1]!,
    ) as Vector;
  /** Hessian pullback includes both original mixed terms and the map Hessian. */
  const second: (
    a: readonly number[],
    b: readonly number[],
    ab: readonly number[],
  ) => Vector = (
    a: readonly number[],
    b: readonly number[],
    ab: readonly number[],
  ): Vector =>
    [0, 1, 2].map(
      (k: number): number =>
        field.uu[k]! * a[0]! * b[0]! +
        field.uv[k]! * (a[0]! * b[1]! + a[1]! * b[0]!) +
        field.vv[k]! * a[1]! * b[1]! +
        field.u[k]! * ab[0]! +
        field.v[k]! * ab[1]!,
    ) as Vector;
  return {
    p: [...field.p],
    u: first(map!.u),
    v: first(map!.v),
    uu: second(map!.u, map!.u, map!.uu),
    uv: second(map!.u, map!.v, map!.uv),
    vv: second(map!.v, map!.v, map!.vv),
  };
}

/** Actual source domains reject trials before calling original functions. */
function chartPoint(
  field: IAutoMovieSolidSurface,
  point: readonly number[],
): void {
  if (
    !Array.isArray(point) ||
    point.length !== 2 ||
    !point.every(Number.isFinite) ||
    (field.domain !== undefined &&
      (point[0]! < field.domain[0] || point[0]! > field.domain[1]))
  )
    fail("A known port map leaves its actual neighboring field domain.");
}

/** No query with nonfinite total2 or a collapsed tangent plane is a regular band point. */
function regular(
  jet: IAutoMovieSolidSurface.IJet,
): IAutoMovieSolidSurface.IJet {
  for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
    vector(jet[key]);
  const normal: Vector = [
    jet.u[1] * jet.v[2] - jet.u[2] * jet.v[1],
    jet.u[2] * jet.v[0] - jet.u[0] * jet.v[2],
    jet.u[0] * jet.v[1] - jet.u[1] * jet.v[0],
  ];
  const size: number = Math.hypot(...normal);
  if (!(Number.isFinite(size) && size > 0))
    fail("The actual known-port query has no finite regular tangent plane.");
  return jet;
}

/** Require every actual world component; no missing field is interpreted as zero. */
function vector(value: readonly number[]): void {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    !value.every(Number.isFinite)
  )
    fail("A known port requires complete finite actual world vectors.");
}

/** Exact polynomial endpoint-flat weight and its two normalized transverse derivatives. */
function weights(v: number): readonly [number, number, number] {
  return [
    v * v * v * (10 - 15 * v + 6 * v * v),
    30 * v * v * (1 - v) * (1 - v),
    60 * v * (1 - v) * (1 - 2 * v),
  ];
}

/** Convex point blend uses the actual fields, without extrapolated boundary jets. */
function combine(a: Vector, b: Vector, h: number): Vector {
  return [0, 1, 2].map(
    (k: number): number => (1 - h) * a[k]! + h * b[k]!,
  ) as Vector;
}

/** Product-rule differences carry the weight derivatives in physical world units. */
function difference(a: Vector, b: Vector, factor: number): Vector {
  return [0, 1, 2].map(
    (k: number): number => factor * (b[k]! - a[k]!),
  ) as Vector;
}

/** Add product-rule contributions without retaining either input. */
function add(a: Vector, b: Vector): Vector {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** A finite positive interval must also have a representable span. */
function interval(domain: readonly [number, number]): boolean {
  return (
    domain.every(Number.isFinite) &&
    domain[1] > domain[0] &&
    Number.isFinite(domain[1] - domain[0])
  );
}

/** Keep numeric admission separate from original callback exception identity. */
function fail(message: string): never {
  throw new AutoMovieLoftAdmissionError(message);
}
