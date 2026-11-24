import { projectPhysicalSupportReach } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Two/four independent reach balls share a bounded root seed, while incompatible goals remain explicit failures.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `projectPhysicalSupportReach` on in-memory inputs and asserts the returned observations through 3x TestValidator.equals; the behavior its summary names. A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (2 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes the behavior its summary names, including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_reach`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Two/four independent reach balls share a bounded root seed, while incompatible goals remain explicit failures) as stated in this comment.
 */
export function test_physical_support_reach(): void {
  for (const count of [2, 4]) {
    const supports: Parameters<
      typeof projectPhysicalSupportReach
    >[0]["supports"] = Array.from(
      { length: count },
      (
        _: unknown,
        index: number,
      ): Parameters<
        typeof projectPhysicalSupportReach
      >[0]["supports"][number] => ({
        origin: { x: index * 0.2, y: 1, z: (index % 2) * 0.2 },
        target: { x: index * 0.2 + 0.4, y: 0, z: (index % 2) * 0.2 },
        radius: 0.95,
      }),
    );
    const before: string = JSON.stringify(supports);
    const result: ReturnType<typeof projectPhysicalSupportReach> =
      projectPhysicalSupportReach({
        supports,
        maximumTranslation: 0.5,
        iterations: 8,
        tolerance: 1e-12,
      });
    TestValidator.equals(
      `${count} support balls converge without moving goals`,
      result.converged &&
        result.maximumExcess <= 1e-12 &&
        Math.hypot(
          result.translation.x,
          result.translation.y,
          result.translation.z,
        ) <= 0.5,
      true,
    );
    TestValidator.equals(
      "borrowed support declarations stay unchanged",
      JSON.stringify(supports),
      before,
    );
  }
  const conflict: ReturnType<typeof projectPhysicalSupportReach> =
    projectPhysicalSupportReach({
      supports: [-2, 2].map(
        (
          x: number,
        ): Parameters<
          typeof projectPhysicalSupportReach
        >[0]["supports"][number] => ({
          origin: { x: 0, y: 0, z: 0 },
          target: { x, y: 0, z: 0 },
          radius: 0.5,
        }),
      ),
      maximumTranslation: 0.25,
      iterations: 8,
      tolerance: 0.001,
    });
  TestValidator.equals(
    "incompatible reaches retain their actual residual",
    !conflict.converged &&
      conflict.maximumExcess >= 1.5 &&
      Math.hypot(
        conflict.translation.x,
        conflict.translation.y,
        conflict.translation.z,
      ) <= 0.25,
    true,
  );
}
