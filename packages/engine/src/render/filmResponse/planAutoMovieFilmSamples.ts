import type {
  IAutoMovieFilmOptics,
  IAutoMoviePlanFilmSamples,
} from "@automovie/interface";

/** Height of the full-frame 36 × 24 mm gate, in metres. */
const GATE_HEIGHT: number = 0.024;

/** The golden ratio's conjugate, `(√5 − 1) / 2`. */
const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

/**
 * Plan the sub-frame samples a directly rendered frame averages with equal
 * weight: when each is placed and where on the aperture its eye sits.
 *
 * For `N = optics.samples`, sample `k = 0 … N − 1` takes:
 *
 * - Its second: with a shutter, `t − T × (N − k − 0.5) / N`, the midpoints of `N`
 *   equal strata of the trailing interval `[t − T, t]` with `T = angle / 360 /
 *   fps`, in ascending time, so the frame's last placement, its marks and its
 *   pose sidecar all describe second `t`; without a shutter, `t`;
 * - Its eye: with a lens, point `j` of the Hammersley set `(j / N, Φ₂(j))`, `Φ₂`
 *   the base-2 radical inverse, mapped to the unit disk by the concentric map
 *   of Shirley and Chiu (1997, "A low distortion map between disk and square",
 *   Journal of Graphics Tools) and scaled to the aperture radius. Alone, `j =
 *   k`. With a shutter too, `j = (a × k + ⌊N / 2⌋) mod N`, with `a` the integer
 *   nearest `N × 0.618…` that is coprime to `N`: a fixed permutation other than
 *   the identity, so a sample's time and its lens position are not correlated
 *   (Cook, Porter and Carpenter 1984, "Distributed ray tracing", SIGGRAPH).
 *
 * The aperture diameter is the full-frame equivalent focal length of the
 * camera's field of view, `12 mm / tan(fovY / 2)`, divided by the f-number, so
 * the blur matches the picture's geometry rather than an authored focal length.
 * Every value depends only on `t`, `fps`, the optics and `fovY`, never on an
 * earlier frame.
 *
 * @param props The frame's second, the frame rate, the optics and the field of
 *   view.
 * @returns `samples` samples in drawing order.
 * @throws Error when the optics has no `samples`, or `fps` or `fovY` is out of
 *   range.
 */
export const planAutoMovieFilmSamples: (
  props: IAutoMoviePlanFilmSamples.IProps,
) => IAutoMoviePlanFilmSamples.ISample[] = (
  props: IAutoMoviePlanFilmSamples.IProps,
): IAutoMoviePlanFilmSamples.ISample[] => {
  const count: number | undefined = props.optics.samples;
  if (count === undefined)
    throw new Error("planAutoMovieFilmSamples: the optics set no samples.");
  if (!(Number.isFinite(props.fps) && props.fps > 0))
    throw new Error(
      "planAutoMovieFilmSamples: fps must be finite and above zero.",
    );
  if (!(Number.isFinite(props.fovY) && props.fovY > 0 && props.fovY < 180))
    throw new Error("planAutoMovieFilmSamples: fovY must be within (0, 180).");

  const interval: number =
    props.optics.shutter === undefined
      ? 0
      : props.optics.shutter.angle / 360 / props.fps;
  const lens: IAutoMovieFilmOptics.ILens | undefined = props.optics.lens;
  const radius: number =
    lens === undefined
      ? 0
      : GATE_HEIGHT /
        2 /
        Math.tan((props.fovY * Math.PI) / 360) /
        lens.fNumber /
        2;
  const stride: number = coprimeNear(count, count * GOLDEN);
  return Array.from(
    { length: count },
    (_: unknown, k: number): IAutoMoviePlanFilmSamples.ISample => {
      const seconds: number =
        props.optics.shutter === undefined
          ? props.seconds
          : props.seconds - (interval * (count - k - 0.5)) / count;
      if (lens === undefined) return { seconds, point: null, eye: null };
      const point: number =
        props.optics.shutter === undefined
          ? k
          : (stride * k + Math.floor(count / 2)) % count;
      const [x, y] = concentricDisk(point / count, radicalInverse(point));
      return { seconds, point, eye: { x: x * radius, y: y * radius } };
    },
  );
};

/**
 * The base-2 radical inverse of a non-negative integer: its binary digits
 * mirrored about the binary point.
 */
const radicalInverse: (index: number) => number = (index: number): number => {
  let value: number = 0;
  let weight: number = 0.5;
  for (let rest: number = index; rest > 0; rest = Math.floor(rest / 2)) {
    value += (rest % 2) * weight;
    weight /= 2;
  }
  return value;
};

/**
 * Shirley and Chiu's concentric map of the unit square onto the unit disk,
 * which keeps strata adjacent and areas proportional.
 */
const concentricDisk: (u: number, v: number) => [number, number] = (
  u: number,
  v: number,
): [number, number] => {
  const a: number = 2 * u - 1;
  const b: number = 2 * v - 1;
  if (a === 0 && b === 0) return [0, 0];
  const [r, phi] =
    Math.abs(a) > Math.abs(b)
      ? [a, (Math.PI / 4) * (b / a)]
      : [b, Math.PI / 2 - (Math.PI / 4) * (a / b)];
  return [r * Math.cos(phi), r * Math.sin(phi)];
};

/**
 * The integer nearest `target` within `[1, count]` that is coprime to `count`,
 * the lower one on a tie, so `k → a × k mod count` is a permutation.
 */
const coprimeNear: (count: number, target: number) => number = (
  count: number,
  target: number,
): number => {
  const centre: number = Math.min(count, Math.max(1, Math.round(target)));
  for (let offset: number = 0; ; ++offset)
    for (const candidate of [centre - offset, centre + offset])
      if (candidate >= 1 && candidate <= count && gcd(candidate, count) === 1)
        return candidate;
};

/** The greatest common divisor of two positive integers. */
const gcd: (a: number, b: number) => number = (a: number, b: number): number =>
  b === 0 ? a : gcd(b, a % b);
