import type {
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieLoftChain,
  IAutoMovieLoftFrameSource,
  IAutoMovieLoftSectionFrame,
  IAutoMovieStationHermite,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
} from "@automovie/interface";

import { AutoMovieEngineLoftAdmissionError } from "./AutoMovieEngineLoftAdmissionError";
import { AutoMovieEngineLoftFrame } from "./AutoMovieEngineLoftFrame";
import { AutoMovieEngineStationHermite } from "./AutoMovieEngineStationHermite";

/**
 * Explicit actual-axis ownership of a loft's frame, with the original Hermite
 * fallback.
 */
export namespace AutoMovieEngineLoftFrameSource {
  /**
   * Retain an analytic axis on every final loft layer, replacing resplined
   * frame jets.
   */
  export function retain(
    chain: IAutoMovieLoftChain,
    axis: IAutoMovieViewAxis.IAxis,
  ): IAutoMovieLoftChain | string {
    if (axis.jet === undefined) return chain;
    const layers: IAutoMovieLoftChain.ILayer[] = [];
    for (const layer of chain.layers) {
      const jet: IAutoMovieViewAxisJet.IJet | null = axis.jet(layer.y);
      const frame: IAutoMovieLoftSectionFrame = jet?.value ?? axis.at(layer.y);

      const retained: IAutoMovieLoftChain.ILayer = {
        ...layer,
        frame,
        frameSource: {
          axis,
          station: layer.y,
          frame: copy(frame),
          jet:
            jet === null
              ? null
              : {
                  value: copy(jet.value),
                  first: copy(jet.first),
                  second: copy(jet.second),
                },
        },
      };
      if (jet === null) {
        delete retained.frameSlopes;
        delete retained.frameCurvatures;
      } else {
        retained.frameSlopes = jet.first;
        retained.frameCurvatures = jet.second;
      }
      layers.push(retained);
    }
    return { ...chain, layers };
  }

  /** Validate a present retained source without changing its meaning. */
  export function validate(layer: IAutoMovieLoftChain.ILayer): void {
    const source: IAutoMovieLoftFrameSource.ISource | undefined =
      layer.frameSource;
    if (source === undefined) return;
    const derivatives: boolean =
      source.jet === null
        ? layer.frameSlopes === undefined && layer.frameCurvatures === undefined
        : same(layer.frameSlopes, source.jet.first) &&
          same(layer.frameCurvatures, source.jet.second);
    if (
      source.axis.jet === undefined ||
      source.station !== layer.y ||
      !same(layer.frame, source.frame) ||
      !derivatives
    )
      throw new Error(
        `Retained frame source at station ${layer.y} is missing or differs from its layer data`,
      );
  }

  /**
   * Actual frame jet of an unchanged common-source interval, or null for a
   * layer-defined boundary.
   */
  export function actual(
    a: IAutoMovieLoftChain.ILayer,
    b: IAutoMovieLoftChain.ILayer,
    station: number,
    parameter?: IAutoMovieConstructionOutlineParameter,
  ): IAutoMovieViewAxisJet.IJet | null {
    const axis: IAutoMovieViewAxis.IAxis | null = owner(a, b);
    if (axis === null) return null;
    const jet: IAutoMovieViewAxisJet.IJet | null = axis.jet!(
      station,
      parameter,
    );
    if (jet === null)
      throw new AutoMovieEngineLoftAdmissionError(
        `Retained axis has no analytic frame jet at station ${station} mm`,
      );
    return jet;
  }

