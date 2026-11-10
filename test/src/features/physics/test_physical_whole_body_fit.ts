import {
  Quaternion,
  Vector3,
  fitPhysicalWholeBodyTarget,
  measurePhysicalJointLimits,
  rerootPhysicalProfile,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** A whole body held on one support reaches a goal its free limb alone cannot, inside every ROM and without moving the contact.
 *
 * Scenarios:
 * 1. Rerooting inverts exactly the joints on the path to the held segment and mirrors their ranges; other joints are shared unchanged.
 * 2. The polygon man's right ankle cannot reach a goal 1.35 m high and 0.55 m ahead by its own leg: hip flexion stops at 120 degrees, 133 degrees away from straight down.
 * 3. Holding the left ankle and freeing the left leg and trunk, the pelvis tilts and the same goal is reached within 5 mm.
 * 4. Every original joint stays inside its declared ROM, its anchors coincide, and the held contact point does not move.
 * 5. A declared shin approach turns the shin toward it, and the report splits the point and approach residuals; the fit is local, so a weighted approach trades point error for direction.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `fitPhysicalWholeBodyTarget` on in-memory inputs and asserts the returned observations through 2x TestValidator.equals, 4x TestValidator.predicate; 5 numbered scenarios (first: Rerooting inverts exactly the joints on the path to the held segment and mirrors their ranges; other joints...; last: A declared shin approach turns the shin toward it, and the report splits the point and approach residuals;...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (3 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 5 numbered scenarios (first: Rerooting inverts exactly the joints on the path to the held segment and mirrors their ranges; other joints...; last: A declared shin approach turns the shin toward it, and the report splits the point and approach residuals;...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_whole_body_fit`, which owns the cases delegated to `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Rerooting inverts exactly the joints on the path to the held segment and mirrors their ranges; other joints are shared unchanged.).
 */
export function test_physical_whole_body_fit(): void {
  const { profile } = PhysicalModelFixtures.stickman();
  const neutral: Record<string, P.ITransform> = Object.fromEntries(
    profile.segments.map((s: P.ISegment): [string, P.ITransform] => [
      s.bone,
      structuredClone(s.neutral),
    ]),
  );

  // Rerooting on the left shank inverts its knee and hip only.
  const rerooted: P = rerootPhysicalProfile(profile, "leftLowerLeg");
  const changed: string[] = rerooted.joints
    .filter(
      (joint: P.IJoint, k: number): boolean => joint !== profile.joints[k],
    )
    .map((joint: P.IJoint): string => joint.id);
  const original: P.IJoint = profile.joints.find(
    (joint: P.IJoint): boolean => joint.id === "leftUpperLeg",
  )!;
  const hip: P.IJoint = rerooted.joints.find(
    (joint: P.IJoint): boolean => joint.id === "leftUpperLeg",
  )!;
  TestValidator.equals(
    "inverted path",
    changed.sort((a: string, b: string): number => a.localeCompare(b)),
    ["leftLowerLeg", "leftUpperLeg"],
  );
  TestValidator.predicate(
    "inverted hip",
    hip.parent === "leftUpperLeg" &&
      hip.child === "hips" &&
      hip.axes.every(
        (axis: P.IAxis, k: number): boolean =>
          axis.minimum === -original.axes[k]!.maximum &&
          axis.maximum === -original.axes[k]!.minimum,
      ),
  );

  const ankle: IAutoMovieVector3 = { x: 0, y: -0.396, z: 0 };
  const contact: IAutoMovieVector3 = Vector3.add(
    neutral.leftLowerLeg!.position,
    ankle,
  );
  const goal: IAutoMovieVector3 = { x: -0.126, y: 1.35, z: -0.55 };
  const fit = (
    bones: string[],
    approach?: NonNullable<
      Parameters<typeof fitPhysicalWholeBodyTarget>[0]["goal"]["approach"]
    >,
  ): fitPhysicalWholeBodyTarget.IResult =>
    fitPhysicalWholeBodyTarget({
      profile,
      targets: neutral,
      support: {
        bone: "leftLowerLeg",
        point: contact,
        normal: { x: 0, y: 1, z: 0 },
        minimum: -0.5,
        maximum: 0.5,
      },
      bones,
      goal: {
        bone: "rightLowerLeg",
        localPoint: ankle,
        point: goal,
        ...(approach ? { approach } : {}),
      },
      iterations: 64,
      tolerance: 1e-4,
    });
  const legOnly: fitPhysicalWholeBodyTarget.IResult = fit([
    "rightUpperLeg",
    "rightLowerLeg",
  ]);
  const whole: fitPhysicalWholeBodyTarget.IResult = fit([
    "leftLowerLeg",
    "leftUpperLeg",
    "spine",
    "rightUpperLeg",
    "rightLowerLeg",
  ]);
  TestValidator.predicate(
    `the free leg alone falls short (${legOnly.position} m)`,
    legOnly.position > 0.02,
  );
  TestValidator.predicate(
    `the whole body reaches (${whole.position} m)`,
    whole.position < 0.005,
  );
  inspect(whole.targets);

  // A declared shin direction, turned forward and up, pulls the fit toward it.
  const direction: IAutoMovieVector3 = Vector3.normalize({
    x: 0,
    y: 0.5,
    z: -1,
  });
  const approached: fitPhysicalWholeBodyTarget.IResult = fit(
    ["leftLowerLeg", "leftUpperLeg", "spine", "rightUpperLeg", "rightLowerLeg"],
    { localDirection: { x: 0, y: -1, z: 0 }, direction, weight: 0.02 },
  );
  const shin = (targets: Record<string, P.ITransform>): number =>
    Vector3.dot(
      Quaternion.rotateVector(targets.rightLowerLeg!.rotation, {
        x: 0,
        y: -1,
        z: 0,
      }),
      direction,
    );
  TestValidator.predicate(
    `approach followed (${shin(whole.targets)} -> ${shin(approached.targets)})`,
    shin(approached.targets) > shin(whole.targets) + 0.05 &&
      Math.abs(
        approached.residual -
          Math.hypot(approached.position, approached.approach),
      ) < 1e-12,
  );
  inspect(approached.targets);

  /** Anchors, ROM and the held contact, measured on the original tree. */
  function inspect(targets: Record<string, P.ITransform>): void {
    const failures: string[] = [];
    for (const joint of profile.joints) {
      const parent: P.ITransform = targets[joint.parent]!;
      const child: P.ITransform = targets[joint.child]!;
      const a: IAutoMovieVector3 = Vector3.add(
        parent.position,
        Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
      );
      const b: IAutoMovieVector3 = Vector3.add(
        child.position,
        Quaternion.rotateVector(child.rotation, joint.childFrame.position),
      );
      if (Vector3.length(Vector3.subtract(a, b)) > 1e-9)
        failures.push(`${joint.id}: anchor`);
      if (
        measurePhysicalJointLimits(joint, parent, child).some(
          (
            coordinate: ReturnType<typeof measurePhysicalJointLimits>[number],
          ): boolean => coordinate.violation > 1e-9,
        )
      )
        failures.push(`${joint.id}: ROM`);
    }
    const held: P.ITransform = targets.leftLowerLeg!;
    const moved: number = Vector3.length(
      Vector3.subtract(
        Vector3.add(
          held.position,
          Quaternion.rotateVector(held.rotation, ankle),
        ),
        contact,
      ),
    );
    if (moved > 1e-9) failures.push(`contact moved ${moved} m`);
    TestValidator.equals("anchored, admitted and held", failures, []);
  }
}
