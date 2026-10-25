import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodyWarpField } from "./AutoMovieHumanBodyWarpField";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Measurement law: the body's tape girths, crotch height and head size
 * brought to a person's inputs.
 *
 * Each measured quantity's target is the specimen's own geometric value
 * times the ratio of the person's input to the specimen's input, so a
 * difference between an input's definition and this geometry cancels; the
 * applied ratio is that target over the value of the body being warped
 * (after the shape basis), so the basis's own size change is not counted
 * twice. The field of ratios is built by `AutoMovieHumanBodyWarpField`;
 * this module applies it to every calibrated quantity:
 *
 * - section control points `p -> A(s) p + b(s)` in the horizontal plane
 *   (A diagonal), with station slopes by the chain rule, the map's own
 *   station derivative taken by central differences;
 * - stations, frame origins and lifts by the vertical map, which is
 *   affine on each side of the crotch ring, so each chain, lying wholly on
 *   one side, keeps exact Hermite slopes divided by its scale;
 * - framed layers by decomposing the mapped offsets onto their unchanged
 *   in-plane axes and normal (the normal part joins the lift);
 * - poles by their chain's map; apertures and globes by the head map,
 *   which is affine there, so Fourier coefficients map exactly; vermilion
 *   endpoints by the map of the head chain at their own station, with
 *   endpoint derivatives scaled by its linear part.
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
   * @param field Ratio field built on that calibration.
   * @param vermilion Lip boundary spans in the same frame.
   */
  export function apply(
    body: IAutoMovieHumanBodyCalibration,
    field: AutoMovieHumanBodyWarpField.IField,
    vermilion: AutoMovieHumanBodyWarpField.ISpan[],
  ): IOutput {
    const chains: IAutoMovieHumanLoftChain[] = body.chains.map(
      (chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain => ({
        ...chain,
        layers: chain.layers.map(
          (
            layer: IAutoMovieHumanLoftChain.ILayer,
          ): IAutoMovieHumanLoftChain.ILayer => warpLayer(chain, layer, field),
        ),
      }),
    );
    const named: Map<string, IAutoMovieHumanLoftChain> = new Map(
      body.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
          c.name,
          c,
        ],
      ),
    );
    const head: AutoMovieHumanBodyWarpField.IMap = field.head;
    return {
      body: {
        ...body,
        stature: field.stature,
        chains,
        poles: body.poles.map(
          (
            p: IAutoMovieHumanBodyCalibration.IPole,
          ): IAutoMovieHumanBodyCalibration.IPole => {
            const chain: IAutoMovieHumanLoftChain = named.get(p.chain)!;
            const s: number =
              p.end === "top"
                ? chain.layers[chain.layers.length - 1]!.y
                : chain.layers[0]!.y;
            return {
              ...p,
              point: point(
                field.map(p.chain, s),
                field.vertical(p.chain),
                p.point,
              ),
            };
          },
        ),
        apertures: body.apertures.map(
          (a: IAutoMovieHumanLoftAperture): IAutoMovieHumanLoftAperture =>
            aperture(a, head, field.vertical("head.middle")),
        ),
        eyes: body.eyes.map(
          (
            e: IAutoMovieHumanBodyCalibration.IEye,
          ): IAutoMovieHumanBodyCalibration.IEye => ({
            ...e,
            centre: point(head, field.vertical("head.middle"), e.centre),
          }),
        ),
      },
      vermilion: vermilion.map(
        (
          span: AutoMovieHumanBodyWarpField.ISpan,
        ): AutoMovieHumanBodyWarpField.ISpan =>
          lip(span, field, named.get("head.lower")!),
      ),
    };
  }
}

/** Vertical affine map `y -> scale y + offset`. */
type Vertical = AutoMovieHumanBodyWarpField.IVertical;

