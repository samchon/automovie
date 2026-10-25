import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodyWarpField } from "./AutoMovieHumanBodyWarpField";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Measurement law applied: every calibrated quantity moved by the field of
 * `AutoMovieHumanBodyWarpField`.
 *
 * A layer's control points are moved as world points, `x -> ax x + bx`,
 * `z -> az z + bz` by its chain's map at its station and `y -> h(y)` by
 * its chain's height function, which moves a spline section by the
 * quasi-interpolant of the moved curve (exact where the map is affine). A
 * horizontal layer takes the moved height of its station as its new
 * station and keeps any out-of-plane remainder as lift; a framed layer
 * keeps its station and orientation, its origin moves as a point and the
 * moved control points are decomposed on its unchanged axes, the normal
 * part joining the lift. Station slopes are the central differences of the
 * moved coefficients 0.25 mm either side (one-sided at chain ends), over
 * the moved station difference, so the Hermite rule interpolates the
 * moved family.
 *
 * Poles move with their chain's map at their end; apertures, globes and
 * lip endpoints with the map of the chain they lie on at their own height,
 * linearised there (an aperture's Fourier series transforms exactly under
 * that affine map); lip endpoint derivatives scale by its linear part.
 */
export namespace AutoMovieHumanBodyWarp {
  /** Body and lip boundary after the measurement law. */
  export interface IOutput {
    /** Warped body calibration. */
    body: IAutoMovieHumanBodyCalibration;

    /** Warped exterior lip boundary spans. */
    vermilion: AutoMovieHumanBodyWarpField.ISpan[];
  }

  /**
   * Apply a warp field to a calibration and its lip spans.
   *
   * @param body Calibration after the shape basis.
   * @param field Field built on that calibration.
   * @param vermilion Lip boundary spans in the same frame.
   */
  export function apply(
    body: IAutoMovieHumanBodyCalibration,
    field: AutoMovieHumanBodyWarpField.IField,
    vermilion: AutoMovieHumanBodyWarpField.ISpan[],
  ): IOutput {
    const named: Map<string, IAutoMovieHumanLoftChain> = new Map(
      body.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
          c.name,
          c,
        ],
      ),
    );
    return {
      body: {
        ...body,
        stature: field.stature,
        chains: body.chains.map(
          (chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain => ({
            ...chain,
            layers: chain.layers.map(
              (
                layer: IAutoMovieHumanLoftChain.ILayer,
              ): IAutoMovieHumanLoftChain.ILayer =>
                warpLayer(chain, layer, field),
            ),
          }),
        ),
        poles: body.poles.map(
          (
            p: IAutoMovieHumanBodyCalibration.IPole,
          ): IAutoMovieHumanBodyCalibration.IPole => {
            const chain: IAutoMovieHumanLoftChain = named.get(p.chain)!;
            const s: number =
              p.end === "top"
                ? chain.layers[chain.layers.length - 1]!.y
                : chain.layers[0]!.y;
            return { ...p, point: move(field, p.chain, s, p.point) };
          },
        ),
        apertures: body.apertures.map(
          (a: IAutoMovieHumanLoftAperture): IAutoMovieHumanLoftAperture =>
            aperture(a, field),
        ),
        eyes: body.eyes.map(
          (
            e: IAutoMovieHumanBodyCalibration.IEye,
          ): IAutoMovieHumanBodyCalibration.IEye => ({
            ...e,
            centre: move(field, "head.middle", e.centre[1], e.centre),
          }),
        ),
      },
      vermilion: vermilion.map(
        (
          span: AutoMovieHumanBodyWarpField.ISpan,
        ): AutoMovieHumanBodyWarpField.ISpan => {
          const chain: IAutoMovieHumanLoftChain = named.get("head.lower")!;
          const end = (
            p: [number, number, number],
            d: [number, number, number],
          ): [[number, number, number], [number, number, number]] => {
            const s: number = station(chain, p);
            const j: [number, number, number] = jacobian(
              field,
              chain.name,
              s,
              p[1],
            );
            return [
              move(field, chain.name, s, p),
              [j[0] * d[0], j[1] * d[1], j[2] * d[2]],
            ];
          };
          const [start, startDerivative] = end(
            span.start,
            span.startDerivative,
          );
          const [stop, endDerivative] = end(span.end, span.endDerivative);
          return { ...span, start, end: stop, startDerivative, endDerivative };
        },
      ),
    };
  }
}

/** Station step of the slopes' central differences, mm. */
const H: number = 0.25;

/** A point moved by a chain's map at a station and its height function. */
function move(
  field: AutoMovieHumanBodyWarpField.IField,
  chain: string,
  s: number,
  p: readonly [number, number, number],
): [number, number, number] {
  const m: AutoMovieHumanBodyWarpField.IMap = field.map(chain, s);
  return [m.ax * p[0] + m.bx, field.height(chain, p[1]), m.az * p[2] + m.bz];
}

/** Diagonal of the field's linear part at a station and height. */
function jacobian(
  field: AutoMovieHumanBodyWarpField.IField,
  chain: string,
  s: number,
  y: number,
): [number, number, number] {
  const m: AutoMovieHumanBodyWarpField.IMap = field.map(chain, s);
  return [
    m.ax,
    (field.height(chain, y + H) - field.height(chain, y - H)) / (2 * H),
    m.az,
  ];
}

/** One layer's moved coefficients, lift and station or frame. */
interface IMoved {
  /** New station. */
  y: number;

  /** New frame, for a framed layer. */
  frame?: AutoMovieHumanLoftFrame.IFrame;

  /** New coefficients `[x..., z...]`. */
  coefficients: number[];

