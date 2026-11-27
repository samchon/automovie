import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Hof's pendulum over a weight shift in closed form: the centre of pressure
 * runs from `p` to `q` on a minimum-jerk course over `span` seconds (`p(t) = p
 *
 * - (q - p) s(t / span)`, `s`the quintic`10 u^3 - 15 u^4 + 6 u^5`, Flash and
 *   Hogan 1985), and the centre of mass follows `x'' = omega^2 (x - p(t))`. A
 *   quintic's sixth derivative is zero, so `x_p = p + p'' / omega^2
 *
 * - P'''' / omega^4`solves the equation exactly, and`x = x_p + A cosh(omega t) +
 *   B sinh(omega t)` meets the span's initial travel and velocity.
 * Parameter from: The span's centre of pressure at its start, travel `s0` and
 * velocity `v0`, entry-relative world metres and metres per second.
 * Parameter to: The centre of pressure at the span's end.
 * Parameter span: The span's seconds.
 * Parameter w: The pendulum's frequency, radians per second.
 * Parameter u: Seconds into the span, clamped to it.
 * Returns: The travel, the velocity and the centre of pressure there.
 */
export function staggerTransfer(
  from: IStaggerTransferFrom,
  to: IAutoMovieVector3,
  span: number,
  w: number,
  u: number,
): IStaggerTransferResult {
  const d: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(to, from.p);
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
  const particular: (t: number) => IStaggerTransferParticular = (
    t: number,
  ): IStaggerTransferParticularResult => {
    const s: number[] = shares(t);
    const p: IAutoMovieVector3 = AutoMovieEngineVector3.add(from.p, AutoMovieEngineVector3.scale(d, s[0]!));
    return {
      p,
      x: AutoMovieEngineVector3.add(p, AutoMovieEngineVector3.scale(d, s[2]! / w2 + s[4]! / w4)),
      dx: AutoMovieEngineVector3.scale(d, s[1]! + s[3]! / w2 + s[5]! / w4),
    };
  };
  const start: ReturnType<typeof particular> = particular(0);
  const A: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(from.s, start.x);
  const B: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    AutoMovieEngineVector3.subtract(from.v, start.dx),
    1 / w,
  );
  const t: number = Math.min(T, Math.max(0, u));
  const at: ReturnType<typeof particular> = particular(t);
  const ch: number = Math.cosh(w * t);
  const sh: number = Math.sinh(w * t);
  return {
    p: at.p,
    s: AutoMovieEngineVector3.add(
      at.x,
      AutoMovieEngineVector3.add(AutoMovieEngineVector3.scale(A, ch), AutoMovieEngineVector3.scale(B, sh)),
    ),
    v: AutoMovieEngineVector3.add(
      at.dx,
      AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(AutoMovieEngineVector3.scale(A, sh), AutoMovieEngineVector3.scale(B, ch)), w),
    ),
  };
}

/*
 * The record of `IStaggerTransferParticularResult`'s site.
 */
type IStaggerTransferParticularResult = {
  x: IAutoMovieVector3;
  dx: IAutoMovieVector3;
  p: IAutoMovieVector3;
};

/*
 * The record of `IStaggerTransferParticular`'s site.
 */
type IStaggerTransferParticular = {
  x: IAutoMovieVector3;
  dx: IAutoMovieVector3;
  p: IAutoMovieVector3;
};

/*
 * The record of `IStaggerTransferResult`'s site.
 */
type IStaggerTransferResult = {
  s: IAutoMovieVector3;
  v: IAutoMovieVector3;
  p: IAutoMovieVector3;
};

/*
 * The record of `IStaggerTransferFrom`'s site.
 */
type IStaggerTransferFrom = {
  p: IAutoMovieVector3;
  s: IAutoMovieVector3;
  v: IAutoMovieVector3;
};
