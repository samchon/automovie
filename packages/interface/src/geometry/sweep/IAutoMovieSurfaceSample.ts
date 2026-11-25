import type { IAutoMovieSurfaceCurveRig } from "./IAutoMovieSurfaceCurveRig";
import type { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * One point of a patch side or loop as a surface rig plans it: its identity,
 * how it is written per pose, and what it lies on, which decides the direction
 * a bridge leaves it along. Its writer is made lazily, so a point sampled again
 * for a ring or a loop registers nothing twice.
 */
export interface IAutoMovieSurfaceSample {
  /**
   * Stable welding identity: sweep name with clamped u and wrapped v quantized
   * to nine decimals, curve name with quantized share, or free node name.
   * Registry equality is string equality, not spatial proximity.
   */
  key: string;

  /**
   * Make the writer of a point that is not a sweep point, registering the slots
   * it reads; called once, when the point first becomes a vertex.
   *
   * @returns A writer taking a borrowed Float64Array and scalar offset, writing
   *   three model-space metre coordinates after bones, sweeps and curves
   *   update; the writer retains bound rig state and propagates its failures
   */
  writer(): (out: Float64Array, at: number) => void;

  /**
   * For a point of a sweep, its sweep's name, domain point and the spacing this
   * sampling gives its cell, below and above along `u` then along `v`, infinite
   * where it gives none; otherwise null. Sweep points are finalized once every
   * patch has sampled them, so the cell does not depend on patch order.
   */
  point: {
    /**
     * Network sweep name whose registry resolves this point's shared sampling
     * footprint.
     */
    sweep: string;

    /**
     * Normalized chord-length position along the sweep spine, clamped to [0,1]
     * by sweep evaluation and identity construction.
     */
    u: number;

    /**
     * Section coordinate in turns, wrapped modulo one for identity. Direction
     * correspondence uses polar angle; parameter correspondence uses the
     * section curve parameter.
     */
    v: number;

    /**
     * Sample spacing below/above u, then below/above v, in dimensionless
     * parameter units. Quadrature reaches half each resolved spacing. Infinity
     * leaves that side unconstrained; the registry takes the smallest supplied
     * spacing and mirrors an unconstrained opposite side, or uses zero if both
     * sides are unconstrained.
     */
    cell: [number, number, number, number];
  } | null;

  /**
   * The sweep and domain point it lies on, for a point of a sweep edge;
   * otherwise null.
   */
  sweep: {
    /**
     * Borrowed compiled sweep rig whose live pose supplies the loop's normal or
     * spine derivative. It must be updated before a bridge reads its probes.
     */
    rig: IAutoMovieSweepRig;

    /**
     * Normalized chord-length position used with the sweep rig's section point
     * and probe registration.
     */
    u: number;

    /**
     * Section turn used with the sweep rig; wraps with the sweep's section
     * parameter convention.
     */
    v: number;
  } | null;

  /**
   * The curve and share it lies at, for a point of a curve edge; otherwise
   * null.
   */
  curve: {
    /**
     * Borrowed network-curve rig. Update it after its source sweeps/bones and
     * before reading bridge points, normals or declared directions.
     */
    rig: IAutoMovieSurfaceCurveRig;

    /**
     * Curve share in [0,1], used consistently for point and blended normal
     * queries.
     */
    t: number;
  } | null;
}