  /** New lift per control point. */
  lift: number[];
}

/** One warped principal layer. */
function warpLayer(
  chain: IAutoMovieHumanLoftChain,
  layer: IAutoMovieHumanLoftChain.ILayer,
  field: AutoMovieHumanBodyWarpField.IField,
): IAutoMovieHumanLoftChain.ILayer {
  const bottom: number = chain.layers[0]!.y;
  const top: number = chain.layers[chain.layers.length - 1]!.y;
  const s: number = layer.y;
  const lo: number = Math.max(bottom, s - H);
  const hi: number = Math.min(top, s + H);
  const here: IMoved = moved(chain, s, layer.frame !== undefined, field);
  const a: IMoved = moved(chain, lo, layer.frame !== undefined, field);
  const b: IMoved = moved(chain, hi, layer.frame !== undefined, field);
  const ds: number = layer.frame !== undefined ? hi - lo : b.y - a.y;
  return {
    ...layer,
    y: here.y,
    ...(here.frame === undefined ? {} : { frame: here.frame }),
    coefficients: here.coefficients,
    slopes: here.coefficients.map(
      (_: number, k: number): number =>
        (b.coefficients[k]! - a.coefficients[k]!) / ds,
    ),
    lift: here.lift,
    liftSlopes: here.lift.map(
      (_: number, k: number): number => (b.lift[k]! - a.lift[k]!) / ds,
    ),
  };
}

/**
 * The chain's section at station t, its control points moved as world
 * points and re-expressed for a horizontal or a framed layer.
 */
function moved(
  chain: IAutoMovieHumanLoftChain,
  t: number,
  framed: boolean,
  field: AutoMovieHumanBodyWarpField.IField,
): IMoved {
  const N: number = chain.order;
  const c: number[] = AutoMovieHumanLoftChain.coefficients(chain, t);
  const l: number[] | null = AutoMovieHumanLoftChain.lift(chain, t);
  const f: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(
    chain,
    t,
  );
  const n: [number, number, number] = cross(f.v, f.u);
  const m: AutoMovieHumanBodyWarpField.IMap = field.map(chain.name, t);
  const world: (
    p: readonly [number, number, number],
  ) => [number, number, number] = (
    p: readonly [number, number, number],
  ): [number, number, number] => [
    m.ax * p[0] + m.bx,
    field.height(chain.name, p[1]),
    m.az * p[2] + m.bz,
  ];
  // A horizontal layer's coefficients are absolute x and z, so its origin
  // stays on the vertical axis and only rises; a framed layer's origin
  // moves as a point.
  const origin: [number, number, number] = framed
    ? world(f.origin)
    : [0, field.height(chain.name, t), 0];
  const coefficients: number[] = new Array<number>(2 * N);
  const lift: number[] = new Array<number>(N);
  for (let j: number = 0; j < N; j++) {
    const h: number = l?.[j] ?? 0;
    const p: [number, number, number] = [0, 1, 2].map(
      (k: number): number =>
        f.origin[k]! + c[j]! * f.u[k]! + c[N + j]! * f.v[k]! + h * n[k]!,
    ) as [number, number, number];
    const d: [number, number, number] = sub(world(p), origin);
    coefficients[j] = dot(d, f.u);
    coefficients[N + j] = dot(d, f.v);
    lift[j] = dot(d, n);
  }
  return framed
    ? { y: t, frame: { ...f, origin }, coefficients, lift }
    : { y: origin[1], coefficients, lift };
}

/** An aperture's Fourier series under the field linearised at its centre. */
function aperture(
  a: IAutoMovieHumanLoftAperture,
  field: AutoMovieHumanBodyWarpField.IField,
): IAutoMovieHumanLoftAperture {
  const w: number = 2 * a.order + 1;
  const centre: [number, number, number] = [
    a.coefficients[0]!,
    a.coefficients[w]!,
    a.coefficients[2 * w]!,
  ];
  const moved: [number, number, number] = move(
    field,
    "head.middle",
    centre[1],
    centre,
  );
  const linear: [number, number, number] = jacobian(
    field,
    "head.middle",
    centre[1],
    centre[1],
  );
  return {
    ...a,
    coefficients: a.coefficients.map((c: number, i: number): number => {
      const k: number = Math.floor(i / w);
      return i % w === 0 ? moved[k]! : linear[k]! * c;
    }),
  };
}

/**
 * Station of a chain whose section plane passes through p: the sign change
 * of the signed plane distance scanned at 1 mm and interpolated linearly,
 * or the station of the smallest distance when no plane passes through it.
 */
function station(
  chain: IAutoMovieHumanLoftChain,
  p: readonly [number, number, number],
): number {
  const lo: number = chain.layers[0]!.y;
  const hi: number = chain.layers[chain.layers.length - 1]!.y;
  const distance: (s: number) => number = (s: number): number => {
    const f: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(
      chain,
      s,
    );
    return dot(
      cross(f.v, f.u),
      sub([...p] as [number, number, number], f.origin),
    );
  };
  let best: number = lo;
  let smallest: number = Infinity;
  let previous: number = distance(lo);
  for (let s: number = lo + 1; s <= hi + 1e-9; s += 1) {
    const d: number = distance(Math.min(s, hi));
    if (previous === 0) return s - 1;
    if (Math.sign(d) !== Math.sign(previous))
      return s - 1 + previous / (previous - d);
    if (Math.abs(d) < smallest) {
      smallest = Math.abs(d);
      best = Math.min(s, hi);
    }
    previous = d;
  }
  return best;
}

/** Difference. */
function sub(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Dot product. */
function dot(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Cross product. */
function cross(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
