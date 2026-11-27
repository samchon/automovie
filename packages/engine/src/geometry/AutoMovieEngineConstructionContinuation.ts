import type {
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftSectionSource,
} from "@automovie/interface";

import { constructionBoundary } from "./construction/internal/constructionBoundary";
import { AutoMovieEngineLoftAdmissionError } from "./AutoMovieEngineLoftAdmissionError";
import { AutoMovieEngineLoftCoefficientSource } from "./AutoMovieEngineLoftCoefficientSource";
import { AutoMovieEngineLoftFrame } from "./AutoMovieEngineLoftFrame";
import { AutoMovieEngineLoftFrameSource } from "./AutoMovieEngineLoftFrameSource";
import { AutoMovieEngineLoftSection } from "./AutoMovieEngineLoftSection";
import { AutoMovieEngineLoftSectionConnect } from "./AutoMovieEngineLoftSectionConnect";
import { AutoMovieEngineLoftSectionSource } from "./AutoMovieEngineLoftSectionSource";

/**
 * A continuation's shared end layer: the host chain's end layer re-expressed as
 * the part chain's end layer. With complete consistent source jets, the part
 * carries the host's section and both station derivatives at the shared ring,
 * giving the two faces the same C2 boundary data.
 *
 * The part's stations leave the ring the way the host's continue it when the
 * two ends differ (a host's top under a part's bottom): the layer is copied as
 * it is. When the two ends are the same (top on top, bottom on bottom), the
 * part's stations run against the host's, so the part's layer is the host's in
 * the frame `(u, -v)`, whose normal `v x u` is reversed: its control points are
 * reindexed `m -> -m mod N` with their `z` negated, which keeps every point of
 * the ring and its counter-clockwise turn about the new normal; the phase `psi`
 * on the part is then `-psi` on the host. First station derivatives change sign
 * with the station's direction, second ones do not; the lift along the normal
 * changes sign with the normal.
 *
 * Different orders retain their original chains only when ConstructionBoundary
 * admits already equal whole native scalar2, frame2 and absent/constant lift2.
 * Their compatibility rows are separate density-specific projections, not the
 * native geometry; no endpoint or adjoining interval is rewritten on that
 * path.
 */
export namespace AutoMovieEngineConstructionContinuation {
  /**
   * The direction sign of a pair of ends.
   *
   * @param hostEnd The host face's shared end.
   * @param partEnd The part face's shared end.
   * @returns 1 when the part's stations continue the host's, -1 when they run
   *   against them.
   */
  export function sign(
    hostEnd: "bottom" | "top",
    partEnd: "bottom" | "top",
  ): 1 | -1 {
    return hostEnd !== partEnd ? 1 : -1;
  }

