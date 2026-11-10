import {
  AutoMoviePhysicalSimulation as Simulation,
  preparePhysicalGeometry,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/**
 * A zero-axis capsule is the same sphere in geometric penetration, native floor contact and complete replay at translated scene coordinates.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalSimulation`, `preparePhysicalGeometry` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; the behavior its summary names. A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes the behavior its summary names, including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_degenerate_capsule`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A zero-axis capsule is the same sphere in geometric penetration, native floor contact and complete replay at translated scene coordinates) as stated in this comment.
 */
export async function test_physical_degenerate_capsule(): Promise<void> {
  const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
    await preparePhysicalGeometry();
  const findings: string[] = [];
  for (const x of [-2, 0, 2]) {
    const sphere: P = PhysicalFixtures.sphere();
    sphere.segments[0]!.neutral.position.x = x;
    sphere.centerOfMass.x = x;
    const capsule: P = structuredClone(sphere);
    const surface: P.IShape = capsule.segments[0]!.shapes[0]!;
    if (surface.kind !== "sphere")
      throw new Error("Analytic primitive fixture changed");
    capsule.segments[0]!.shapes[0] = {
      ...surface,
      kind: "capsule",
      halfLength: 0,
    };
    const measured: number[] = [];
    const runs: Simulation[] = [];
    for (const profile of [sphere, capsule]) {
      const first: Parameters<typeof geometry.contact>[0] = {
        body: "a",
        bone: "root",
        shape: profile.segments[0]!.shapes[0]!,
        pose: profile.segments[0]!.neutral,
      };
      const second: typeof first = {
        ...first,
        body: "b",
        pose: {
          ...first.pose,
          position: { ...first.pose.position, x: x + 0.15 },
        },
      };
      const contact: ReturnType<typeof geometry.contact> = geometry.contact(
        first,
        second,
        0,
      );
      if (!contact) findings.push(`missing analytic penetration at x=${x}`);
      else measured.push(contact.separation);
      const input: Simulation.IInput = PhysicalFixtures.input(
        [PhysicalFixtures.body("probe", profile, 2)],
        2,
      );
      Object.assign(input, { floor: 0, gravity: { x: 0, y: -9.81, z: 0 } });
      runs.push(await Simulation.compute(input));
    }
    if (
      measured.some((value: number): boolean => Math.abs(value + 0.05) > 1e-6)
    )
      findings.push(
        `penetration is not the analytic 50 mm at x=${x}: ${JSON.stringify(measured)}`,
      );
    if (
      JSON.stringify(runs[0]!.cache.frames) !==
        JSON.stringify(runs[1]!.cache.frames) ||
      JSON.stringify(runs[0]!.cache.contacts) !==
        JSON.stringify(runs[1]!.cache.contacts)
    )
      findings.push(
        `equivalent primitives differ in native replay or contact at x=${x}`,
      );
  }
  TestValidator.equals(
    "all translated sphere/zero-axis-capsule observations",
    findings,
    [],
  );
}
