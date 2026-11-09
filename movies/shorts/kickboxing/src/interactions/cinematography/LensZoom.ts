import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The zoom a lens takes from where it stands: the vertical field of view
 * whose frame the framed subjects fill by their shot size's share. A lens far
 * from the ring zooms in, as a broadcast wide camera's long lens does, so the
 * fighters fill the wide shot from fifteen metres; every lens stays inside
 * its zoom's range of fields.
 *
 * ```ts
 * LensZoom.fieldOfView(lens, spheres, 0.75, 16 / 9, CoverageLaw.zoom("wide"));
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#practice Far cameras use long box zooms; apron operators portable zooms.
 */
export namespace LensZoom {
  /**
   * The vertical field of view that frames the subjects at a fill share.
   *
   * @param lens The lens position and look-at point.
   * @param spheres The framed subjects' bounding spheres.
   * @param fill Share of the frame the subjects fill along their larger extent, in (0, 1].
   * @param aspect Frame width over height.
   * @param range The narrowest and widest vertical field of view the lens zooms between, radians.
   * @returns Radians, inside the range.
   */
  export function fieldOfView(
    lens: { position: IAutoMovieVector3; target: IAutoMovieVector3 },
    spheres: readonly { center: IAutoMovieVector3; radius: number }[],
    fill: number,
    aspect: number,
    range: { narrowest: number; widest: number },
  ): number {
    const widest: number = range.widest;
    const forward: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(lens.target, lens.position),
    );
    const right: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(forward, { x: 0, y: 1, z: 0 }),
    );
    const up: IAutoMovieVector3 = Vector3.cross(right, forward);
    let tan: number = 0;
    for (const s of spheres) {
      const v: IAutoMovieVector3 = Vector3.subtract(s.center, lens.position);
      const depth: number = Vector3.dot(v, forward);
      if (depth <= s.radius) return widest;
      tan = Math.max(
        tan,
        (Math.abs(Vector3.dot(v, up)) + s.radius) / depth,
        (Math.abs(Vector3.dot(v, right)) + s.radius) / depth / aspect,
      );
    }
    return Math.max(
      range.narrowest,
      Math.min(widest, 2 * Math.atan(tan / fill)),
    );
  }
}
