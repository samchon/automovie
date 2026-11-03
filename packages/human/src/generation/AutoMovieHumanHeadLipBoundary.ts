import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadUpperLip } from "./AutoMovieHumanHeadUpperLip";
import { AutoMovieHumanHeadSkinReading } from "./AutoMovieHumanHeadSkinReading";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * The lips' colour boundary as a closed run of Hermite spans: the upper
 * vermilion's border with its Cupid's bow and the lower's, on the skin.
 */
export namespace AutoMovieHumanHeadLipBoundary {
  /** The lips' colour boundary, a closed run of Hermite spans. */
  export function lipSpans(surface: IAutoMovieHumanHeadSurface): IAutoMovieHumanHermiteCurve["spans"] {
    const { plan } = surface;
    const k: number = plan.scale;
    const borderUpper = (u: number): number =>
      plan.stomion + 1.2 * k * u * u + AutoMovieHumanHeadUpperLip.border(plan, u);
    const borderLower = (u: number): number =>
      plan.stomion +
      1.2 * k * u * u -
      plan.lowerLip * Math.max(0, 1 - u * u) ** 0.65;
    const place = (y: number, z: number): Vec3 => [
      AutoMovieHumanHeadSkinReading.frontAt(surface, y, z),
      y,
      z,
    ];
    const points: Vec3[] = [];
    const N: number = 12;
    const up = (i: number): number => Math.sin(((i / N) * Math.PI) / 2);
    for (let i: number = 0; i < N; i++)
      points.push(place(borderUpper(up(i)), up(i) * plan.mouthWidth));
    for (let i: number = N; i > 0; i--)
      points.push(place(borderLower(up(i)), up(i) * plan.mouthWidth));
    for (let i: number = 0; i < N; i++)
      points.push(place(borderLower(up(i)), -up(i) * plan.mouthWidth));
    for (let i: number = N; i > 0; i--)
      points.push(place(borderUpper(up(i)), -up(i) * plan.mouthWidth));
    const n: number = points.length;
    const tangent = (i: number): Vec3 => {
      const a: Vec3 = points[(i + n - 1) % n]!;
      const b: Vec3 = points[(i + 1) % n]!;
      const l: number = AutoMovieHumanHeadMath.dist(a, b) || 1;
      return [(b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l];
    };
    return points.map(
      (p: Vec3, i: number): IAutoMovieHumanHermiteCurve["spans"][number] => ({
        address: `generated/span${i}`,
        interval: Math.max(1e-3, AutoMovieHumanHeadMath.dist(p, points[(i + 1) % n]!)),
        start: p,
        end: points[(i + 1) % n]!,
        startDerivative: tangent(i),
        endDerivative: tangent((i + 1) % n),
      }),
    );
  }
}

/** A point. */
type Vec3 = [number, number, number];
