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
 * @author Samchon
 */
export function createHumanFaceSkinProjectionEnvelope(
  input: IHumanFaceSkinProjectionFeatures,
): IHumanFaceSkinProjectionInterval[] {
  // A pair's immutable represented polynomial belongs to this one guide.
  // Validity clipping is read separately, so repeated overlap fragments do
  // not reconstruct its coefficients or isolate the same roots again.
  const comparisons = new Map<
    IHumanFaceSkinProjectionFeature,
    Map<IHumanFaceSkinProjectionFeature, IHumanFaceSkinProjectionComparison>
  >();
  const readComparison = (
    first: IHumanFaceSkinProjectionFeature,
    second: IHumanFaceSkinProjectionFeature,
  ): IHumanFaceSkinProjectionComparison => {
    const row =
      comparisons.get(first) ??
      new Map<
        IHumanFaceSkinProjectionFeature,
        IHumanFaceSkinProjectionComparison
      >();
    comparisons.set(first, row);
    let result = row.get(second);
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
  const merge = (
    first: readonly IHumanFaceSkinProjectionInterval[],
    second: readonly IHumanFaceSkinProjectionInterval[],
  ): IHumanFaceSkinProjectionInterval[] => {
    const output: IHumanFaceSkinProjectionInterval[] = [];
    const append = (
      feature: IHumanFaceSkinProjectionInterval["feature"],
      lower: number,
      upper: number,
    ): void => {
      if (!(lower < upper)) return;
      const previous = output.at(-1);
      if (previous?.feature === feature && previous.upper === lower)
        previous.upper = upper;
      else output.push({ feature, lower, upper });
    };
    let i = 0,
      j = 0;
    let position = Math.min(
      first[0]?.lower ?? Infinity,
      second[0]?.lower ?? Infinity,
    );
    while (i < first.length || j < second.length) {
      while (first[i] !== undefined && first[i].upper <= position) i++;
      while (second[j] !== undefined && second[j].upper <= position) j++;
      const a =
        first[i] !== undefined && first[i].lower <= position
          ? first[i]
          : undefined;
      const b =
        second[j] !== undefined && second[j].lower <= position
          ? second[j]
          : undefined;
      const end = Math.min(
        a?.upper ?? first[i]?.lower ?? Infinity,
        b?.upper ?? second[j]?.lower ?? Infinity,
      );
      if (!Number.isFinite(end)) break;
      if (a !== undefined && b !== undefined) {
        const comparison = readComparison(a.feature, b.feature);
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
  let layer = input.features.map((feature) => [
    { feature, lower: feature.lower, upper: feature.upper },
  ]);
  while (layer.length > 1) {
    const next: IHumanFaceSkinProjectionInterval[][] = [];
    for (let at = 0; at < layer.length; at += 2)
      next.push(
        layer[at + 1] === undefined
          ? layer[at]
          : merge(layer[at], layer[at + 1]),
      );
    layer = next;
  }
  const envelope = layer[0] ?? [];
  if (
    envelope[0]?.lower !== 0 ||
    envelope.at(-1)?.upper !== 1 ||
    envelope.some(
      (interval, at) => at > 0 && envelope[at - 1].upper !== interval.lower,
    )
  )
    throw new Error(
      "Skin projection lacks native support across its complete guide.",
    );
  return envelope;
}
