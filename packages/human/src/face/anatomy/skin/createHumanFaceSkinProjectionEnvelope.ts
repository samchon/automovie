import type { IHumanFaceSkinProjectionComparison } from "./IHumanFaceSkinProjectionComparison";
import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";
import type { IHumanFaceSkinProjectionFeatures } from "./IHumanFaceSkinProjectionFeatures";
import type { IHumanFaceSkinProjectionInterval } from "./IHumanFaceSkinProjectionInterval";
import { compareHumanFaceSkinProjectionFeatures } from "./compareHumanFaceSkinProjectionFeatures";

/**
 * Construct the lower envelope of valid native-feature squared distances by
 * balanced pairwise merge. Each merge splits only where domains end or two represented
 * quadratics cross. This is the one-dimensional minimization diagram, not
 * uniform guide sampling (CGAL, 2D Envelopes user manual). The comparison
 * owner partitions each actual overlap using exact root enclosures and
 * certified open-interval signs; rounded midpoint ties do not select a whole
 * interval. Its immutable pair resources are shared within this one guide.
 *
 * Exact equal-distance intervals retain the earlier native feature. This
 * deterministic alias policy does not blend unrelated sheets. Projection
 * continuity is checked by the course owner after the envelope is complete.
 *
 * @evidence contracts/common.md#principled-implementation Balanced merges of valid native-feature distance intervals split at domain boundaries and certified quadratic crossings; exact interval ties retain earlier native order and final coverage must continuously span [0,1].
 * @evidence contracts/common.md#clear-and-simple-design Merge ownership, adjacent same-feature coalescing and pair-result reuse remain together; the comparator owns exact signs/roots and the course compiler owns physical continuity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No uniform samples or rounded midpoint ties select ownership; same-feature coalescing requires exact touching bounds and incomplete guide coverage refuses without blending unrelated sheets.
 * @evidence contracts/common.md#meaningful-documentation The comment gives lower-envelope semantics, valid-domain splitting, deterministic ties, guide-local reuse and the separate continuity owner.
 * @evidence contracts/performance.md#efficient-algorithms Balanced levels merge ordered interval lists with monotone cursors; cost follows intermediate interval counts and distinct exact pair comparisons rather than a fixed sampling grid. Coalescing contiguous same-owner spans limits output fragmentation without removing crossings.
 * @evidence contracts/performance.md#reuse-equivalent-work Nested maps reuse immutable pair coefficients/root proof by the two feature objects under this guide's fixed direction; each actual overlap is clipped separately and no result is shared across changed guides.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The invocation owns layer arrays and at most the compared feature-pair population, potentially quadratic in F with bigint bytes depending on precision; these are collectible on return/refusal and only the final interval array escapes.
 *
 * @author Samchon
 */
