import type { IAutoMovieConstructionKnownPort } from "@automovie/interface";

import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Actual original field and chart-map owners of a known port.
 *
 * The immutable invocation owns these functions before either side is lofted.
 * Maps read original field-chart coordinates, with their actual parameter units;
 * their input order is (original clock, normalized transverse), while the
 * returned kernel surface uses (transverse, clock) and transposed total2.
 * world fields use kernel millimetres. A null map total2 stays unavailable.
 * Runtime evaluators preserve foreign callback/getter exceptions unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Both existing SolidSurface fields and exact chart maps supply the actual whole neighboring functions needed by composition's total2 chain rule.
 * @evidence contracts/common.md#clear-and-simple-design Explicit lookup maps connect the pure closed band descriptor to actual generating owners without a second sampled representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither a map key nor a matching rail position proves C2 or shared binding; supplied maps must differentiate their own actual point map on the full rectangle, and sources must be original owned fields.
 * @evidence contracts/common.md#meaningful-documentation States clock/chart/world units, immutable source lifetime and unavailable/exception behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This runtime input type chooses no evaluation algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Both rails and the band can borrow the same immutable original field/map owners; equivalence depends on all actual geometry and constraint dependencies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The retaining invocation owns fields/maps and transitive source closures; no global lookup, source cache, handle or task is acquired by the type.
 */
export interface IAutoMovieConstructionKnownPortSource {
  /** Closed original-port declaration, immutable during consumption. */
  definition: IAutoMovieConstructionKnownPort;

  /** Actual original neighboring fields, not completed-loft contact reconstructions. */
  fields: ReadonlyMap<string, IAutoMovieSolidSurface>;

  /** Actual maps into those field charts, covering the whole declared rectangle. */
  maps: ReadonlyMap<string, IAutoMovieConstructionKnownPortSource.IMap>;
}

export namespace IAutoMovieConstructionKnownPortSource {
  /** Pair of field-chart coordinates, with that field's original parameter units. */
  export type Vector = [number, number];

  /** Complete total2 of the actual map from band clock u and normalized transverse v. */
  export interface IJet {
    /** Actual field-chart point. */
    p: Vector;
    /** First derivative per band tangential-clock unit. */
    u: Vector;
    /** First derivative per normalized band transverse unit. */
    v: Vector;
    /** Second tangential derivative. */
    uu: Vector;
    /** Mixed tangential/transverse derivative. */
    uv: Vector;
    /** Second transverse derivative. */
    vv: Vector;
  }

  /** One original source-chart correspondence over the full band rectangle. */
  export interface IMap {
    /** Actual tangential-clock domain in the same units as definition.domain. */
    domain: readonly [number, number];

    /** Actual normalized transverse domain, containing the entire interval [0,1]. */
    transverse: readonly [number, number];

    /** Actual field-chart point, independent of derivative availability. */
    point(u: number, v: number): Vector;

    /** Actual map total2, or null where genuinely unavailable. */
    jet(u: number, v: number): IJet | null;
  }
}
