import {
  Vector3,
  distributePhysicalSupportWrench as distribute,
} from "@automovie/engine";
import type { IAutoMovieVector3 as V } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Actual-point support allocation retains force/moment feasibility and reports impossible demand.
 *
 * Scenarios:
 * 1. Two finite patches and four point supports carry a neutral load with feasible per-support CoP.
 * 2. Horizontal force and yaw demand are realized together, within unilateral Coulomb friction.
 * 3. Diagonal demand cannot exploit the corners of a circumscribed friction box.
 * 4. Pulling, point-contact yaw and unsupported flight retain explicit wrench residuals.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Vector3`, `distributePhysicalSupportWrench` on in-memory inputs and asserts the returned observations through 8x TestValidator.predicate; 4 numbered scenarios (first: Two finite patches and four point supports carry a neutral load with feasible per-support CoP.; last: Pulling, point-contact yaw and unsupported flight retain explicit wrench residuals.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (8 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: Two finite patches and four point supports carry a neutral load with feasible per-support CoP.; last: Pulling, point-contact yaw and unsupported flight retain explicit wrench residuals.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_wrench`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Two finite patches and four point supports carry a neutral load with feasible per-support CoP.).
 */
export function test_physical_support_wrench(): void {
  const origin: V = { x: 0, y: 1, z: 0 };
  const two: Parameters<typeof distribute>[0]["points"] = [-1, 1].flatMap(
    (side: number): Parameters<typeof distribute>[0]["points"][number][] =>
      [-1, 1].flatMap(
        (x: number): Parameters<typeof distribute>[0]["points"][number][] =>
          [-1, 1].map(
            (
              z: number,
            ): Parameters<typeof distribute>[0]["points"][number] => ({
              bone: `patch-${side}`,
              point: { x: x * 0.1, y: 0, z: side * 0.2 + z * 0.05 },
              friction: 0.6,
            }),
          ),
      ),
  );
  const four: Parameters<typeof distribute>[0]["points"] = [-1, 1].flatMap(
    (x: number): Parameters<typeof distribute>[0]["points"][number][] =>
      [-1, 1].map(
        (z: number): Parameters<typeof distribute>[0]["points"][number] => ({
          bone: `point-${x}-${z}`,
          point: { x: x * 0.3, y: 0, z: z * 0.2 },
          friction: 0.6,
        }),
      ),
  );
  for (const [name, points] of [
    ["two patches", two],
    ["four points", four],
  ] as const) {
    const result: ReturnType<typeof distribute> = distribute({
      origin,
      points,
      force: { x: 0, y: 100, z: 0 },
      torque: { x: 0, y: 0, z: 0 },
      maximumForce: 200,
    });
    feasible(result);
    TestValidator.predicate(
      `${name}: full weight and zero moment`,
      Vector3.length(result.residual.force) < 0.001 &&
        Vector3.length(result.residual.torque) < 0.001,
    );
    for (const bone of new Set(
      points.map((point: (typeof points)[number]): string => point.bone),
    )) {
      const own: typeof result.forces = result.forces.filter(
        (point: (typeof result.forces)[number]): boolean => point.bone === bone,
      );
      const normal: number = own.reduce(
        (sum: number, point: (typeof own)[number]): number =>
          sum + point.force.y,
        0,
      );
      const cop: V = Vector3.scale(
        own.reduce(
          (sum: V, point: (typeof own)[number]): V =>
            Vector3.add(sum, Vector3.scale(point.point, point.force.y)),
          { x: 0, y: 0, z: 0 },
        ),
        1 / normal,
      );
      const patch: typeof points = points.filter(
        (point: (typeof points)[number]): boolean => point.bone === bone,
      );
      TestValidator.predicate(
        `${name}: ${bone} CoP stays on its own patch`,
        normal > 0 &&
          cop.x >=
            Math.min(
              ...patch.map(
                (point: (typeof patch)[number]): number => point.point.x,
              ),
            ) -
              1e-9 &&
          cop.x <=
            Math.max(
              ...patch.map(
                (point: (typeof patch)[number]): number => point.point.x,
              ),
            ) +
              1e-9 &&
          cop.z >=
            Math.min(
              ...patch.map(
                (point: (typeof patch)[number]): number => point.point.z,
              ),
            ) -
              1e-9 &&
          cop.z <=
            Math.max(
              ...patch.map(
                (point: (typeof patch)[number]): number => point.point.z,
              ),
            ) +
              1e-9,
      );
    }
  }
  const moving: ReturnType<typeof distribute> = distribute({
    origin,
    points: four,
    force: { x: 5, y: 100, z: 4 },
    torque: { x: 0, y: 2, z: 0 },
    maximumForce: 200,
  });
  feasible(moving);
  TestValidator.predicate(
    "translation and yaw share feasible actual contact forces",
    Vector3.length(moving.residual.force) < 0.001 &&
      Vector3.length(moving.residual.torque) < 0.001,
  );
  const single: Parameters<typeof distribute>[0]["points"] = [
    { bone: "point", point: { x: 0, y: 0, z: 0 }, friction: 0.5 },
  ];
  const diagonal: ReturnType<typeof distribute> = distribute({
    origin: { x: 0, y: 0, z: 0 },
    points: single,
    force: { x: 100, y: 100, z: 100 },
    torque: { x: 0, y: 0, z: 0 },
    maximumForce: 200,
  });
  feasible(diagonal);
  TestValidator.predicate(
    "infeasible diagonal force remains visible",
    Vector3.length(diagonal.residual.force) > 50,
  );
  const pull: ReturnType<typeof distribute> = distribute({
    origin,
    points: single,
    force: { x: 0, y: -10, z: 0 },
    torque: { x: 0, y: 0, z: 0 },
    maximumForce: 200,
  });
  feasible(pull);
  TestValidator.predicate(
    "floor cannot pull the body down",
    0.001 > pull.force.y && -9.999 > pull.residual.force.y,
  );
  const yaw: ReturnType<typeof distribute> = distribute({
    origin,
    points: single,
    force: { x: 0, y: 10, z: 0 },
    torque: { x: 0, y: 5, z: 0 },
    maximumForce: 200,
  });
  TestValidator.predicate(
    "one point cannot supply yaw torque",
    Math.abs(yaw.torque.y) < 1e-12 && yaw.residual.torque.y === 5,
  );
  const flight: ReturnType<typeof distribute> = distribute({
    origin,
    points: [],
    force: { x: 0, y: 100, z: 0 },
    torque: { x: 1, y: 2, z: 3 },
    maximumForce: 200,
  });
  TestValidator.predicate(
    "flight invents no support force",
    flight.forces.length === 0 &&
      flight.force.y === 0 &&
      flight.residual.force.y === 100 &&
      flight.residual.torque.z === 3,
  );

  /** Independently measure each returned contact, rather than trust an optimization status. */
  function feasible(result: ReturnType<typeof distribute>): void {
    for (const point of result.forces)
      TestValidator.predicate(
        "unilateral circular Coulomb cone",
        point.force.y >= 0 &&
          Math.hypot(point.force.x, point.force.z) <=
            point.friction * point.force.y + 1e-9,
      );
  }
}
