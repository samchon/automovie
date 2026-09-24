import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
  humanBodyBasisWeights,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { nclose } from "../internal/predicates";

/**
 * Shoulder kernels of one family interpolate instead of stacking: a family
 * is the kernels of one humerus whose correctives' other inputs are
 * identical, and their values are divided by their sum where it exceeds one.
 *
 * The fixture adds, on the left humerus, kernels centred at (90, 90, 0) and
 * (90, 120, 0) (30 degrees apart) with outer radius 60, a copy of the first
 * gated by the `width` channel, a right-humerus kernel at (90, 90, 0), and a
 * pair centred 30 degrees apart whose outer radius is 30.
 *
 * Scenarios:
 * 1. At (90, 105, 0) both left kernels read 0.75 and share the sum 1.5, so
 *    each wears 0.5; the channel-gated copy is its own family and wears 0.75.
 * 2. At (90, 90, 0) the centre reads 1 and its neighbour 0.5: the centre
 *    wears 2/3 and the neighbour 1/3.
 * 3. At (90, 60, 0) only the first reads anything (0.5), under one, and
 *    keeps it.
 * 4. The right humerus's kernel is its own family: at (90, 90, 0) on the
 *    right it wears 1 whatever the left kernels read.
 * 5. Kernels whose windows reach no other centre are exactly one at their
 *    own centre.
 */
export const test_human_body_shoulder_kernel_family = (): void => {
  const { basis, document } = humanBodyShoulderFixture(true);
  const kernel = (
    id: string,
    shoulder: "leftUpperArm" | "rightUpperArm",
    elevation: number,
    outerDegrees: number,
    gated = false,
  ): NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number] => ({
    id,
    inputs: [
      {
        shoulder,
        orientation: { plane: 90, elevation, axialRotation: 0 },
        innerDegrees: 0,
        outerDegrees,
      },
      ...(gated ? [{ channel: "width", side: "positive" as const }] : []),
    ],
    weight: 1,
    target: id,
  });
  basis.correctives = [
    ...(basis.correctives ?? []),
    kernel("a", "leftUpperArm", 90, 60),
    kernel("b", "leftUpperArm", 120, 60),
    kernel("gated", "leftUpperArm", 90, 60, true),
    kernel("right", "rightUpperArm", 90, 60),
    {
      ...kernel("near", "leftUpperArm", 90, 30),
      inputs: [
        ...kernel("near", "leftUpperArm", 90, 30).inputs,
        {
          bone: "leftLowerArm",
          axis: "flexion",
          side: "positive",
          onset: 0,
          full: 1,
        },
      ],
    },
    {
      ...kernel("far", "leftUpperArm", 120, 30),
      inputs: [
        ...kernel("far", "leftUpperArm", 120, 30).inputs,
        {
          bone: "leftLowerArm",
          axis: "flexion",
          side: "positive",
          onset: 0,
          full: 1,
        },
      ],
    },
  ];
  for (const id of ["a", "b", "gated", "right", "near", "far"])
    basis.surfaces[0].targets[id] = [0, 0, 0, 0.01];
  createHumanBodyBasisBuilder(basis);
  const read = (
    bone: "leftUpperArm" | "rightUpperArm",
    elevation: number,
  ): Map<string, number> =>
    new Map(
      humanBodyBasisWeights(basis, {
        ...document,
        shape: { width: 1 },
        pose: [
          { bone: "leftLowerArm", flexion: 50, abduction: null, twist: null },
        ],
        shoulders: [{ bone, plane: 90, elevation, axialRotation: 0 }],
      }).activations.map((one) => [one.target, one.activation]),
    );

  const between = read("leftUpperArm", 105);
  TestValidator.predicate(
    "two overlapping kernels share one whole correction",
    nclose(between.get("a")!, 0.5) && nclose(between.get("b")!, 0.5),
  );
  TestValidator.predicate(
    "a kernel gated by another input is its own family",
    nclose(between.get("gated")!, 0.75),
  );
  const centre = read("leftUpperArm", 90);
  TestValidator.predicate(
    "a centre inside its neighbour's window shares with it",
    nclose(centre.get("a")!, 2 / 3) && nclose(centre.get("b")!, 1 / 3),
  );
  const alone = read("leftUpperArm", 60);
  TestValidator.predicate(
    "a sum under one is kept",
    nclose(alone.get("a")!, 0.5) && nclose(alone.get("b")!, 0),
  );
  TestValidator.predicate(
    "the other humerus is another family",
    nclose(read("rightUpperArm", 90).get("right")!, 1),
  );
  TestValidator.predicate(
    "windows that reach no other centre are exact at their centres",
    nclose(centre.get("near")!, 1) &&
      nclose(centre.get("far")!, 0) &&
      nclose(read("leftUpperArm", 120).get("far")!, 1),
  );
};
