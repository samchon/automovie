import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Hof's pendulum over a weight shift in closed form: the centre of pressure
 * runs from `p` to `q` on a minimum-jerk course over `span` seconds (`p(t)
 * = p + (q - p) s(t / span)`, `s` the quintic `10 u^3 - 15 u^4 + 6 u^5`,
 * Flash and Hogan 1985), and the centre of mass follows `x'' = omega^2 (x -
 * p(t))`. A quintic's sixth derivative is zero, so `x_p = p + p'' / omega^2
 * + p'''' / omega^4` solves the equation exactly, and `x = x_p + A cosh(omega
 * t) + B sinh(omega t)` meets the span's initial travel and velocity.
 *
 * @param from The span's centre of pressure at its start, travel `s0` and velocity `v0`, entry-relative world metres and metres per second.
 * @param to The centre of pressure at the span's end.
 * @param span The span's seconds.
 * @param w The pendulum's frequency, radians per second.
 * @param u Seconds into the span, clamped to it.
 * @returns The travel, the velocity and the centre of pressure there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the course, the equation, its exact solution, the frames and the clamp.
 * @evidence contracts/development/implementation.md#principled-implementation The linear inverted pendulum driven by a polynomial centre of pressure has the terminating particular solution of the operator series, plus the homogeneous cosh/sinh part fixed by the initial state.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The quintic's derivatives, the particular solution, the homogeneous coefficients, the state.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact for the course it states; no time step.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per read, replacing one held span per `STEP` of the weight shift.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The pendulum's advance and its course readers both read the span through this one owner.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh vectors and retains nothing.
 */
export function staggerTransfer(
  from: { p: IAutoMovieVector3; s: IAutoMovieVector3; v: IAutoMovieVector3 },
  to: IAutoMovieVector3,
  span: number,
  w: number,
  u: number,
): { s: IAutoMovieVector3; v: IAutoMovieVector3; p: IAutoMovieVector3 } {
  const d: IAutoMovieVector3 = Vector3.subtract(to, from.p);
  const T: number = Math.max(span, 1e-12);

  // The quintic's share and its derivatives in seconds at a time.
  const shares: (t: number) => number[] = (t: number): number[] => {
    const x: number = Math.min(1, Math.max(0, t / T));
    return [
      10 * x ** 3 - 15 * x ** 4 + 6 * x ** 5,
      (30 * x ** 2 - 60 * x ** 3 + 30 * x ** 4) / T,
      (60 * x - 180 * x ** 2 + 120 * x ** 3) / T ** 2,
      (60 - 360 * x + 360 * x ** 2) / T ** 3,
      (-360 + 720 * x) / T ** 4,
      720 / T ** 5,
    ];
  };

  // The particular solution and its rate: p + p''/w^2 + p''''/w^4.
  const w2: number = w * w;
  const w4: number = w2 * w2;
  const particular: (t: number) => { x: IAutoMovieVector3; dx: IAutoMovieVector3; p: IAutoMovieVector3 } = (
    t: number,
  ): { x: IAutoMovieVector3; dx: IAutoMovieVector3; p: IAutoMovieVector3 } => {
    const s: number[] = shares(t);
    const p: IAutoMovieVector3 = Vector3.add(from.p, Vector3.scale(d, s[0]!));
    return {
      p,
      x: Vector3.add(p, Vector3.scale(d, s[2]! / w2 + s[4]! / w4)),
      dx: Vector3.scale(d, s[1]! + s[3]! / w2 + s[5]! / w4),
    };
  };
  const start: ReturnType<typeof particular> = particular(0);
  const A: IAutoMovieVector3 = Vector3.subtract(from.s, start.x);
  const B: IAutoMovieVector3 = Vector3.scale(Vector3.subtract(from.v, start.dx), 1 / w);
  const t: number = Math.min(T, Math.max(0, u));
  const at: ReturnType<typeof particular> = particular(t);
  const ch: number = Math.cosh(w * t);
  const sh: number = Math.sinh(w * t);
  return {
    p: at.p,
    s: Vector3.add(at.x, Vector3.add(Vector3.scale(A, ch), Vector3.scale(B, sh))),
    v: Vector3.add(at.dx, Vector3.scale(Vector3.add(Vector3.scale(A, sh), Vector3.scale(B, ch)), w)),
  };
}
