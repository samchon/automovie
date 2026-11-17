import {
  Quaternion,
  Vector3,
  adjacentAutoMovieFloat64,
  rotationBetween,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { ArchetypeFrame } from "../core/ArchetypeFrame";

/**
 * Analytic level-ground support over a complete declared rotation about model -X.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines model metres, degree intervals, one fixed vertical pivot, exact box/cylinder support families, outward binary64 arithmetic and maximum representable section design without an authored floor gap.
 * @evidence contracts/development/design.md#principled-representation A point's height is H+y*cos(angle)+z*sin(angle). Box support reduces to its actual YZ corners; an X-axis cylinder subtracts radius and a sagittal cylinder reduces its circular support to two sinusoidal signs at each endpoint.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns only the siege construction's angular support and representable section search; existing primitive geometry, articulation, launch and total mass remain with their owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose grid, picture tuning, runtime projection, raised ground, safety padding or hidden proxy replaces the actual emitted solid.
 */
export namespace SiegeClearance {
  /**
   * Lowest point height over an interval, including interior stationary points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Height and cosine/sine coefficients are metres relative to a fixed pivot; interval endpoints are degrees. Directed arithmetic is numerical enclosure rather than physical clearance.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluate both endpoints and include H-hypot(y,z) when atan2(z,y)+pi lies in the interval modulo a full turn. An interval spanning a full turn necessarily includes that minimum. Products/sums round downward and stationary amplitude upward by adjacent binary64 values; computed zeros remain zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit scalars, evaluate endpoints and test the periodic stationary minimum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampling, angular tolerance or displaced geometry approximates a missed extremum; nonrepresentable support refuses.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant arithmetic and one periodic-inclusion test.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Box corners, cylinder support and the complete section-design predicate use this same analytic minimum.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no state.
   */
  export function minimum(
    height: number,
    cosine: number,
    sine: number,
    first: number,
    last: number,
  ): number {
    if (
      ![height, cosine, sine, first, last].every((value: number): boolean =>
        Number.isFinite(value),
      ) ||
      last < first
    )
      throw new RangeError(
        "Siege angular support needs a finite ordered domain",
      );
    const a: number = (first * Math.PI) / 180;
    const b: number = (last * Math.PI) / 180;
    const turn: number = 2 * Math.PI;
    const stationary: number = Math.atan2(sine, cosine) + Math.PI;
    let low: number = Math.min(at(a), at(b));
    if (
      b - a >= turn ||
      Math.ceil((a - stationary) / turn) <= Math.floor((b - stationary) / turn)
    )
      low = Math.min(low, down(height - up(Math.hypot(cosine, sine))));
    if (!Number.isFinite(low))
      throw new RangeError("Siege angular support is not representable");
    return low;

    /** Outward arithmetic retains the physical zero rather than adding a length margin. */
    function at(angle: number): number {
      return down(
        down(height + down(cosine * Math.cos(angle))) +
          down(sine * Math.sin(angle)),
      );
    }
  }

  /**
   * Lowest actual unrotated box surface after its carrier's complete X rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual centre/full dimensions and pivot height are metres; angle interval is degrees; no mesh or proxy is consumed.
   * @evidence contracts/development/implementation.md#principled-implementation All four YZ corner combinations supply the box's complete analytic support for an X-axis carrier. At endpoint/stationary angles and adjacent representable angle inputs, the same generic turn/move arithmetic independently admits actual rounded primitive transforms and eight corners.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reduce four analytic corner minima, then inspect actual transformed corners at the finite critical-clock representation boundary.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never replaces a box by its centre or discards longitudinal half-depth.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four analytic minima and a bounded endpoint/stationary-neighbor set of eight-corner transform checks; no angle grid or model build.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses minimum for every corner rather than another angular solver.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or external resource.
   */
  export function box(
    at: IAutoMovieVector3,
    size: IAutoMovieVector3,
    height: number,
    first: number,
    last: number,
  ): number {
    let low: number = Infinity;
    const candidates: Set<number> = new Set([first, last]);
    for (const y of [-1, 1] as const)
      for (const z of [-1, 1] as const) {
        const cosine: number = at.y + (y * size.y) / 2 - height;
        const sine: number = at.z + (z * size.z) / 2;
        low = Math.min(low, minimum(height, cosine, sine, first, last));
        critical(candidates, cosine, sine, first, last);
      }
    for (const angle of neighbours(candidates, first, last)) {
      const current: ReturnType<typeof ArchetypeFrame.upright> =
        ArchetypeFrame.move(
          ArchetypeFrame.turn(
            { x: 0, y: height, z: 0 },
            { x: -1, y: 0, z: 0 },
            angle,
          ),
          ArchetypeFrame.upright(at),
        );
      for (const x of [-1, 1] as const)
        for (const y of [-1, 1] as const)
          for (const z of [-1, 1] as const)
            low = Math.min(
              low,
              Vector3.add(
                current.translation,
                Quaternion.rotateVector(current.rotation, {
                  x: (x * size.x) / 2,
                  y: (y * size.y) / 2,
                  z: (z * size.z) / 2,
                }),
              ).y,
            );
    }
    return low;
  }

  /**
   * Lowest finite-cylinder surface for the actual X or sagittal source axis.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual endpoint/radius metres, fixed pivot and degree interval describe the source cylinder; supported axes are the siege's X crossshafts and YZ-plane rods.
   * @evidence contracts/development/implementation.md#principled-implementation For an X crossshaft, vertical radial support is radius. For a YZ axis u, support is radius*abs(u.z*cos(angle)-u.y*sin(angle)); two signs at each endpoint cover the complete flat-capped solid. The builder's vector length/rotationBetween and generic turn/move arithmetic also admit actual rounded cylinder support at the finite critical clocks and their adjacent inputs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reduce endpoint/circular-support analytic minima, construct the same primitive rigid frame and check its critical-clock representability.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No capsule cap, centre-only floor test or invented projection substitutes for the actual flat-capped cylinder; unsupported axes refuse.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most four analytic minima and a bounded critical-neighbor set of constant-size primitive-frame checks, independent of interval length.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares minimum with actual box corners and the section design.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no cylinder or pose history.
   */
  export function cylinder(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    radius: number,
    height: number,
    first: number,
    last: number,
  ): number {
    const length: number = Vector3.length(Vector3.subtract(to, from));
    if (
      !(
        Number.isFinite(length) &&
        length > 0 &&
        Number.isFinite(radius) &&
        radius >= 0
      )
    )
      throw new RangeError("Siege support needs an actual finite cylinder");
    const candidates: Set<number> = new Set([first, last]);
    let low: number = Infinity;
    if (from.y === to.y && from.z === to.z) {
      low = down(
        minimum(height, from.y - height, from.z, first, last) - radius,
      );
      critical(candidates, from.y - height, from.z, first, last);
    } else {
      if (from.x !== to.x)
        throw new RangeError("Siege cylinder axis must be X or sagittal");
      const y: number = (to.y - from.y) / length;
      const z: number = (to.z - from.z) / length;
      for (const point of [from, to])
        for (const sign of [-1, 1] as const) {
          const cosine: number = point.y - height + sign * radius * z;
          const sine: number = point.z - sign * radius * y;
          low = Math.min(low, minimum(height, cosine, sine, first, last));
          critical(candidates, cosine, sine, first, last);
        }
    }
    const rest: ReturnType<typeof ArchetypeFrame.upright> = {
      translation: Vector3.scale(Vector3.add(from, to), 0.5),
      rotation: rotationBetween(
        { x: 0, y: 1, z: 0 },
        Vector3.subtract(to, from),
      ),
      scale: { x: 1, y: 1, z: 1 },
    };
    for (const angle of neighbours(candidates, first, last)) {
      const current: typeof rest = ArchetypeFrame.move(
        ArchetypeFrame.turn(
          { x: 0, y: height, z: 0 },
          { x: -1, y: 0, z: 0 },
          angle,
        ),
        rest,
      );
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        current.rotation,
        { x: 0, y: 1, z: 0 },
      );
      low = Math.min(
        low,
        current.translation.y -
          (Math.abs(axis.y) * length) / 2 -
          radius * Math.hypot(axis.x, axis.z),
      );
    }
    return low;
  }

  /**
   * Select a representable section at the boundary of a monotone support domain.
   *
   * @param maximum Authored positive section cap in metres.
   * @param fits Analytic whole-assembly support predicate, including the zero-radius limit.
   * @returns A positive finite radius; the caller emits that same construction.
   * @throws {RangeError} If no positive representable section fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the authored cap, zero-radius limiting premise, monotone homothetic section domain and admitted positive binary64 boundary value; no physical safety gap is added.
   * @evidence contracts/development/implementation.md#principled-implementation Positive binary64 encodings are ordered integers. Bisect the finite cap's encoding against feasible zero until adjacent encodings remain, using the same actual rounded CAD definition and analytic support predicate for each candidate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit cap/zero limit, keep an already feasible cap or search its finite representation interval, then admit the positive result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixed radius fraction, epsilon, floor shift, angle grid or capture-only correction chooses the section. Finite critical-clock representability checks supplement the full analytic support domain rather than replacing it.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 63 encoding halvings plus three boundary admissions, each calling the fixed-size analytic construction predicate; no model build, integration or mesh search occurs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller's same dimension-derived cradle records serve admission and final emission; the engine owns adjacent-float rounding.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One call-local eight-byte view and scalar encodings; no retained query, model, cache or external resource.
   */
  export function radius(
    maximum: number,
    fits: (radius: number) => boolean,
  ): number {
    if (!(Number.isFinite(maximum) && maximum > 0) || !fits(0))
      throw new RangeError(
        "Siege centreline/cord domain cannot clear the declared floor",
      );
    if (fits(maximum)) return maximum;
    const view: DataView = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, maximum, false);
    let low: bigint = 0n;
    let high: bigint = view.getBigUint64(0, false);
    while (high - low > 1n) {
      const middle: bigint = (low + high) / 2n;
      view.setBigUint64(0, middle, false);
      if (fits(view.getFloat64(0, false))) low = middle;
      else high = middle;
    }
    view.setBigUint64(0, low, false);
    const result: number = view.getFloat64(0, false);
    if (!(result > 0 && fits(result)))
      throw new RangeError("No representable siege section clears the floor");
    return result;
  }
}

/** Move arithmetic toward the lower representable bound, preserving exact zeros. */
function down(value: number): number {
  return value === 0 ? 0 : adjacentAutoMovieFloat64(value, false);
}

/** Move an amplitude toward the upper representable bound, preserving exact zero. */
function up(value: number): number {
  return value === 0 ? 0 : adjacentAutoMovieFloat64(value, true);
}

/** Include the exact periodic stationary angle without enumerating whole turns. */
function critical(
  angles: Set<number>,
  cosine: number,
  sine: number,
  first: number,
  last: number,
): void {
  const base: number = (Math.atan2(sine, cosine) * 180) / Math.PI + 180;
  const angle: number = base + 360 * Math.ceil((first - base) / 360);
  if (angle >= first && angle <= last) angles.add(angle);
}

/** Check actual rigid-transform representability at critical clocks and adjacent inputs. */
function neighbours(
  angles: ReadonlySet<number>,
  first: number,
  last: number,
): readonly number[] {
  const result: Set<number> = new Set(angles);
  for (const angle of angles)
    for (const upper of [false, true]) {
      const neighbour: number = adjacentAutoMovieFloat64(angle, upper);
      if (neighbour >= first && neighbour <= last) result.add(neighbour);
    }
  return [...result];
}
