import {
  type IAutoMovieHumanBodyShoulderPose,
  humanBodyBasisWeights,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShapedShoulderFixture } from "../internal/humanBodyShapedShoulderFixture";
import { nclose } from "../internal/predicates";

const degrees = (radians: number): number => (radians * 180) / Math.PI;

/**
 * An omitted shoulder goal means the shaped body's own rest for the kernels
 * and the elevation drivers, and passing no rest means the basis's A-pose.
 *
 * The fixture's shaped left arm hangs atan(2) = 63.435 degrees from the
 * vertical and the declared A-pose is 45 degrees. A kernel at elevation 80
 * with outer radius 25 is therefore off at the A-pose (35 degrees away) and
 * inside its support at the shaped rest (16.565 degrees away), which gives it
 * the activation (25 - 16.565) / 25. A driver ramp from 5 to 25 degrees of
 * travel reads an explicit goal against the rest it is handed.
 *
 * Scenarios:
 * 1. With no rest passed, the omitted goal reads the A-pose: no kernel or
 *    driver is active, as admission requires of the base.
 * 2. With the shaped rest, an omitted goal activates the left kernel by the
 *    closed form and leaves the right kernel and the driver off.
 * 3. An explicit goal written as the shaped rest selects the same activations
 *    as the omitted goal, kernel and driver each.
 * 4. Without the rest the same explicit goal selects different ones, so the
 *    equality of scenario 3 is the rest's doing and not an accident.
 * 5. A rest equal to the A-pose selects what passing none selects.
 * 6. One-sided and mixed documents keep each arm's own reading: a rest for the
 *    left arm alone leaves the right at the A-pose, and an explicit left goal
 *    beside an omitted right goal each read their own rest.
 */
export const test_human_body_shoulder_rest_weights = (): void => {
  const { basis, shaped, rest } = humanBodyShapedShoulderFixture();
  const shapedElevation = degrees(Math.atan(2));
  const kernelAtShapedRest = (25 - (80 - shapedElevation)) / 25;
  const left = (elevation: number): IAutoMovieHumanBodyShoulderPose => ({
    bone: "leftUpperArm",
    plane: 0,
    elevation,
    axialRotation: 0,
  });
  const right = (elevation: number): IAutoMovieHumanBodyShoulderPose => ({
    ...left(elevation),
    bone: "rightUpperArm",
  });
  const activations = (
    shoulders: IAutoMovieHumanBodyShoulderPose[] | undefined,
    given?: Parameters<typeof humanBodyBasisWeights>[2],
    shape: Record<string, number> = shaped,
  ): Record<string, number> =>
    Object.fromEntries(
      humanBodyBasisWeights(basis, { shape, pose: [], shoulders }, given)
        .activations.filter((one) => /Kernel$|^driver/.test(one.target))
        .map((one) => [one.target, one.activation]),
    );
  const equal = (
    a: Record<string, number>,
    b: Record<string, number>,
  ): boolean =>
    Object.keys(a).length === 3 &&
    Object.keys(a).every((key) => nclose(a[key], b[key], 1e-9));

  const fixed = activations(undefined);
  TestValidator.equals("the A-pose is off for every reader", fixed, {
    leftUpperArmKernel: 0,
    rightUpperArmKernel: 0,
    driverLeft: 0,
  });
  const omitted = activations(undefined, rest);
  TestValidator.predicate(
    "an omitted goal reads the shaped rest in the left kernel",
    nclose(omitted.leftUpperArmKernel, kernelAtShapedRest, 1e-9) &&
      nclose(omitted.leftUpperArmKernel, 0.3373979528, 1e-9),
  );
  TestValidator.predicate(
    "the right kernel and the driver stay off at the omitted rest",
    omitted.rightUpperArmKernel === 0 && nclose(omitted.driverLeft, 0, 1e-9),
  );
  const explicit = activations([left(shapedElevation)], rest);
  TestValidator.predicate(
    "an explicit goal equal to the shaped rest selects the omitted activations",
    equal(omitted, explicit),
  );
  const unaided = activations([left(shapedElevation)]);
  TestValidator.predicate(
    "without the rest the explicit goal reads the A-pose driver travel",
    nclose(unaided.driverLeft, (shapedElevation - 45 - 5) / 20, 1e-9) &&
      unaided.driverLeft > 0.5,
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
  TestValidator.predicate(
    "a rest equal to the A-pose selects what no rest selects",
    equal(activations([left(70)], declared), activations([left(70)])),
  );
  const onlyLeft = new Map([
    ["leftUpperArm" as const, rest.get("leftUpperArm")!],
  ]);
  const sided = activations([right(70)], onlyLeft);
  TestValidator.predicate(
    "a left-only rest leaves the right arm at the A-pose with its own goal",
    nclose(sided.leftUpperArmKernel, kernelAtShapedRest, 1e-9) &&
      nclose(sided.rightUpperArmKernel, (25 - 10) / 25, 1e-9),
  );
  const mixed = activations([left(80)], rest);
  TestValidator.predicate(
    "an explicit left goal beside an omitted right one reads each its own rest",
    nclose(mixed.leftUpperArmKernel, 1, 1e-9) &&
      nclose(mixed.driverLeft, (80 - shapedElevation - 5) / 20, 1e-9) &&
      mixed.rightUpperArmKernel === 0,
  );
};
