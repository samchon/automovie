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
 * @evidence contracts/common.md#principled-implementation Merging two minimum diagrams consumes complete validity-overlap partitions and their exact distance-order signs; actual crossing boundaries retain the declared binary64 representation.
 * @evidence contracts/common.md#clear-and-simple-design Owns the envelope interval population; feature geometry and dyadic comparisons have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No guide subdivision count, anatomical case or width participates in envelope construction.
 * @evidence contracts/common.md#meaningful-documentation States the balanced minimum merge and deterministic equal-distance ownership.
 * @evidence contracts/modeling.md#spatial-conventions Guide parameters are dimensionless; projection residuals use the feature producer's explicit local coordinate scale.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Processes an existing skin course and creates no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes internal geometry without adding an anatomical authoring control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or source vertex.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The final course owner checks native feature continuity; this helper does not certify a tissue join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The calling relief owners observe the resulting skin.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Performs geometry arithmetic and introduces no physiological quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input ranges remain with the relief callers.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No personal curve or vertex authoring is exposed.
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
