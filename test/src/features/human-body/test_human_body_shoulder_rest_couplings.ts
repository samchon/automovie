import {
  type IAutoMovieHumanBodyShoulderPose,
  humanBodyBasisWeights,
  resolveHumanBodyCouplings,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShapedShoulderFixture } from "../internal/humanBodyShapedShoulderFixture";
import { nclose } from "../internal/predicates";

const degrees = (radians: number): number => (radians * 180) / Math.PI;

/**
 * A coupling reads the source arm's elevation, and an omitted goal reads the
 * shaped rest handed to it, so omitting the goal and writing the rest as an
 * explicit goal add the same girdle angle.
 *
 * The fixture couples each arm's elevation to its shoulder's abduction with
 * the curve (45 -> 0, 180 -> 11), so an elevation e adds 11 (e - 45) / 135
 * degrees above 45 and nothing at or below it. The shaped left arm sits at
 * atan(2) = 63.435 degrees and the right at the declared 45.
 *
 * Scenarios:
 * 1. With no rest passed, the omitted goal reads the A-pose and adds nothing.
 * 2. With the shaped rest, the omitted goal adds the closed-form angle to the
 *    left shoulder alone, and an explicit goal equal to that rest adds the
 *    same, both through the coupling and through the pose the weights return.
 * 3. Without the rest the same explicit goal still adds it while the omitted
 *    goal does not, which the rest exists to make equal.
 * 4. A rest equal to the A-pose adds what no rest adds.
 * 5. A one-sided rest leaves the other arm at its A-pose, and an explicit goal
 *    on one arm beside an omitted goal on the other couples each by its own.
 */
export const test_human_body_shoulder_rest_couplings = (): void => {
  const { basis, document, shaped, rest } = humanBodyShapedShoulderFixture();
  const shapedElevation = degrees(Math.atan(2));
  const added = (elevation: number): number =>
    (11 * (elevation - 45)) / 135;
  const goal = (
    bone: IAutoMovieHumanBodyShoulderPose["bone"],
    elevation: number,
  ): IAutoMovieHumanBodyShoulderPose => ({
    bone,
    plane: 0,
    elevation,
    axialRotation: 0,
  });
  const couple = (
    shoulders: IAutoMovieHumanBodyShoulderPose[],
    given?: Parameters<typeof resolveHumanBodyCouplings>[3],
  ): Record<string, number> =>
    Object.fromEntries(
      resolveHumanBodyCouplings(basis, [], shoulders, given).contributions.map(
        (one) => [one.coupling, one.degrees],
      ),
    );

  TestValidator.equals(
    "the A-pose adds nothing",
    couple([]),
    {},
  );
  const omitted = couple([], rest);
  TestValidator.predicate(
    "the omitted goal adds the shaped left angle and nothing on the right",
    Object.keys(omitted).join() === "leftRhythm" &&
      nclose(omitted.leftRhythm, added(shapedElevation), 1e-9) &&
      nclose(omitted.leftRhythm, 1.5021, 1e-4),
  );
  const explicit = couple([goal("leftUpperArm", shapedElevation)], rest);
  TestValidator.predicate(
    "an explicit goal equal to the shaped rest adds the same angle",
    Object.keys(explicit).join() === "leftRhythm" &&
      nclose(explicit.leftRhythm, omitted.leftRhythm, 1e-9),
  );
  const posed = (
    shoulders: IAutoMovieHumanBodyShoulderPose[] | undefined,
  ): number | null | undefined =>
    humanBodyBasisWeights(
      basis,
      { ...document, shape: shaped, pose: [], shoulders },
      rest,
    ).pose.find((joint) => joint.bone === "leftShoulder")?.abduction;
  TestValidator.predicate(
    "the weights return the coupled girdle pose for either spelling",
    nclose(posed(undefined)!, omitted.leftRhythm, 1e-9) &&
      nclose(posed([goal("leftUpperArm", shapedElevation)])!, omitted.leftRhythm, 1e-9),
  );
  TestValidator.predicate(
    "without the rest only the explicit goal adds the angle",
    Object.keys(couple([goal("leftUpperArm", shapedElevation)])).join() ===
      "leftRhythm" &&
      nclose(
        couple([goal("leftUpperArm", shapedElevation)]).leftRhythm,
        omitted.leftRhythm,
        1e-9,
      ),
  );
  const declared = new Map(
    basis.joints.flatMap((joint) =>
      joint.shoulder === undefined
        ? []
        : [
            [
              joint.bone as IAutoMovieHumanBodyShoulderPose["bone"],
              {
                bone: joint.bone as IAutoMovieHumanBodyShoulderPose["bone"],
                ...joint.shoulder.neutral,
              },
            ] as const,
          ],
    ),
  );
  TestValidator.equals(
    "a rest equal to the A-pose adds what no rest adds",
    couple([goal("rightUpperArm", 100)], declared),
    couple([goal("rightUpperArm", 100)]),
  );
  const onlyLeft = new Map([
    ["leftUpperArm" as const, rest.get("leftUpperArm")!],
  ]);
  const sided = couple([goal("rightUpperArm", 100)], onlyLeft);
  TestValidator.predicate(
    "a left-only rest and an explicit right goal couple each arm by its own",
    Object.keys(sided).join() === "leftRhythm,rightRhythm" &&
      nclose(sided.leftRhythm, added(shapedElevation), 1e-9) &&
      nclose(sided.rightRhythm, added(100), 1e-9),
  );
  const mixed = couple([goal("leftUpperArm", 100)], rest);
  TestValidator.predicate(
    "an explicit left goal beside an omitted right goal ignores the left rest",
    Object.keys(mixed).join() === "leftRhythm" &&
      nclose(mixed.leftRhythm, added(100), 1e-9),
  );
};
