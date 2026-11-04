import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The heading of a strand resting on the body: down the body's surface
 * within the vertical plane through the head's vertical axis, so resting
 * strands move out from the neck and down the shoulders and back without
 * parting along a ridge such as the spine, where the surface's own fall line
 * turns to either side; level where the surface rises outward, since resting
 * hair never climbs.
 */
export namespace AutoMovieHumanHairContactDescent {
  /**
   * Heading down the surface.
   *
   * @param n Unit body normal, upward component positive
   * @param p Current point, head-local millimetres
   * @returns Unit heading
   */
  export function descend(
    n: AutoMovieHumanSkinVector.Vec3,
    p: AutoMovieHumanSkinVector.Vec3,
  ): AutoMovieHumanSkinVector.Vec3 {
    const r: number = Math.hypot(p[0], p[2]);
    const d: AutoMovieHumanSkinVector.Vec3 =
      r > 1e-9 ? [p[0] / r, 0, p[2] / r] : [1, 0, 0];

    // The slope that keeps the strand on the surface, never rising.
    const s: number = Math.min(
      0,
      -AutoMovieHumanSkinVector.dot(n, d) / Math.max(n[1], 1e-3),
    );
    return AutoMovieHumanSkinVector.normalize([d[0], s, d[2]]);
  }
}
