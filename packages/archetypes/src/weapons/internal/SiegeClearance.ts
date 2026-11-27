import { AutoMovieEngineMath, AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";

/*
 * Analytic level-ground support over a complete declared rotation about model
 * -X.
 */
export namespace SiegeClearance {
  /*
   * Lowest point height over an interval, including interior stationary points.
   */
  export function minimum(
    height: number,
    cosine: number,
    sine: number,
    first: number,
    last: number,
  ): number {
    if (last < first)
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
    return low;

    /*
     * Outward arithmetic retains the physical zero rather than adding a length
     * margin.
     */
    function at(angle: number): number {
      return down(
        down(height + down(cosine * Math.cos(angle))) +
          down(sine * Math.sin(angle)),
      );
    }
  }

  /*
   * Lowest unrotated box surface after its carrier's complete X rotation.
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
      const current: ReturnType<typeof AutoMovieArchetypeFrame.upright> =
        AutoMovieArchetypeFrame.move(
          AutoMovieArchetypeFrame.turn(
            { x: 0, y: height, z: 0 },
            { x: -1, y: 0, z: 0 },
            angle,
          ),
          AutoMovieArchetypeFrame.upright(at),
        );
      for (const x of [-1, 1] as const)
        for (const y of [-1, 1] as const)
          for (const z of [-1, 1] as const)
            low = Math.min(
              low,
              AutoMovieEngineVector3.add(
                current.translation,
                AutoMovieEngineQuaternion.rotateVector(current.rotation, {
                  x: (x * size.x) / 2,
                  y: (y * size.y) / 2,
                  z: (z * size.z) / 2,
                }),
              ).y,
            );
    }
    return low;
  }

  /*
   * Lowest finite-cylinder surface for the X or sagittal source axis.
   */
  export function cylinder(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    radius: number,
    height: number,
    first: number,
    last: number,
  ): number {
    const length: number = AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(to, from));
    if (!(length > 0 && radius >= 0))
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
    const rest: ReturnType<typeof AutoMovieArchetypeFrame.upright> = {
      translation: AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(from, to), 0.5),
      rotation: AutoMovieEngineMath.rotationBetween(
        { x: 0, y: 1, z: 0 },
        AutoMovieEngineVector3.subtract(to, from),
      ),
      scale: { x: 1, y: 1, z: 1 },
    };
    for (const angle of neighbours(candidates, first, last)) {
      const current: typeof rest = AutoMovieArchetypeFrame.move(
        AutoMovieArchetypeFrame.turn(
          { x: 0, y: height, z: 0 },
          { x: -1, y: 0, z: 0 },
          angle,
        ),
        rest,
      );
      const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
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

  /*
   * Select a representable section at the boundary of a monotone support
   * domain.
   * Parameter maximum: Authored positive section cap in metres.
   * Parameter fits: Analytic whole-assembly support predicate, including the
   * zero-radius limit.
   * Returns: A positive finite radius; the caller emits that same construction.
   * If no positive representable section fits.
   */
  export function radius(
    maximum: number,
    fits: (radius: number) => boolean,
  ): number {
    if (!(maximum > 0) || !fits(0))
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

/*
 * Move arithmetic toward the lower representable bound, preserving exact zeros.
 */
function down(value: number): number {
  return value === 0 ? 0 : AutoMovieEngineMath.adjacentFloat64(value, false);
}

/*
 * Move an amplitude toward the upper representable bound, preserving exact
 * zero.
 */
function up(value: number): number {
  return value === 0 ? 0 : AutoMovieEngineMath.adjacentFloat64(value, true);
}

/*
 * Include the exact periodic stationary angle without enumerating whole turns.
 */
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

/*
 * Check rigid-transform representability at critical clocks and adjacent
 * inputs.
 */
function neighbours(
  angles: ReadonlySet<number>,
  first: number,
  last: number,
): readonly number[] {
  const result: Set<number> = new Set(angles);
  for (const angle of angles)
    for (const upper of [false, true]) {
      const neighbour: number = AutoMovieEngineMath.adjacentFloat64(
        angle,
        upper,
      );
      if (neighbour >= first && neighbour <= last) result.add(neighbour);
    }
  return [...result];
}
