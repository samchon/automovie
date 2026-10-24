import { AutoMovieHumanHermiteCurve } from "../lofting/AutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import { AutoMovieHumanSkinVector as V } from "./AutoMovieHumanSkinVector";

/** Lip albedo bounded by the observed exterior courses, excluding oral interior arcs. */
export namespace AutoMovieHumanVermilion {
  /** Prepared exterior boundary in calibration millimetres. */
  export interface IBoundary {
    /** Samples of the unchanged physical Hermite polynomial. */
    points: V.Vec3[];
    /** Finite anterior support interval of those external courses. */
    depth: [number, number];
    /** Frontal-plane bounds, minimum y/z followed by maximum y/z. */
    box: [number, number, number, number];
  }

  /** Prepare one per-generation query boundary, also returned to construction. */
  export function prepare(curve: IAutoMovieHumanHermiteCurve): IBoundary {
    if (!curve.closed)
      throw new Error("Vermilion requires a closed exterior boundary");
    const points: V.Vec3[] = AutoMovieHumanHermiteCurve.sample(curve, 0.25);
    return {
      points,
      depth: [
        Math.min(...points.map((p: V.Vec3): number => p[0])),
        Math.max(...points.map((p: V.Vec3): number => p[0])),
      ],
      box: [
        Math.min(...points.map((p: V.Vec3): number => p[1])),
        Math.min(...points.map((p: V.Vec3): number => p[2])),
        Math.max(...points.map((p: V.Vec3): number => p[1])),
        Math.max(...points.map((p: V.Vec3): number => p[2])),
      ],
    };
  }

  /**
   * Frontal signed distance with a 1.2 mm colour transition. The finite
   * anterior window and outward-facing normal exclude unrelated posterior
   * or inward oral surfaces; neither a synthetic closing chord nor an
   * elliptical guess defines the external vermilion. Depth padding is an
   * appearance convention allowing the fitted skin's local residual.
   */
  export function weight(boundary: IBoundary, p: V.Vec3, n: V.Vec3): number {
    const edge: number = 1.2;
    const box: IBoundary["box"] = boundary.box;
    if (
      p[1] < box[0] - edge ||
      p[1] > box[2] + edge ||
      p[2] < box[1] - edge ||
      p[2] > box[3] + edge ||
      p[0] < boundary.depth[0] - 2 ||
      p[0] > boundary.depth[1] + 2
    )
      return 0;
    let inside: boolean = false;
    let nearest: number = Infinity;
    for (let i: number = 0; i < boundary.points.length; i++) {
      const a: V.Vec3 = boundary.points[i]!;
      const b: V.Vec3 = boundary.points[(i + 1) % boundary.points.length]!;
      const dy: number = b[1] - a[1],
        dz: number = b[2] - a[2];
      const length: number = dy * dy + dz * dz;
      const t: number =
        length === 0
          ? 0
          : Math.min(
              1,
              Math.max(0, ((p[1] - a[1]) * dy + (p[2] - a[2]) * dz) / length),
            );
      nearest = Math.min(
        nearest,
        Math.hypot(p[1] - a[1] - t * dy, p[2] - a[2] - t * dz),
      );
      if (
        a[1] > p[1] !== b[1] > p[1] &&
        p[2] < a[2] + ((p[1] - a[1]) * dz) / dy
      )
        inside = !inside;
    }
    const depth: number =
      V.smooth((p[0] - boundary.depth[0] + 2) / edge) *
      V.smooth((boundary.depth[1] + 2 - p[0]) / edge);
    return (
      depth *
      V.smooth(0.5 + (inside ? nearest : -nearest) / edge) *
      V.smooth((n[0] + 0.2) / 0.3)
    );
  }
}
