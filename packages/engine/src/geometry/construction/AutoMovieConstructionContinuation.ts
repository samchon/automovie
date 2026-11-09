import { AutoMovieConstructionBoundary } from "./AutoMovieConstructionBoundary";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftSection } from "./AutoMovieLoftSection";
import { AutoMovieLoftSectionConnect } from "./AutoMovieLoftSectionConnect";
import { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * A continuation's shared end layer: the host chain's end layer re-expressed as the part chain's end layer. With complete consistent source jets, the part carries the host's section and both station derivatives at the shared ring, giving the two faces the same C2 boundary data.
 *
 * The part's stations leave the ring the way the host's continue it when the two ends differ (a host's top under a part's bottom): the layer is copied as it is. When the two ends are the same (top on top, bottom on bottom), the part's stations run against the host's, so the part's layer is the host's in the frame `(u, -v)`, whose normal `v x u` is reversed: its control points are reindexed `m -> -m mod N` with their `z` negated, which keeps every point of the ring and its counter-clockwise turn about the new normal; the phase `psi` on the part is then `-psi` on the host. First station derivatives change sign with the station's direction, second ones do not; the lift along the normal changes sign with the normal.
 *
 * Different orders retain their original chains only when ConstructionBoundary admits already equal whole native scalar2, frame2 and absent/constant lift2. Their compatibility rows are separate density-specific projections, not the native geometry; no endpoint or adjoining interval is rewritten on that path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when the layer is copied as it is and when reversed, the reindexing, the phase relation and which derivatives change sign.
 * @evidence contracts/development/design.md#principled-representation Represents A continuation's shared end layer: the host chain's end layer re-expressed as the part chain's end layer: companion namespace of 3 members (`sign`, `apply`, `transform`); units and frames named in its text: local, frame, world. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionContinuation` in packages/engine/src/geometry/construction/AutoMovieConstructionContinuation.ts; its surface is the 3 members listed and the text shows 7 other files naming it, mostly test (5), packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieConstructionContinuation {
  /**
   * The direction sign of a pair of ends.
   *
   * @param hostEnd The host face's shared end.
   * @param partEnd The part face's shared end.
   * @returns 1 when the part's stations continue the host's, -1 when they run against them.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Opposite end kinds continue the station direction and matching ends reverse it, giving the declared 1/-1 derivative/phase convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One end-kind comparison owns the direction rule used by both the layer transform and shared-ring builder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses only the closed bottom/top values without geometry-dependent sign guesses.
   * @evidence contracts/development/common.md#meaningful-documentation States the returned direction meaning for both end pairings.
   * @evidence contracts/development/implementation.md#efficient-algorithms One comparison and scalar result take constant time without allocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This direction predicate owns no reusable preparation or coordinated effect.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a number and retains no chain or resource.
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Captures the actual whole local endpoint family and signs it with the copied frame/lift data; changed spans receive explicit generating laws. World C2 additionally requires complete consistent frame/lift boundary jets in that same physical station coordinate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission and endpoint selection surround one local layer transform, then a shallow chain/layer-list copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejects non-spline bases and selected pole ends. Different orders require complete source/frame/lift equivalence and their own valid density bindings; their part is returned unchanged. The original equal-order replacement keeps its documented caller premises.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the four end-pair direction rules, phase reversal, derivative signs and premise-string result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Different-order admission scans O(LN) compatibility components plus existing binding binary searches, endpoint captures and source/span lookups without copying chains. Equal-order replacement copies L references and O(N) transformed components, then performs SectionConnect capture/finish costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the host's actual boundary jets and all untouched part layers instead of re-solving or lofting a boundary approximation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns its chain/list/replacement, reversed arrays and explicit endpoint snapshots/changed-span laws on native paths; untouched fields and forward compatibility arrays/frame remain shared, without an added cache or host callback.
   */
  export function apply(
    host: IAutoMovieLoftChain,
    hostEnd: "bottom" | "top",
    part: IAutoMovieLoftChain,
    partEnd: "bottom" | "top",
  ): IAutoMovieLoftChain | string {
    if (host.basis !== "spline" || part.basis !== "spline")
      return "both chains must carry spline sections";
    /** A real pole cannot serve as an open continuation ring. */
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
          AutoMovieConstructionBoundary(
            host,
            hostEnd,
            part,
            partEnd,
            sign(hostEnd, partEnd),
          ) ?? part
        );
      } catch (error: unknown) {
        if (!(error instanceof AutoMovieLoftAdmissionError)) throw error;
        return `Continuation source of ${part.name}: ${error.message}`;
      }
    }
    const source: IAutoMovieLoftChain.ILayer =
      hostEnd === "bottom"
        ? host.layers[0]!
        : host.layers[host.layers.length - 1]!;
    AutoMovieLoftFrameSource.validate(source);
    AutoMovieLoftCoefficientSource.controls(host, source.y);
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
      !AutoMovieLoftSection.present(host) &&
      !AutoMovieLoftSection.present(part)
    )
      return { ...part, layers };
    const field: AutoMovieLoftSectionSource.IEndpoint["field"] | string =
      AutoMovieLoftSectionConnect.capture(
        host,
        source.y,
        sign(hostEnd, partEnd),
      );
    if (typeof field === "string") return field;
    layer.sectionSource = AutoMovieLoftSectionSource.bind(layer, field);
    try {
      return AutoMovieLoftSectionConnect.finish({ ...part, layers });
    } catch (error: unknown) {
      return `Continuation source of ${part.name}: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /** The host's layer in the part's station direction. */
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
        frame: l.frame ?? AutoMovieLoftFrame.horizontal(l.y),
      };
      delete copy.view;
      delete copy.coefficientSource;
      delete copy.sectionSource;
      if (y !== l.y) delete copy.frameSource;
      return copy;
    }
    // Control point m of the part is control point -m of the host.
    /** Reindex the periodic control row into the reversed chart without observing geometry. */
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
    /** Scalar lift controls follow the same phase reversal and explicit normal sign. */
    const values: (c: readonly number[], k: number) => number[] = (
      c: readonly number[],
      k: number,
    ): number[] =>
      Array.from(
        { length: n },
        (_: unknown, m: number): number => k * c[(n - m) % n]!,
      );
    /** Value and derivative frame records follow their separate station/chart signs. */
    const frame: (
      f: AutoMovieLoftFrame.IFrame,
      ko: number,
      ku: number,
      kv: number,
    ) => AutoMovieLoftFrame.IFrame = (
      f: AutoMovieLoftFrame.IFrame,
      ko: number,
      ku: number,
      kv: number,
    ): AutoMovieLoftFrame.IFrame => ({
      origin: [ko * f.origin[0], ko * f.origin[1], ko * f.origin[2]],
      u: [ku * f.u[0], ku * f.u[1], ku * f.u[2]],
      v: [kv * f.v[0], kv * f.v[1], kv * f.v[2]],
    });
    return {
      y,
      frame: frame(l.frame ?? AutoMovieLoftFrame.horizontal(l.y), 1, 1, -1),
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
