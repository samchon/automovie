import { createRecoverySceneNumericalFixture } from "./createRecoverySceneNumericalFixture";

/**
 * The numerical scene fixture with one reciprocal index link between the seed
 * and the last image that joins two otherwise distinct material-index seam
 * tracks, the identities 0 and 48, duplicating observations in a middle image.
 */
export function createRecoveryConflictingSceneFixture(): ReturnType<
  typeof createRecoverySceneNumericalFixture
> {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
  const pair: (typeof fixture.pairs)[number] | undefined = fixture.pairs.find(
    (item: (typeof fixture.pairs)[number]): boolean =>
      item.first === 0 && item.second === 4,
  );
  if (pair === undefined) throw new Error("The fixture pairs images 0 and 4");
  pair.forward.push({
    firstIndex: 0,
    secondIndex: 0,
    first: [...fixture.features[0]!.points[0]!.point],
    second: [...fixture.features[4]!.points[0]!.point],
    squaredDescriptorDistance: 0,
    descriptorDistanceRatio: 0,
  });
  pair.reverse.push({
    firstIndex: 0,
    secondIndex: 0,
    first: [...fixture.features[4]!.points[0]!.point],
    second: [...fixture.features[0]!.points[0]!.point],
    squaredDescriptorDistance: 0,
    descriptorDistanceRatio: 0,
  });
  return fixture;
}
