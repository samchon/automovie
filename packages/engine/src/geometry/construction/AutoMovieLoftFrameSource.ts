import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";
import type { AutoMovieViewAxis } from "./AutoMovieViewAxis";
import type { AutoMovieViewAxisJet } from "./AutoMovieViewAxisJet";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * Explicit actual-axis ownership of a loft's frame, with the original Hermite fallback.
 *
 * @evidence contracts/common.md#principled-implementation An unchanged pair from one analytic source reads that source's frame jet; different or absent sources use the layer-defined boundary interpolation. A present but stale source is an error.
 * @evidence contracts/common.md#clear-and-simple-design Source records live on layers as geometry data; no registry or bind history changes a record's interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not approximate an analytic axis by extra samples or silently replace invalid retained source data by another surface.
 * @evidence contracts/common.md#meaningful-documentation States value-copy equivalence, callable-source ownership, immutability, serialization failure and mixed-source boundary interpolation.
 * @evidence contracts/performance.md#efficient-algorithms Retention is linear in layers; validation and frame queries use fixed-size records beside the source owner's own query cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Every layer shares its immutable prepared axis; snapshots are validation data rather than a separate frame fit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A retained layer owns a fixed-size numeric snapshot and an axis reference; releasing all its layers releases that source, without a global registry.
 */
export namespace AutoMovieLoftFrameSource {
  /**
   * An actual source and independent numeric snapshot of its published layer jet.
   *
   * @evidence contracts/common.md#principled-implementation The callable source determines intermediate frames; station/value/derivatives verify that a copied layer still represents that source datum.
   * @evidence contracts/common.md#clear-and-simple-design Axis identity and one station jet make geometry ownership visible in the layer record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A stripped or mutated source is invalid, not an instruction to respline; source absence alone selects ordinary layer interpolation.
   * @evidence contracts/common.md#meaningful-documentation Same numeric layer copies preserve meaning while sharing the actual immutable axis; JSON cannot serialize that callable and must reconstruct it from the authored tree.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This geometry-data interface performs no query.
   * @evidence contracts/performance.md#reuse-equivalent-work Every unchanged layer from the same prepared axis shares that source identity.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A layer retains one axis reference, a station, one copied value frame and an optional three-frame station-jet snapshot; the source's knots live until its last retaining caller releases it.
   */
  export interface ISource {
    /** Immutable actual source; its analytic jet callback must remain callable. */
    axis: AutoMovieViewAxis.IAxis;

    /** Source station of this layer, mm. */
    station: number;

    /** Independently copied finite source value, including at a singular station. */
    frame: AutoMovieLoftFrame.IFrame;

    /** Independently copied station jet; null preserves a finite value whose station derivatives are singular or nonfinite. */
    jet: AutoMovieViewAxisJet.IJet | null;
  }

