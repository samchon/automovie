import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * Queries on the head chart's skin that the hairline pieces share: the skin
 * point at an azimuth and a height, and the azimuth at which the skin stands
 * a given distance from the midline. Both march over the chart's measured
 * skin (`AutoMovieHumanHeadField`), in the chart's head-local frame.
 */
export namespace AutoMovieHumanScalpSurface {
  /**
   * The skin point at an azimuth whose model height is given: marches down
   * from the vertex in quarter-cell steps of elevation over measured skin
   * until the crossing falls to that height, then bisects the last step
   * forty times. Over the vault and the forehead the crossing's height falls
   * monotonically with elevation, so the first bracket is the skin point.
   *
   * @param field Head chart
   * @param alpha Azimuth from +X toward +Z, radians
   * @param height Model height, millimetres
   * @returns Head-local point, or null when the measured skin at that azimuth
   *   never reaches the height
   */
  export function level(
    field: AutoMovieHumanHeadField.IField,
    alpha: number,
    height: number,
  ): AutoMovieHumanSkinVector.Vec3 | null {
    const at: (beta: number) => AutoMovieHumanSkinVector.Vec3 | null = (
      beta: number,
    ): AutoMovieHumanSkinVector.Vec3 | null => {
      const u: AutoMovieHumanSkinVector.Vec3 =
        AutoMovieHumanHeadField.direction(alpha, beta);
      if (!AutoMovieHumanHeadField.covered(field, u)) return null;
      const r: number = AutoMovieHumanHeadField.radius(field, u);
      return [u[0] * r, u[1] * r, u[2] * r];
    };
    const delta: number = Math.PI / AutoMovieHumanHeadField.elevationCells / 4;
    let high: number = Math.PI / 2;
    for (
      let beta: number = Math.PI / 2 - delta;
      beta > -Math.PI / 2;
      beta -= delta
    ) {
      const p: AutoMovieHumanSkinVector.Vec3 | null = at(beta);
      if (p === null) return null;
      if (field.centre[1] + p[1] <= height) {
        let low: number = beta;
        for (let k: number = 0; k < 40; ++k) {
          const mid: number = (low + high) / 2;
          const q: AutoMovieHumanSkinVector.Vec3 | null = at(mid);
          if (q !== null && field.centre[1] + q[1] > height) high = mid;
          else low = mid;
        }
        return at(low);
      }
      high = beta;
    }
    return null;
  }

  /**
   * The front midline skin point at a model height.
   *
   * @param field Head chart
   * @param height Model height, millimetres
   * @returns Head-local point, or null where the skin does not reach it
   */
  export function front(
    field: AutoMovieHumanHeadField.IField,
    height: number,
  ): AutoMovieHumanSkinVector.Vec3 | null {
    return level(field, 0, height);
  }

  /**
   * Azimuth on the canonical side where the skin at a model height stands a
   * given lateral distance from the midline: bisection over azimuth from the
   * front midline to the side, along which the lateral distance grows.
   *
   * @param field Head chart
   * @param midline Head-local lateral coordinate of the midline, millimetres
   * @param height Model height, millimetres
   * @param lateral Distance from the midline, millimetres
   * @returns Azimuth in radians, or null where the skin there is narrower
   */
  export function azimuth(
    field: AutoMovieHumanHeadField.IField,
    midline: number,
    height: number,
    lateral: number,
  ): number | null {
    const offset: (alpha: number) => number | null = (
      alpha: number,
    ): number | null => {
      const p: AutoMovieHumanSkinVector.Vec3 | null = level(
        field,
        alpha,
        height,
      );
      return p === null ? null : p[2] - midline;
    };
    let low: number = 0;
    let high: number = Math.PI / 2;
    const top: number | null = offset(high);
    if (top === null || top < lateral) return null;
    for (let k: number = 0; k < 40; ++k) {
      const mid: number = (low + high) / 2;
      const o: number | null = offset(mid);
      if (o !== null && o >= lateral) high = mid;
      else low = mid;
    }
    return high;
  }
}