/** One warped principal layer. */
function warpLayer(
  chain: IAutoMovieHumanLoftChain,
  layer: IAutoMovieHumanLoftChain.ILayer,
  field: AutoMovieHumanBodyWarpField.IField,
): IAutoMovieHumanLoftChain.ILayer {
  const v: Vertical = field.vertical(chain.name);
  const s: number = layer.y;
  const bottom: number = chain.layers[0]!.y;
  const top: number = chain.layers[chain.layers.length - 1]!.y;
  const h: number = 0.5;
  const lo: number = Math.max(bottom, s - h);
  const hi: number = Math.min(top, s + h);
  const N: number = chain.order;

  // The map and its station derivative at the layer.
  const m: AutoMovieHumanBodyWarpField.IMap = field.map(chain.name, s);
  const ml: AutoMovieHumanBodyWarpField.IMap = field.map(chain.name, lo);
  const mh: AutoMovieHumanBodyWarpField.IMap = field.map(chain.name, hi);
  const dm: AutoMovieHumanBodyWarpField.IMap = {
    ax: (mh.ax - ml.ax) / (hi - lo),
    az: (mh.az - ml.az) / (hi - lo),
    bx: (mh.bx - ml.bx) / (hi - lo),
    bz: (mh.bz - ml.bz) / (hi - lo),
  };

  if (layer.frame === undefined) {
    // Horizontal layer: control points map in the plane, the station by the
    // vertical map, and slopes by the chain rule over the new station.
    const coefficients: number[] = new Array<number>(2 * N);
    const slopes: number[] = new Array<number>(2 * N);
    for (let j: number = 0; j < N; j++) {
      const x: number = layer.coefficients[j]!;
      const z: number = layer.coefficients[N + j]!;
      coefficients[j] = m.ax * x + m.bx;
      coefficients[N + j] = m.az * z + m.bz;
      slopes[j] = (dm.ax * x + m.ax * layer.slopes[j]! + dm.bx) / v.scale;
      slopes[N + j] =
        (dm.az * z + m.az * layer.slopes[N + j]! + dm.bz) / v.scale;
    }
    return {
      ...layer,
      y: v.scale * s + v.offset,
      coefficients,
      slopes,
      ...(layer.lift === undefined
        ? {}
        : {
            lift: layer.lift.map((l: number): number => v.scale * l),
            liftSlopes: layer.liftSlopes!,
          }),
    };
  }

  // Framed layer: the station is a parameter and stays; the origin maps as
  // a point and in-plane offsets as vectors, re-projected onto the frame's
  // unchanged axes, the normal part joining the lift.
  const f: AutoMovieHumanLoftFrame.IFrame = layer.frame;
  const n: [number, number, number] = [
    f.v[1] * f.u[2] - f.v[2] * f.u[1],
    f.v[2] * f.u[0] - f.v[0] * f.u[2],
    f.v[0] * f.u[1] - f.v[1] * f.u[0],
  ];
  // Linear part of the map (vertical scale `ys`): the map itself for
  // values, its station derivative, with a constant vertical scale, for
  // the slopes' product-rule term.
  const linear: (
    q: AutoMovieHumanBodyWarpField.IMap,
    ys: number,
    d: [number, number, number],
  ) => [number, number, number] = (
    q: AutoMovieHumanBodyWarpField.IMap,
    ys: number,
    d: [number, number, number],
  ): [number, number, number] => [q.ax * d[0], ys * d[1], q.az * d[2]];
  const offset: (
    x: number,
    z: number,
    l: number,
  ) => [number, number, number] = (
    x: number,
    z: number,
    l: number,
  ): [number, number, number] => [
    x * f.u[0] + z * f.v[0] + l * n[0],
    x * f.u[1] + z * f.v[1] + l * n[1],
    x * f.u[2] + z * f.v[2] + l * n[2],
  ];
  const origin: [number, number, number] = point(m, v, f.origin);
  const coefficients: number[] = new Array<number>(2 * N);
  const slopes: number[] = new Array<number>(2 * N);
  const lift: number[] = new Array<number>(N);
  const liftSlopes: number[] = new Array<number>(N);
  for (let j: number = 0; j < N; j++) {
    const l: number = layer.lift?.[j] ?? 0;
    const ls: number = layer.liftSlopes?.[j] ?? 0;
    // A point o + d maps to A o + b + A d: the mapped origin plus the
    // linear part applied to the offset.
    const d: [number, number, number] = linear(
      m,
      v.scale,
      offset(layer.coefficients[j]!, layer.coefficients[N + j]!, l),
    );
    coefficients[j] = dot(d, f.u);
    coefficients[N + j] = dot(d, f.v);
    lift[j] = dot(d, n);
    const e: [number, number, number] = add(
      linear(m, v.scale, offset(layer.slopes[j]!, layer.slopes[N + j]!, ls)),
      linear(
        dm,
        0,
        offset(layer.coefficients[j]!, layer.coefficients[N + j]!, l),
      ),
    );
    slopes[j] = dot(e, f.u);
    slopes[N + j] = dot(e, f.v);
    liftSlopes[j] = dot(e, n);
  }
  return {
    ...layer,
    frame: { ...f, origin },
    coefficients,
    slopes,
    lift,
    liftSlopes,
  };
}