  /**
   * The part chain with its end layer replaced by the host's.
   *
   * @param host The host chain.
   * @param hostEnd The host's shared end.
   * @param part The part chain.
   * @param partEnd The part's shared end.
   * @returns The part chain, or the premise the pair breaks.
   */
  export function apply(
    host: IAutoMovieLoftChain,
    hostEnd: "bottom" | "top",
    part: IAutoMovieLoftChain,
    partEnd: "bottom" | "top",
  ): IAutoMovieLoftChain | string {
    if (host.basis !== "spline" || part.basis !== "spline")
      return "both chains must carry spline sections";
    /*
     * A real pole cannot serve as an open continuation ring.
     */
    const closed: (
      chain: IAutoMovieLoftChain,
      end: "bottom" | "top",
    ) => boolean = (
      chain: IAutoMovieLoftChain,
      end: "bottom" | "top",
    ): boolean => chain.pole?.end === end || chain.opposite?.end === end;
    if (closed(host, hostEnd))
      return `the host's ${hostEnd} end closes in a pole`;
    if (closed(part, partEnd))
      return `the part's ${partEnd} end closes in a pole`;

    // An already shared native boundary keeps both original density-specific
    // representations and every adjacent interval; copying rows cannot do so.
    if (host.order !== part.order) {
      try {
        return (
          constructionBoundary(
            host,
            hostEnd,
            part,
            partEnd,
            sign(hostEnd, partEnd),
          ) ?? part
        );
      } catch (error: unknown) {
        if (!(error instanceof AutoMovieEngineLoftAdmissionError)) throw error;
        return `Continuation source of ${part.name}: ${error.message}`;
      }
    }
    const source: IAutoMovieLoftChain.ILayer =
      hostEnd === "bottom"
        ? host.layers[0]!
        : host.layers[host.layers.length - 1]!;
    AutoMovieEngineLoftFrameSource.validate(source);
    AutoMovieEngineLoftCoefficientSource.controls(host, source.y);
    const index: number = partEnd === "bottom" ? 0 : part.layers.length - 1;
    const layer: IAutoMovieLoftChain.ILayer = transform(
      source,
      part.layers[index]!.y,
      part.order,
      sign(hostEnd, partEnd),
    );
    const layers: IAutoMovieLoftChain.ILayer[] = part.layers.slice();
    layers[index] = layer;
    if (
      !AutoMovieEngineLoftSection.present(host) &&
      !AutoMovieEngineLoftSection.present(part)
    )
      return { ...part, layers };
    const field: IAutoMovieLoftSectionSource.IEndpoint["field"] | string =
      AutoMovieEngineLoftSectionConnect.capture(
        host,
        source.y,
        sign(hostEnd, partEnd),
      );
    if (typeof field === "string") return field;
    layer.sectionSource = AutoMovieEngineLoftSectionSource.bind(layer, field);
    try {
      return AutoMovieEngineLoftSectionConnect.finish({ ...part, layers });
    } catch (error: unknown) {
      return `Continuation source of ${part.name}: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /*
   * The host's layer in the part's station direction.
   */
  function transform(
    l: IAutoMovieLoftChain.ILayer,
    y: number,
    n: number,
    s: 1 | -1,
  ): IAutoMovieLoftChain.ILayer {
    if (s === 1) {
      const copy: IAutoMovieLoftChain.ILayer = {
        ...l,
        y,
        frame: l.frame ?? AutoMovieEngineLoftFrame.horizontal(l.y),
      };
      delete copy.view;
      delete copy.coefficientSource;
      delete copy.sectionSource;
      if (y !== l.y) delete copy.frameSource;
      return copy;
    }
    // Control point m of the part is control point -m of the host.
    /*
     * Reindex the periodic control row into the reversed chart without
     * observing geometry.
     */
    const points: (c: readonly number[], kx: number, kz: number) => number[] = (
      c: readonly number[],
      kx: number,
      kz: number,
    ): number[] => {
      const out: number[] = new Array<number>(2 * n);
      for (let m: number = 0; m < n; m++) {
        const j: number = (n - m) % n;
        out[m] = kx * c[j]!;
        out[n + m] = kz * c[n + j]!;
      }
      return out;
    };
    /*
     * Scalar lift controls follow the same phase reversal and explicit normal
     * sign.
     */
    const values: (c: readonly number[], k: number) => number[] = (
      c: readonly number[],
      k: number,
    ): number[] =>
      Array.from(
        { length: n },
        (_: unknown, m: number): number => k * c[(n - m) % n]!,
      );
    /*
     * Value and derivative frame records follow their separate station/chart
     * signs.
     */
    const frame: (
      f: IAutoMovieLoftSectionFrame,
      ko: number,
      ku: number,
      kv: number,
    ) => IAutoMovieLoftSectionFrame = (
      f: IAutoMovieLoftSectionFrame,
      ko: number,
      ku: number,
      kv: number,
    ): IAutoMovieLoftSectionFrame => ({
      origin: [ko * f.origin[0], ko * f.origin[1], ko * f.origin[2]],
      u: [ku * f.u[0], ku * f.u[1], ku * f.u[2]],
      v: [kv * f.v[0], kv * f.v[1], kv * f.v[2]],
    });
    return {
      y,
      frame: frame(l.frame ?? AutoMovieEngineLoftFrame.horizontal(l.y), 1, 1, -1),
      coefficients: points(l.coefficients, 1, -1),
      slopes: points(l.slopes, -1, 1),
      ...(l.curvatures === undefined
        ? {}
        : { curvatures: points(l.curvatures, 1, -1) }),
      ...(l.lift === undefined ? {} : { lift: values(l.lift, -1) }),
      ...(l.liftSlopes === undefined
        ? {}
        : { liftSlopes: values(l.liftSlopes, 1) }),
      ...(l.liftCurvatures === undefined
        ? {}
        : { liftCurvatures: values(l.liftCurvatures, -1) }),
      ...(l.frameSlopes === undefined
        ? {}
        : { frameSlopes: frame(l.frameSlopes, -1, -1, 1) }),
      ...(l.frameCurvatures === undefined
        ? {}
        : { frameCurvatures: frame(l.frameCurvatures, 1, 1, -1) }),
    };
  }
}