export function createHumanFaceSkinProjectionEnvelope(
  input: IHumanFaceSkinProjectionFeatures,
): IHumanFaceSkinProjectionInterval[] {
  // A pair's immutable represented polynomial belongs to this one guide.
  // Validity clipping is read separately, so repeated overlap fragments do
  // not reconstruct its coefficients or isolate the same roots again.
  const comparisons: Map<
    IHumanFaceSkinProjectionFeature,
    Map<IHumanFaceSkinProjectionFeature, IHumanFaceSkinProjectionComparison>
  > = new Map<
    IHumanFaceSkinProjectionFeature,
    Map<IHumanFaceSkinProjectionFeature, IHumanFaceSkinProjectionComparison>
  >();
  const readComparison: (
    first: IHumanFaceSkinProjectionFeature,
    second: IHumanFaceSkinProjectionFeature,
  ) => IHumanFaceSkinProjectionComparison = (
    first: IHumanFaceSkinProjectionFeature,
    second: IHumanFaceSkinProjectionFeature,
  ): IHumanFaceSkinProjectionComparison => {
    const row: Map<
      IHumanFaceSkinProjectionFeature,
      IHumanFaceSkinProjectionComparison
    > =
      comparisons.get(first) ??
      new Map<
        IHumanFaceSkinProjectionFeature,
        IHumanFaceSkinProjectionComparison
      >();
    comparisons.set(first, row);
    let result: IHumanFaceSkinProjectionComparison | undefined =
      row.get(second);
    if (result === undefined) {
      result = compareHumanFaceSkinProjectionFeatures(
        first,
        second,
        input.direction,
      );
      row.set(second, result);
    }
    return result;
  };
  const merge: (
    first: readonly IHumanFaceSkinProjectionInterval[],
    second: readonly IHumanFaceSkinProjectionInterval[],
  ) => IHumanFaceSkinProjectionInterval[] = (
    first: readonly IHumanFaceSkinProjectionInterval[],
    second: readonly IHumanFaceSkinProjectionInterval[],
  ): IHumanFaceSkinProjectionInterval[] => {
    const output: IHumanFaceSkinProjectionInterval[] = [];
    const append: (
      feature: IHumanFaceSkinProjectionInterval["feature"],
      lower: number,
      upper: number,
    ) => void = (
      feature: IHumanFaceSkinProjectionInterval["feature"],
      lower: number,
      upper: number,
    ): void => {
      if (!(lower < upper)) return;
      const previous: IHumanFaceSkinProjectionInterval | undefined =
        output.at(-1);
      if (previous?.feature === feature && previous.upper === lower)
        previous.upper = upper;
      else output.push({ feature, lower, upper });
    };
    let i: number = 0,
      j: number = 0;
    let position: number = Math.min(
      first[0]?.lower ?? Infinity,
      second[0]?.lower ?? Infinity,
    );
    while (i < first.length || j < second.length) {
      while (first[i] !== undefined && first[i].upper <= position) i++;
      while (second[j] !== undefined && second[j].upper <= position) j++;
      const a: IHumanFaceSkinProjectionInterval | undefined =
        first[i] !== undefined && first[i].lower <= position
          ? first[i]
          : undefined;
      const b: IHumanFaceSkinProjectionInterval | undefined =
        second[j] !== undefined && second[j].lower <= position
          ? second[j]
          : undefined;
      const end: number = Math.min(
        a?.upper ?? first[i]?.lower ?? Infinity,
        b?.upper ?? second[j]?.lower ?? Infinity,
      );
      if (!Number.isFinite(end)) break;
      if (a !== undefined && b !== undefined) {
        const comparison: IHumanFaceSkinProjectionComparison = readComparison(
          a.feature,
          b.feature,
        );
        for (const interval of comparison.partition(position, end)) {
          append(
            interval.sign <= 0 ? a.feature : b.feature,
            interval.lower,
            interval.upper,
          );
        }
      } else if (a !== undefined || b !== undefined)
        append((a ?? b)!.feature, position, end);
      position = end;
    }
    return output;
  };
  let layer: {
    feature: IHumanFaceSkinProjectionFeature;
    lower: number;
    upper: number;
  }[][] = input.features.map(
    (
      feature: IHumanFaceSkinProjectionFeature,
    ): {
      feature: IHumanFaceSkinProjectionFeature;
      lower: number;
      upper: number;
    }[] => [{ feature, lower: feature.lower, upper: feature.upper }],
  );
  while (layer.length > 1) {
    const next: IHumanFaceSkinProjectionInterval[][] = [];
    for (let at: number = 0; at < layer.length; at += 2)
      next.push(
        layer[at + 1] === undefined
          ? layer[at]
          : merge(layer[at], layer[at + 1]),
      );
    layer = next;
  }
  const envelope: {
    feature: IHumanFaceSkinProjectionFeature;
    lower: number;
    upper: number;
  }[] = layer[0] ?? [];
  if (
    envelope[0]?.lower !== 0 ||
    envelope.at(-1)?.upper !== 1 ||
    envelope.some(
      (
        interval: {
          feature: IHumanFaceSkinProjectionFeature;
          lower: number;
          upper: number;
        },
        at: number,
      ): boolean => at > 0 && envelope[at - 1].upper !== interval.lower,
    )
  )
    throw new Error(
      "Skin projection lacks native support across its complete guide.",
    );
  return envelope;
}
