import type { extractRecoveryImageFeatures } from "./extractRecoveryImageFeatures";

/**
 * Compare every admitted descriptor pair once and retain unique mutual matches.
 * The strict Euclidean ratio requires a distinct second feature in the other
 * image. Reverse exact ties refuse rather than choosing a material identity by
 * array order. This appearance test proposes correspondences, not their truth.
 *
 * @evidence contracts/common.md#principled-implementation Exhaustive squared Euclidean distances preserve the true nearest and second-nearest descriptors at the declared small feature budget. The squared ratio is the same Euclidean operating point; strict mutual uniqueness rejects exact repeated-feature ambiguity without a spatial or camera prior.
 * @evidence contracts/common.md#clear-and-simple-design One traversal updates forward two-neighbour and reverse two-neighbour records, and the final pass owns copied pixel coordinates for camera estimation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No approximate index, object region, manual point, expected pose or tie-breaking choice supplies a correspondence. Every returned pair still requires independent geometry and ambiguity checks.
 * @evidence contracts/common.md#meaningful-documentation States Euclidean versus squared ratios, the distinct-second premise, reverse tie refusal, borrowed descriptor ownership and tentative-match meaning.
 * @evidence contracts/performance.md#efficient-algorithms For F and G descriptors of width128, exact search costs O(128FG) and O(F+G) neighbour storage, with maxPairs checked before traversal. Streaming avoids a retained F-by-G distance table and is appropriate to the bounded high-dimensional feature population.
 * @evidence contracts/performance.md#reuse-equivalent-work Each pair distance supplies both forward and reverse neighbour decisions; neither descriptor extraction nor pair distances are repeated in the final mutual-selection pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only O(F+G) temporary arrays and O(min(F,G)) copied matches are allocated. All state belongs to the synchronous call and no image, index, process or global cache survives it.
 */
export function matchRecoveryImageFeatures(
  first: readonly ReturnType<typeof extractRecoveryImageFeatures>["points"][number][],
  second: readonly ReturnType<typeof extractRecoveryImageFeatures>["points"][number][],
  ratio: number,
  maxPairs: number,
): {
  firstIndex: number;
  secondIndex: number;
  first: [number, number];
  second: [number, number];
  squaredDescriptorDistance: number;
  descriptorDistanceRatio: number;
}[] {
  const pairs: number = first.length * second.length;
  if (!Number.isSafeInteger(pairs) || pairs > maxPairs)
    throw new Error("camera-matches: descriptor pair budget exhausted");
  if (second.length < 2 || first.length === 0) return [];
  const forward: Float64Array = new Float64Array(first.length).fill(Infinity);
  const forwardSecond: Float64Array = new Float64Array(first.length).fill(Infinity);
  const forwardIndex: Int32Array = new Int32Array(first.length).fill(-1);
  const reverse: Float64Array = new Float64Array(second.length).fill(Infinity);
  const reverseSecond: Float64Array = new Float64Array(second.length).fill(Infinity);
  const reverseIndex: Int32Array = new Int32Array(second.length).fill(-1);
  for (let i: number = 0; i < first.length; i++) {
    for (let j: number = 0; j < second.length; j++) {
      let squared: number = 0;
      for (let channel: number = 0; channel < 128; channel++) {
        const difference: number = first[i]!.descriptor[channel]! - second[j]!.descriptor[channel]!;
        squared += difference * difference;
      }
      if (squared < forward[i]!) {
        forwardSecond[i] = forward[i]!; forward[i] = squared; forwardIndex[i] = j;
      } else if (squared < forwardSecond[i]!) forwardSecond[i] = squared;
      if (squared < reverse[j]!) {
        reverseSecond[j] = reverse[j]!; reverse[j] = squared; reverseIndex[j] = i;
      } else if (squared < reverseSecond[j]!) reverseSecond[j] = squared;
    }
  }
  const matches: ReturnType<typeof matchRecoveryImageFeatures> = [];
  for (let i: number = 0; i < first.length; i++) {
    const j: number = forwardIndex[i]!;
    if (j < 0 || reverseIndex[j] !== i || !(reverse[j]! < reverseSecond[j]!) ||
      !(forward[i]! < ratio * ratio * forwardSecond[i]!)) continue;
    matches.push({ firstIndex: i, secondIndex: j,
      first: [first[i]!.point[0], first[i]!.point[1]],
      second: [second[j]!.point[0], second[j]!.point[1]],
      squaredDescriptorDistance: forward[i]!,
      descriptorDistanceRatio: Math.sqrt(forward[i]! / forwardSecond[i]!) });
  }
  return matches;
}