/** A point under a planar map and a vertical map. */
function point(
  m: AutoMovieHumanBodyWarpField.IMap,
  v: Vertical,
  p: readonly [number, number, number],
): [number, number, number] {
  return [m.ax * p[0] + m.bx, v.scale * p[1] + v.offset, m.az * p[2] + m.bz];
}

/** An aperture's Fourier series under an affine map. */
function aperture(
  a: IAutoMovieHumanLoftAperture,
  m: AutoMovieHumanBodyWarpField.IMap,
  v: Vertical,
): IAutoMovieHumanLoftAperture {
  const w: number = 2 * a.order + 1;
  const linear: [number, number, number] = [m.ax, v.scale, m.az];
  const constant: [number, number, number] = [m.bx, v.offset, m.bz];
  return {
    ...a,
    coefficients: a.coefficients.map((c: number, i: number): number => {
      const k: number = Math.floor(i / w);
      return linear[k]! * c + (i % w === 0 ? constant[k]! : 0);
    }),
  };
}

/** One lip span under the head chain's map at each endpoint's own station. */
function lip(
  span: AutoMovieHumanBodyWarpField.ISpan,
  field: AutoMovieHumanBodyWarpField.IField,
  chain: IAutoMovieHumanLoftChain,
): AutoMovieHumanBodyWarpField.ISpan {
  const v: Vertical = field.vertical(chain.name);
  const at: (
    p: [number, number, number],
  ) => AutoMovieHumanBodyWarpField.IMap = (
    p: [number, number, number],
  ): AutoMovieHumanBodyWarpField.IMap =>
    field.map(chain.name, station(chain, p));
  const ms: AutoMovieHumanBodyWarpField.IMap = at(span.start);
  const me: AutoMovieHumanBodyWarpField.IMap = at(span.end);
  const scaled: (
    m: AutoMovieHumanBodyWarpField.IMap,
    d: [number, number, number],
  ) => [number, number, number] = (
    m: AutoMovieHumanBodyWarpField.IMap,
    d: [number, number, number],
  ): [number, number, number] => [m.ax * d[0], v.scale * d[1], m.az * d[2]];
  return {
    ...span,
    start: point(ms, v, span.start),
    end: point(me, v, span.end),
    startDerivative: scaled(ms, span.startDerivative),
    endDerivative: scaled(me, span.endDerivative),
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
    const n: [number, number, number] = [
      f.v[1] * f.u[2] - f.v[2] * f.u[1],
      f.v[2] * f.u[0] - f.v[0] * f.u[2],
      f.v[0] * f.u[1] - f.v[1] * f.u[0],
    ];
    return dot(n, [p[0] - f.origin[0], p[1] - f.origin[1], p[2] - f.origin[2]]);
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

/** Dot product. */
function dot(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Sum. */
function add(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
