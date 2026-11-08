import type { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/**
 * One closed or open skin surface as the solid operators read it: a smooth
 * map from its chart `(u, v)` to world millimetres with exact first and
 * second partial derivatives.
 *
 * The merge and the diff (`AutoMovieSolidMerge`, `AutoMovieSolidDiff`)
 * work on two such surfaces, find where they meet and blend them, so they need
 * nothing else of a part: a lofted chain is one with `u` its station and `v`
 * its phase (`AutoMovieSolidChain`), and a closed form is one in a test.
 * The derivatives must be the map's own, analytic or of a smooth fit, because
 * the intersection's tangent and curvature and the blend's G2 edges are built
 * from them; a difference across a step of the map would throw both.
 *
 * @evidence contracts/common.md#principled-implementation The operators read a smooth chart's exact 2-jets, period, orientation and domain; finite regular jets and compatible geometry remain caller premises, not facts certified by this interface.
 * @evidence contracts/common.md#clear-and-simple-design One jet function and three properties.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The jets must be the map's own; finite differences would break the trace and the G2 blend.
 * @evidence contracts/common.md#meaningful-documentation States the chart, the jet, the orientation rule and the domain.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface; costs are its implementations'.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No state of its own.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retention is its implementation's.
 */
export interface IAutoMovieSolidSurface {
  /** Name in diagnostics, such as `arm.left` or `trunk`. */
  name: string;

  /**
   * The point and partial derivatives at a chart point.
   *
   * @param u First chart parameter, such as a chain's station in mm.
   * @param v Second chart parameter, such as a chain's phase in radians.
   * @returns The surface's 2-jet there.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the map's value and analytic or smooth-fit first/second partials used by intersection tangents, surface normals and transverse ribbons.
   * @evidence contracts/common.md#clear-and-simple-design One reading keeps all six vectors at the same chart point rather than separate independently placed derivative queries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The signature neither validates regularity nor authorizes finite-difference substitutes; consumers reject out-of-domain trials before evaluation and unavailable physical2 remains an explicit admission failure.
   * @evidence contracts/common.md#meaningful-documentation Gives both parameter meanings and the result's derivative convention; vector aliasing and outside-domain behavior belong to the producer.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A callable type chooses no evaluator; SolidChain delegates to LoftJet, while other surfaces provide their own chart formulas.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract requires no cache; sharing a reading requires unchanged chart dependencies and compatible vector ownership.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The reader follows its producer's vector ownership; a returned jet may borrow vectors, and retained surface closures keep their own source data alive.
   */
  jet(u: number, v: number): IAutoMovieSolidSurface.IJet;

  /**
   * Actual Point0 where regular physical2 may be unavailable, such as a retained collapsed tip.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the same map's finite value independently of physical station derivatives; a collapsed original tip needs no invented regular chart.
   * @evidence contracts/common.md#clear-and-simple-design Optional value reading lets mesh replay preserve actual pole coordinates while analytic solvers continue to require jet.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not authorize an artificial cap, extrapolation or unavailable zero-filled derivative; an absent reader leaves existing jet.p value reading.
   * @evidence contracts/common.md#meaningful-documentation Inputs use the same chart/domain as jet and the producer owns returned vector freshness and explicit admission errors.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callable type does not choose an evaluator; the source implementation owns its cost.
   * @evidence contracts/performance.md#reuse-equivalent-work A value-only producer can reuse its existing station sampler without preparing physical2.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The retaining surface owns callback dependencies; returned vector ownership follows its producer and the interface adds no cache.
   */
  point?(u: number, v: number): AutoMovieSolidVector.Vec3;

  /**
   * Period of `v`, such as `2 pi` for a chain's phase. Absent, `v` is not
   * periodic and a traced curve may not wrap in it.
   */
  period?: number;

  /**
   * Sign that turns `S_u x S_v` into the outward normal, away from the
   * solid's inside: 1 when `S_u x S_v` already points out, -1 when it points
   * in. The operators read which side of one surface the other keeps from it.
   */
  orientation: 1 | -1;

  /**
   * Inclusive range of `u` actually owned by this map, including only retained
   * original cap intervals when its producer provides them. Solvers reject
   * outside trials before evaluating the map. Domain membership alone does not
   * supply regular physical2 at a collapsed tip. Absent, every finite `u` is owned.
   */
  domain?: [number, number];
}
export namespace IAutoMovieSolidSurface {
  /**
   * A surface's point and partial derivatives at one chart point. The point
   * is in world mm; each derivative divides by its named parameter units.
   *
   * @evidence contracts/common.md#principled-implementation The six-vector 2-jet represents a smooth two-parameter map, including one symmetric mixed partial for its curvature calculations.
   * @evidence contracts/common.md#clear-and-simple-design Named p/u/v/uu/uv/vv fields expose the exact orders consumed by Foot, Intersection and Ribbon without storing sampled neighbourhoods.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record asserts derivative meaning but cannot prove finiteness, mixed-partial consistency or a nonzero tangent cross product.
   * @evidence contracts/common.md#meaningful-documentation Identifies world space, derivative units and the producer-specific ownership of the vectors.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A six-field result type performs no numerical evaluation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no work; consumers may reuse it only while its source and borrowed vectors remain valid.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Holds six vector references; their storage and transitive source lifetime depend on the producing surface, with no cache or handle created by the type.
   */
  export interface IJet {
    /** Point. */
    p: AutoMovieSolidVector.Vec3;

    /** First derivative in `u`. */
    u: AutoMovieSolidVector.Vec3;

    /** First derivative in `v`. */
    v: AutoMovieSolidVector.Vec3;

    /** Second derivative in `u`. */
    uu: AutoMovieSolidVector.Vec3;

    /** Mixed derivative. */
    uv: AutoMovieSolidVector.Vec3;

    /** Second derivative in `v`. */
    vv: AutoMovieSolidVector.Vec3;
  }
}
