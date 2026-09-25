import { serializeHumanBodyBasisDocument } from "@automovie/human";
import { connectedBodyTransfers } from "@automovie/playground/src/human/connectedBodyProtocol";
import { createConnectedBodyRuntime } from "@automovie/playground/src/human/connectedBodyRuntime";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { rejectsError } from "../internal/predicates";

/**
 * The resident body worker solves the arms-down preset with its compiled
 * builder and returns document data only.
 *
 * Scenarios:
 * 1. On the shoulder fixture, whose arms carry no skin and so meet nothing,
 *    both arms hang at elevation 0 in the lateral plane with straight
 *    elbows, and the reply transfers no buffer.
 * 2. A basis without thorax-relative shoulders refuses the request.
 */
export const test_human_body_resident_arms_down = async (): Promise<void> => {
  const { basis, document } = humanBodyShoulderFixture();
  const result = await createConnectedBodyRuntime(basis)({
    operation: "armsDown",
    document: serializeHumanBodyBasisDocument(document),
  });
  if (result.operation !== "armsDown") throw new Error("Expected arms down.");
  TestValidator.equals(
    "both arms hang in the lateral plane",
    result.shoulders.map((one) => [one.bone, one.plane, one.elevation]),
    [
      ["leftUpperArm", 0, 0],
      ["rightUpperArm", 0, 0],
    ],
  );
  TestValidator.equals(
    "elbows straight",
    result.pose.map((one) => [one.bone, one.flexion]),
    [
      ["leftLowerArm", 0],
      ["rightLowerArm", 0],
    ],
  );
  TestValidator.equals(
    "no buffer transfers",
    connectedBodyTransfers(result),
    [],
  );
  const plain = humanBodyBasisFixture();
  TestValidator.predicate(
    "a basis without TT shoulders refuses",
    await rejectsError(
      () =>
        createConnectedBodyRuntime(plain.basis)({
          operation: "armsDown",
          document: serializeHumanBodyBasisDocument(plain.document),
        }),
      "thorax-tt",
    ),
  );
};
