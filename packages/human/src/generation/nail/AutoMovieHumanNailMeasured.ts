import { AutoMovieSolidVector as Vec } from "@automovie/engine";
import type {
  IAutoMovieHumanNail,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

/** The original material surface supplies the measured longitudinal crown. */
export namespace AutoMovieHumanNailMeasured {
  /**
   * Fit a convex arch to the dorsal profile along the plate's medial plane. A
   * single symmetric quartic has zero end height and slope and unit height at
   * the middle. An underdetermined or nonconvex observation holds flat.
   */
  export function crown(
    faces: NonNullable<IAutoMovieHumanNail.ISetup["measuredFaces"]>,
    frame: IAutoMovieHumanNail.IFrame,
  ): (share: number) => number {
    const { origin, distal, dorsal } = frame;
    const lateral: P3 = Vec.cross(distal, dorsal);
    const chart = (p: P3): P3 => {
      const d: P3 = Vec.sub(p, origin);
      return [Vec.dot(d, distal), Vec.dot(d, dorsal), Vec.dot(d, lateral)];
    };
    const projected = faces.map(([a, b, c]): [P3, P3, P3] => [
      chart(a),
      chart(b),
      chart(c),
    ]);
    const points: P3[] = projected.flat();
    const x: number[] = points.map((p): number => p[0]);
    const z: number[] = points.map((p): number => p[2]);
    const left: number = Math.min(...x),
      right: number = Math.max(...x);
    const middle: number = (Math.min(...z) + Math.max(...z)) / 2;
    // Uniform millimetre observations span the original material face.
    const count: number = Math.ceil(right - left);
    const controls: { x: number; y: number }[] = [];
    for (let i: number = 0; i <= count; ++i) {
      const x: number = left + ((right - left) * i) / count;
      let height: number = -Infinity;
      for (const [a, b, c] of projected) {
        const u = Vec.sub(b, a),
          v = Vec.sub(c, a);
        const weights = Vec.solve2(u[0], v[0], u[2], v[2], [
          x - a[0],
          middle - a[2],
        ]);
        if (
          weights === null ||
          weights[0] < 0 ||
          weights[1] < 0 ||
          weights[0] + weights[1] > 1
        )
          continue;
        height = Math.max(height, a[1] + weights[0] * u[1] + weights[1] * v[1]);
      }
      if (Number.isFinite(height)) controls.push({ x, y: height });
    }
    if (controls.length < 3) return (): number => 0;
    const a = controls[0]!,
      b = controls.at(-1)!;
    const form = (u: number): number => 16 * u * u * (1 - u) * (1 - u);
    let response: number = 0,
      energy: number = 0;
    for (const q of controls) {
      const u: number = (q.x - a.x) / (b.x - a.x);
      const weight: number = form(u);
      response += weight * (q.y - a.y - u * (b.y - a.y));
      energy += weight * weight;
    }
    const amplitude: number = Math.max(0, response / energy);
    return (share): number => amplitude * form(share);
  }
}
