import type { IAutoMovieRecoveryImageFeaturesMatchingOperation } from "@automovie/interface";

/**
 * Compare every admitted descriptor pair once and retain unique mutual matches.
 * The strict Euclidean ratio requires a distinct second feature in the other
 * image. Reverse exact ties refuse rather than choosing a material identity by
 * array order. This appearance test proposes correspondences, not their truth.
 */
export function matchRecoveryImageFeatures(
  first: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[0],
  second: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[1],
  ratio: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[2],
  maxPairs: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[3],
): ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation> {
  const pairs: number = first.length * second.length;
  if (pairs > maxPairs)
    throw new Error("camera-matches: descriptor pair budget exhausted");
  if (second.length < 2 || first.length === 0) return [];
  const forward: Float64Array = new Float64Array(first.length).fill(Infinity);
  const forwardSecond: Float64Array = new Float64Array(first.length).fill(
    Infinity,
  );
  const forwardIndex: Int32Array = new Int32Array(first.length).fill(-1);
  const reverse: Float64Array = new Float64Array(second.length).fill(Infinity);
  const reverseSecond: Float64Array = new Float64Array(second.length).fill(
    Infinity,
  );
  const reverseIndex: Int32Array = new Int32Array(second.length).fill(-1);
  for (let i: number = 0; i < first.length; i++) {
    for (let j: number = 0; j < second.length; j++) {
      let squared: number = 0;
      for (let channel: number = 0; channel < 128; channel++) {
        const difference: number =
          first[i]!.descriptor[channel]! - second[j]!.descriptor[channel]!;
        squared += difference * difference;
      }
      if (squared < forward[i]!) {
        forwardSecond[i] = forward[i]!;
        forward[i] = squared;
        forwardIndex[i] = j;
      } else if (squared < forwardSecond[i]!) forwardSecond[i] = squared;
      if (squared < reverse[j]!) {
        reverseSecond[j] = reverse[j]!;
        reverse[j] = squared;
        reverseIndex[j] = i;
      } else if (squared < reverseSecond[j]!) reverseSecond[j] = squared;
    }
  }
  const matches: ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation> =
    [];
  for (let i: number = 0; i < first.length; i++) {
    const j: number = forwardIndex[i]!;
    if (
      j < 0 ||
      reverseIndex[j] !== i ||
      !(reverse[j]! < reverseSecond[j]!) ||
      !(forward[i]! < ratio * ratio * forwardSecond[i]!)
    )
      continue;
    matches.push({
      firstIndex: i,
      secondIndex: j,
      first: [first[i]!.point[0], first[i]!.point[1]],
      second: [second[j]!.point[0], second[j]!.point[1]],
      squaredDescriptorDistance: forward[i]!,
      descriptorDistanceRatio: Math.sqrt(forward[i]! / forwardSecond[i]!),
    });
  }
  return matches;
}
