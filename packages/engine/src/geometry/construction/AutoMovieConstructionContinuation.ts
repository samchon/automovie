import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * A continuation's shared end layer: the host chain's end layer re-expressed as the part chain's end layer, so the part's chain carries the host's section and both its station derivatives at the shared ring and the two faces are C2 across it.
 *
 * The part's stations leave the ring the way the host's continue it when the two ends differ (a host's top under a part's bottom): the layer is copied as it is. When the two ends are the same (top on top, bottom on bottom), the part's stations run against the host's, so the part's layer is the host's in the frame `(u, -v)`, whose normal `v x u` is reversed: its control points are reindexed `m -> -m mod N` with their `z` negated, which keeps every point of the ring and its counter-clockwise turn about the new normal; the phase `psi` on the part is then `-psi` on the host. First station derivatives change sign with the station's direction, second ones do not; the lift along the normal changes sign with the normal.
 *
 * @evidence contracts/common.md#principled-implementation The part's end layer becomes the host's section with its station jets signed into the part's station direction, so both chains share one ring and are C2 across it by the station rule they both use; a reversed pair reindexes control points so the ring keeps its counter-clockwise turn about the new normal.
 * @evidence contracts/common.md#clear-and-simple-design A sign of the two ends and one layer transform cover all four end pairings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A pole end, a control point mismatch or a non-spline basis is refused with its reason; the part's section is replaced, never faded toward the host's.
 * @evidence contracts/common.md#meaningful-documentation States when the layer is copied as it is and when reversed, the reindexing, the phase relation and which derivatives change sign.
 * @evidence contracts/performance.md#efficient-algorithms The transform is linear in the layer's control points, one pass per field.
 * @evidence contracts/performance.md#reuse-equivalent-work The part chain's other layers are shared with the lofted chain by a shallow copy of the layer list.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates one replaced layer and one layer list per continuation; nothing is cached.
 */
export namespace AutoMovieConstructionContinuation {
  /**
   * The direction sign of a pair of ends.
   *
   * @param hostEnd The host face's shared end.
   * @param partEnd The part face's shared end.
   * @returns 1 when the part's stations continue the host's, -1 when they run against them.
   */
  export function sign(hostEnd: "bottom" | "top", partEnd: "bottom" | "top"): 1 | -1 {
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
  export function apply(host: IAutoMovieLoftChain, hostEnd: "bottom" | "top", part: IAutoMovieLoftChain, partEnd: "bottom" | "top"): IAutoMovieLoftChain | string {
    if (host.basis !== "spline" || part.basis !== "spline") return "both chains must carry spline sections";
    if (host.order !== part.order) return `the host's sections have ${host.order} control points and the part's ${part.order}`;
    const closed = (chain: IAutoMovieLoftChain, end: "bottom" | "top"): boolean => chain.pole?.end === end || chain.opposite?.end === end;
    if (closed(host, hostEnd)) return `the host's ${hostEnd} end closes in a pole`;
    if (closed(part, partEnd)) return `the part's ${partEnd} end closes in a pole`;
    const source: IAutoMovieLoftChain.ILayer = hostEnd === "bottom" ? host.layers[0]! : host.layers[host.layers.length - 1]!;
    const index: number = partEnd === "bottom" ? 0 : part.layers.length - 1;
    const layer: IAutoMovieLoftChain.ILayer = transform(source, part.layers[index]!.y, part.order, sign(hostEnd, partEnd));
    const layers: IAutoMovieLoftChain.ILayer[] = part.layers.slice();
    layers[index] = layer;
    return { ...part, layers };
  }

  /** The host's layer in the part's station direction. */
  function transform(l: IAutoMovieLoftChain.ILayer, y: number, n: number, s: 1 | -1): IAutoMovieLoftChain.ILayer {
    if (s === 1) {
      const copy: IAutoMovieLoftChain.ILayer = { ...l, y, frame: l.frame ?? AutoMovieLoftFrame.horizontal(l.y) };
      delete copy.view;
      return copy;
    }
    // Control point m of the part is control point -m of the host.
    const points = (c: readonly number[], kx: number, kz: number): number[] => {
      const out: number[] = new Array<number>(2 * n);
      for (let m: number = 0; m < n; m++) {
        const j: number = (n - m) % n;
        out[m] = kx * c[j]!;
        out[n + m] = kz * c[n + j]!;
      }
      return out;
    };
    const values = (c: readonly number[], k: number): number[] => Array.from({ length: n }, (_: unknown, m: number): number => k * c[(n - m) % n]!);
    const frame = (f: AutoMovieLoftFrame.IFrame, ko: number, ku: number, kv: number): AutoMovieLoftFrame.IFrame => ({
      origin: [ko * f.origin[0], ko * f.origin[1], ko * f.origin[2]],
      u: [ku * f.u[0], ku * f.u[1], ku * f.u[2]],
      v: [kv * f.v[0], kv * f.v[1], kv * f.v[2]],
    });
    return {
      y,
      frame: frame(l.frame ?? AutoMovieLoftFrame.horizontal(l.y), 1, 1, -1),
      coefficients: points(l.coefficients, 1, -1),
      slopes: points(l.slopes, -1, 1),
      ...(l.curvatures === undefined ? {} : { curvatures: points(l.curvatures, 1, -1) }),
      ...(l.lift === undefined ? {} : { lift: values(l.lift, -1) }),
      ...(l.liftSlopes === undefined ? {} : { liftSlopes: values(l.liftSlopes, 1) }),
      ...(l.liftCurvatures === undefined ? {} : { liftCurvatures: values(l.liftCurvatures, -1) }),
      ...(l.frameSlopes === undefined ? {} : { frameSlopes: frame(l.frameSlopes, -1, -1, 1) }),
      ...(l.frameCurvatures === undefined ? {} : { frameCurvatures: frame(l.frameCurvatures, 1, 1, -1) }),
    };
  }
}
