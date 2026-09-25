import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
  humanBodyBasisWeights,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { nclose } from "../internal/predicates";

/**
 * Pose correctives solved on different shapes interpolate instead of
 * stacking: correctives with the same pose drivers form a family, the
 * channels and sides each one reads name its shape example, and the
 * examples' shape factors are divided by their sum where it exceeds one.
 *
 * The fixture adds, on an elbow flexion, correctives gated by `width` (two:
 * the end of the ramp and a midpoint), by `tall`, and by `width` together
 * with `tall`; one gated by `width` on a different pose; one on the elbow
 * with no channel; and one read by `width` alone with no pose.
 *
 * Scenarios:
 * 1. On `width` alone the family's sum is one: both `width` correctives keep
 *    their activation, the midpoint as much as the end.
 * 2. On `width` and `tall` together the three examples each read one: each
 *    wears a third.
 * 3. On half `width` and half `tall` the two single examples sum to one and
 *    keep their halves; the joint example reads a quarter and the sum 1.25
 *    divides every member.
 * 4. A corrective on another pose, one with no channel, and one with no pose
 *    are outside every family.
 */
export const test_human_body_shape_family = (): void => {
  const { basis, document } = humanBodyShoulderFixture(true);
  type Corrective = NonNullable<
    IAutoMovieHumanBodyBasis["correctives"]
  >[number];
  const elbow = (full: number) => ({
    bone: "leftLowerArm" as const,
    axis: "flexion" as const,
    side: "positive" as const,
    onset: 0,
    full,
  });
  const channel = (id: string) => ({
    channel: id,
    side: "positive" as const,
  });
  const corrective = (
    id: string,
    inputs: Corrective["inputs"],
  ): Corrective => ({
    id: `pose/${id}`,
    inputs,
    weight: 1,
    target: `pose/${id}`,
  });
  basis.correctives = [
    ...(basis.correctives ?? []),
    corrective("width", [channel("width"), elbow(90)]),
    corrective("widthMid", [channel("width"), elbow(45)]),
    corrective("tall", [channel("tall"), elbow(90)]),
    corrective("both", [channel("width"), channel("tall"), elbow(90)]),
    corrective("otherPose", [
      channel("width"),
      { ...elbow(90), bone: "rightLowerArm" },
    ]),
    corrective("bare", [elbow(90)]),
    corrective("still", [channel("width")]),
  ];
  for (const one of basis.correctives)
    basis.surfaces[0].targets[one.target] ??= [0, 0, 0, 0.01];
  createHumanBodyBasisBuilder(basis);
  const read = (shape: Record<string, number>): Map<string, number> =>
    new Map(
      humanBodyBasisWeights(basis, {
        ...document,
        shape,
        pose: [
          { bone: "leftLowerArm", flexion: 90, abduction: null, twist: null },
          { bone: "rightLowerArm", flexion: 90, abduction: null, twist: null },
        ],
      }).activations.map((one) => [
        one.target.replace("pose/", ""),
        one.activation,
      ]),
    );

  const wide = read({ width: 1 });
  TestValidator.predicate(
    "one example keeps its whole stack",
    nclose(wide.get("width")!, 1) &&
      nclose(wide.get("widthMid")!, 1) &&
      nclose(wide.get("tall")!, 0) &&
      nclose(wide.get("both")!, 0),
  );
  const mixed = read({ width: 1, tall: 1 });
  TestValidator.predicate(
    "three whole examples wear a third each",
    ["width", "widthMid", "tall", "both"].every((id) =>
      nclose(mixed.get(id)!, 1 / 3),
    ),
  );
  const half = read({ width: 0.5, tall: 0.5 });
  TestValidator.predicate(
    "a sum over one divides every member",
    nclose(half.get("width")!, 0.5 / 1.25) &&
      nclose(half.get("tall")!, 0.5 / 1.25) &&
      nclose(half.get("both")!, 0.25 / 1.25),
  );
  TestValidator.predicate(
    "other poses, bare poses and still shapes are outside the family",
    nclose(mixed.get("otherPose")!, 1) &&
      nclose(mixed.get("bare")!, 1) &&
      nclose(mixed.get("still")!, 1),
  );
};