  /**
   * Source frame or the original component/rotation Hermite between bracketed
   * layers.
   */
  export function frame(
    chain: IAutoMovieLoftChain,
    s: number,
    lo: number,
    hi: number,
  ): IAutoMovieLoftSectionFrame {
    const layers: readonly IAutoMovieLoftChain.ILayer[] = chain.layers;
    const a: IAutoMovieLoftChain.ILayer = layers[lo]!;
    const b: IAutoMovieLoftChain.ILayer = layers[hi]!;
    const axis: IAutoMovieViewAxis.IAxis | null = owner(a, b);
    if (axis !== null) {
      const value: IAutoMovieLoftSectionFrame = axis.at(s);
      return value;
    }
    if (
      AutoMovieEngineStationHermite.framed(a) &&
      AutoMovieEngineStationHermite.framed(b)
    ) {
      const ea: IAutoMovieStationHermite.IEnd =
        AutoMovieEngineStationHermite.frameEnd(a);
      const eb: IAutoMovieStationHermite.IEnd =
        AutoMovieEngineStationHermite.frameEnd(b);
      const quintic: boolean =
        ea.curvature !== undefined && eb.curvature !== undefined;
      const w: number[] = AutoMovieEngineStationHermite.weights(
        Math.min(1, Math.max(0, (s - a.y) / (b.y - a.y))),
        b.y - a.y,
        0,
        quintic,
      );
      return AutoMovieEngineStationHermite.unflat(
        AutoMovieEngineStationHermite.combine(ea, eb, w),
      );
    }
    if (
      a.frame === undefined &&
      b.frame === undefined &&
      layers[lo - 1]?.frame === undefined &&
      layers[hi + 1]?.frame === undefined
    )
      return AutoMovieEngineLoftFrame.horizontal(s);
    const frameOf: (k: number) => IAutoMovieLoftSectionFrame = (
      k: number,
    ): IAutoMovieLoftSectionFrame =>
      layers[k]!.frame ?? AutoMovieEngineLoftFrame.horizontal(layers[k]!.y);
    const H: number = b.y - a.y;

    // Preserve the original Catmull-Rom origin tangents and rotation rates.
    const tangent: (k: number) => Vec3 = (k: number): Vec3 => {
      const p: number = Math.max(0, k - 1);
      const n: number = Math.min(layers.length - 1, k + 1);
      const op: Vec3 = frameOf(p).origin;
      const on: Vec3 = frameOf(n).origin;
      const span: number = layers[n]!.y - layers[p]!.y;
      return [0, 1, 2].map(
        (i: number): number => ((on[i]! - op[i]!) / span) * H,
      ) as Vec3;
    };
    const turn: (i: number) => Vec3 = (i: number): Vec3 =>
      AutoMovieEngineLoftFrame.rate(
        frameOf(i),
        frameOf(i + 1),
        layers[i + 1]!.y - layers[i]!.y,
      );
    const span: (i: number) => number = (i: number): number =>
      layers[i + 1]!.y - layers[i]!.y;
    const velocity: (k: number) => Vec3 = (k: number): Vec3 => {
      const last: number = layers.length - 1;
      let w: Vec3;
      if (last === 1) w = turn(0);
      else if (k === 0 || k === last) {
        const [i0, i1]: [number, number] =
          k === 0 ? [0, 1] : [last - 1, last - 2];
        const r0: Vec3 = turn(i0);
        const r1: Vec3 = turn(i1);
        const f: number = span(i0) / (span(i0) + span(i1));
        w = [0, 1, 2].map(
          (i: number): number => r0[i]! + (r0[i]! - r1[i]!) * f,
        ) as Vec3;
      } else {
        const r0: Vec3 = turn(k - 1);
        const r1: Vec3 = turn(k);
        const h0: number = span(k - 1);
        const h1: number = span(k);
        w = [0, 1, 2].map(
          (i: number): number => (h1 * r0[i]! + h0 * r1[i]!) / (h0 + h1),
        ) as Vec3;
      }
      return [w[0] * H, w[1] * H, w[2] * H];
    };
    return AutoMovieEngineLoftFrame.interpolate(
      frameOf(lo),
      frameOf(hi),
      tangent(lo),
      tangent(hi),
      Math.min(1, Math.max(0, (s - a.y) / H)),
      velocity(lo),
      velocity(hi),
    );
  }

  /*
   * Validate both explicit records and distinguish a common source from an
   * ordinary mixed-source boundary.
   */
  function owner(
    a: IAutoMovieLoftChain.ILayer,
    b: IAutoMovieLoftChain.ILayer,
  ): IAutoMovieViewAxis.IAxis | null {
    validate(a);
    validate(b);
    return a.frameSource !== undefined &&
      b.frameSource !== undefined &&
      a.frameSource.axis === b.frameSource.axis
      ? a.frameSource.axis
      : null;
  }
}

/*
 * Frame component triple.
 */
type Vec3 = [number, number, number];

/*
 * Independent numeric copy permits value-preserving layer copies without
 * reference-identity semantics.
 */
function copy(frame: IAutoMovieLoftSectionFrame): IAutoMovieLoftSectionFrame {
  return { origin: [...frame.origin], u: [...frame.u], v: [...frame.v] };
}

/*
 * Exact component equality of copied layer data, with absence distinct from a
 * supplied source jet.
 */
function same(
  frame: IAutoMovieLoftSectionFrame | undefined,
  snapshot: IAutoMovieLoftSectionFrame,
): boolean {
  return (
    frame !== undefined &&
    frame.origin.every(
      (value: number, i: number): boolean => value === snapshot.origin[i],
    ) &&
    frame.u.every(
      (value: number, i: number): boolean => value === snapshot.u[i],
    ) &&
    frame.v.every(
      (value: number, i: number): boolean => value === snapshot.v[i],
    )
  );
}