  /**
   * Retain an analytic axis on every final loft layer, replacing resplined frame jets.
   *
   * @evidence contracts/common.md#principled-implementation Each layer receives its actual source frame and analytic derivatives, so unchanged source intervals evaluate the original axis; a numerical value-only axis retains the existing layer interpolation.
   * @evidence contracts/common.md#clear-and-simple-design One post-solve conversion keeps coefficient interpolation independent of actual frame ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A singular station jet remains null with its finite frame value; only nonfinite source values or falsely finite jet records fail retention.
   * @evidence contracts/common.md#meaningful-documentation Returns the input for a value-only axis, a new immutable layer table on success, or the failed station premise; source and layer snapshots must remain unchanged thereafter.
   * @evidence contracts/performance.md#efficient-algorithms O(L) source queries and fixed numeric copies prepare L layers, plus each axis query's documented cost.
   * @evidence contracts/performance.md#reuse-equivalent-work All records retain the one prepared axis and each query supplies value and derivatives together.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Success owns a new layer list, fixed snapshots and axis references; failure retains no partial output and no external resource.
   */
  export function retain(
    chain: IAutoMovieLoftChain,
    axis: AutoMovieViewAxis.IAxis,
  ): IAutoMovieLoftChain | string {
    if (axis.jet === undefined) return chain;
    const layers: Layer[] = [];
    for (const layer of chain.layers) {
      const jet: AutoMovieViewAxisJet.IJet | null = axis.jet(layer.y);
      const frame: AutoMovieLoftFrame.IFrame = jet?.value ?? axis.at(layer.y);
      if (
        !finite(frame) ||
        (jet !== null && ![jet.value, jet.first, jet.second].every(finite))
      )
        return `axis has nonfinite frame data at station ${layer.y} mm`;
      const retained: Layer = {
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

  /**
   * Validate a present retained source without changing its meaning.
   *
   * @evidence contracts/common.md#principled-implementation Checks callable ownership and exact station/value/derivative equality against independent source snapshots; value copies of the same data remain equivalent.
   * @evidence contracts/common.md#clear-and-simple-design One validator is shared by interval reads and operations preserving a layer's source.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Throws on a present stripped/stale source; does not clear it or quietly choose another frame geometry.
   * @evidence contracts/common.md#meaningful-documentation Absence is allowed; transformed producers must explicitly remove or re-express source ownership, and in-place mutation remains unsupported by chain caches.
   * @evidence contracts/performance.md#efficient-algorithms At most 27 exact component comparisons and one callback-presence check take constant work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure validation creates no reusable preparation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no layer, source or output after returning or throwing.
   */
  export function validate(layer: Layer): void {
    const source: ISource | undefined = layer.frameSource;
    if (source === undefined) return;
    const derivatives: boolean =
      source.jet === null
        ? layer.frameSlopes === undefined && layer.frameCurvatures === undefined
        : same(layer.frameSlopes, source.jet.first) &&
          same(layer.frameCurvatures, source.jet.second);
    if (
      typeof source.axis.jet !== "function" ||
      source.station !== layer.y ||
      !same(layer.frame, source.frame) ||
      !derivatives
    )
      throw new Error(
        `Retained frame source at station ${layer.y} is missing or differs from its layer data`,
      );
  }

  /**
   * Actual frame jet of an unchanged common-source interval, or null for a layer-defined boundary.
   *
   * @evidence contracts/common.md#principled-implementation Both endpoints must retain the same valid analytic axis; the interval then reads that very source at the requested station.
   * @evidence contracts/common.md#clear-and-simple-design Null explicitly identifies absent/different-source boundary interpolation; invalid present data throws.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No owner is inferred from matching sampled values, and an unavailable interior source jet does not trigger a fitted fallback.
   * @evidence contracts/common.md#meaningful-documentation Callers use the ordinary Hermite rule only for null, preserving mixed-source continuation boundary jets.
   * @evidence contracts/performance.md#efficient-algorithms Fixed endpoint validation plus one actual source query; no layer scan or dense resampling.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the prepared axis shared by both endpoint records.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh source jet or null and owns no cache or retained endpoint references.
   */
  export function actual(
    a: Layer,
    b: Layer,
    station: number,
    parameter?: AutoMovieConstructionOutlineParameter,
  ): AutoMovieViewAxisJet.IJet | null {
    const axis: AutoMovieViewAxis.IAxis | null = owner(a, b);
    if (axis === null) return null;
    const jet: AutoMovieViewAxisJet.IJet | null = axis.jet!(station, parameter);
    if (jet === null || ![jet.value, jet.first, jet.second].every(finite))
      throw new Error(
        `Retained axis has no finite analytic frame jet at station ${station} mm`,
      );
    return jet;
  }

  /**
   * Source frame or the original component/rotation Hermite between bracketed layers.
   *
   * @evidence contracts/common.md#principled-implementation Reads actual unchanged-source frames first, then preserves the existing framed Hermite, horizontal or Catmull-Rom/rotation interpolation rule for layer-defined intervals.
   * @evidence contracts/common.md#clear-and-simple-design This owner keeps source selection and every frame fallback together; the chain supplies its already found bracket.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not normalize interpolated axes or change the old fallback arithmetic, bounds or neighbour selection.
   * @evidence contracts/common.md#meaningful-documentation lo/hi are the admitted chain bracket; explicit source validation distinguishes missing support from corrupted retained data.
   * @evidence contracts/performance.md#efficient-algorithms Constant neighbour and nine-component work follows bracket lookup, plus actual source-query cost when used.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's bracket and prepared source; fallback endpoint weights are computed once per reading.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Every returned frame owns local vectors; no chain or interpolation result is retained globally.
   */
  export function frame(
    chain: IAutoMovieLoftChain,
    s: number,
    lo: number,
    hi: number,
  ): AutoMovieLoftFrame.IFrame {
    const layers: readonly Layer[] = chain.layers;
    const a: Layer = layers[lo]!;
    const b: Layer = layers[hi]!;
    const axis: AutoMovieViewAxis.IAxis | null = owner(a, b);
    if (axis !== null) {
      const value: AutoMovieLoftFrame.IFrame = axis.at(s);
      if (!finite(value))
        throw new Error(
          `Retained axis has no finite frame value at station ${s} mm`,
        );
      return value;
    }
    if (
      AutoMovieStationHermite.framed(a) &&
      AutoMovieStationHermite.framed(b)
    ) {
      const ea: AutoMovieStationHermite.IEnd =
        AutoMovieStationHermite.frameEnd(a);
      const eb: AutoMovieStationHermite.IEnd =
        AutoMovieStationHermite.frameEnd(b);
      const quintic: boolean =
        ea.curvature !== undefined && eb.curvature !== undefined;
      const w: number[] = AutoMovieStationHermite.weights(
        Math.min(1, Math.max(0, (s - a.y) / (b.y - a.y))),
        b.y - a.y,
        0,
        quintic,
      );
      return AutoMovieStationHermite.unflat(
        AutoMovieStationHermite.combine(ea, eb, w),
      );
    }
    if (
      a.frame === undefined &&
      b.frame === undefined &&
      layers[lo - 1]?.frame === undefined &&
      layers[hi + 1]?.frame === undefined
    )
      return AutoMovieLoftFrame.horizontal(s);
    const frameOf: (k: number) => AutoMovieLoftFrame.IFrame = (
      k: number,
    ): AutoMovieLoftFrame.IFrame =>
      layers[k]!.frame ?? AutoMovieLoftFrame.horizontal(layers[k]!.y);
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
      AutoMovieLoftFrame.rate(
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
    return AutoMovieLoftFrame.interpolate(
      frameOf(lo),
      frameOf(hi),
      tangent(lo),
      tangent(hi),
      Math.min(1, Math.max(0, (s - a.y) / H)),
      velocity(lo),
      velocity(hi),
    );
  }

  /** Validate both explicit records and distinguish a common source from an ordinary mixed-source boundary. */
  function owner(a: Layer, b: Layer): AutoMovieViewAxis.IAxis | null {
    validate(a);
    validate(b);
    return a.frameSource !== undefined &&
      b.frameSource !== undefined &&
      a.frameSource.axis === b.frameSource.axis
      ? a.frameSource.axis
      : null;
  }
}

/** The explicit runtime principal-layer source datum. */
type Layer = IAutoMovieLoftChain.ILayer;

/** Frame component triple. */
type Vec3 = [number, number, number];

/** Independent numeric copy permits value-preserving layer copies without reference-identity semantics. */
function copy(frame: AutoMovieLoftFrame.IFrame): AutoMovieLoftFrame.IFrame {
  return { origin: [...frame.origin], u: [...frame.u], v: [...frame.v] };
}

/** Exact component equality of copied layer data, with absence distinct from a supplied source jet. */
function same(
  frame: AutoMovieLoftFrame.IFrame | undefined,
  snapshot: AutoMovieLoftFrame.IFrame,
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

/** Finite actual frame components are required before publishing an analytic jet. */
function finite(frame: AutoMovieLoftFrame.IFrame): boolean {
  return (
    frame.origin.every(Number.isFinite) &&
    frame.u.every(Number.isFinite) &&
    frame.v.every(Number.isFinite)
  );
}
