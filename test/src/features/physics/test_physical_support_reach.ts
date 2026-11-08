import { TestValidator } from "@nestia/e2e";

import { projectPhysicalSupportReach } from "../../../../packages/engine/src/physics/projectPhysicalSupportReach";

/** Two/four independent reach balls share a bounded root seed, while incompatible goals remain explicit failures. */
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
