import {
  AutoMovieMotionAudit as Audit,
  type AutoMoviePhysicsCache as Cache,
  measurePhysicalMotionConstraint as Measure,
} from "@automovie/engine";
import type { IAutoMovieMotionGeometry } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Numerical audit observes actual endpoint witnesses and three-point flexion.
 *
 * Scenarios:
 * 1. A hand witness extends 65 mm along its actual forearm ray.
 * 2. A rigid point follows the bone's 90 degree rotation.
 * 3. A straight chain measures zero bend, a right-angle chain measures pi/2.
 * 4. The complete audit collects simultaneous goal, spread and angle failures.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMovieMotionAudit`, `AutoMoviePhysicsCache`, `measurePhysicalMotionConstraint` on in-memory inputs and asserts the returned observations through 4x TestValidator.predicate, 1x TestValidator.equals; 4 numbered scenarios (first: A hand witness extends 65 mm along its actual forearm ray.; last: The complete audit collects simultaneous goal, spread and angle failures.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (4 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: A hand witness extends 65 mm along its actual forearm ray.; last: The complete audit collects simultaneous goal, spread and angle failures.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_motion_constraints`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A hand witness extends 65 mm along its actual forearm ray.).
 */
export async function test_physical_motion_constraints(): Promise<void> {
  const state: (x: number, y: number) => Cache.ISegment = (
    x: number,
    y: number,
  ): Cache.ISegment => ({
    position: { x, y, z: 0 },
    rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
  });
  const states: Record<string, Cache.ISegment> = {
    root: state(0, 1),
    hand: state(1, 1),
    pivot: state(0, 0),
  };
  const goal: Measure.IConstraint = {
    kind: "goal",
    label: "glove",
    start: 0,
    end: 1,
    point: { bone: "hand", ray: { from: "root", distance: 0.065 } },
    target: (): { x: number; y: number; z: number } => ({
      x: 1.065,
      y: 1,
      z: 0,
    }),
    maximum: 0.001,
  };
  TestValidator.predicate(
    "forearm ray witness",
    Measure(goal, states, 0) < 1e-12,
  );
  TestValidator.predicate(
    "rotated rigid witness",
    Measure(
      {
        ...goal,
        point: { bone: "root", localPoint: { x: 1, y: 0, z: 0 } },
        target: (): { x: number; y: number; z: number } => ({
          x: 0,
          y: 2,
          z: 0,
        }),
      },
      states,
      0,
    ) < 1e-12,
  );
  const angle: Measure.IConstraint = {
    kind: "angle",
    label: "bend",
    start: 0,
    end: 1,
    from: { bone: "root" },
    pivot: { bone: "pivot" },
    to: { bone: "hand" },
    minimum: Math.PI / 2,
  };
  TestValidator.predicate(
    "three-point bend",
    Math.abs(
      Measure(angle, { ...states, hand: state(1, 0) }, 0) - Math.PI / 2,
    ) < 1e-12,
  );
  TestValidator.predicate(
    "straight chain bend",
    Measure(angle, { ...states, hand: state(0, -1) }, 0) < 1e-12,
  );
  const result: Awaited<ReturnType<typeof Audit.run>> = await Audit.run({
    bodies: [
      {
        id: "rig",
        geometry: {
          segments: ["root", "hand", "pivot"].map(
            (bone: string): IAutoMovieMotionGeometry["segments"][number] => ({
              bone,
              shapes: structuredClone(
                PhysicalFixtures.sphere(0.01).segments[0]!.shapes,
              ),
            }),
          ),
          materials: PhysicalFixtures.sphere().materials,
          joints: [],
        },
        speeds: {},
        supports: [],
        floorTolerance: 0.001,
        overlapTolerance: 0.001,
        jointTolerance: 0.01,
        constraints: [
          {
            ...goal,
            target: (): { x: number; y: number; z: number } => ({
              x: 1.07,
              y: 1,
              z: 0,
            }),
            maximum: 0.001,
          },
          {
            kind: "distance",
            label: "spread",
            start: 0,
            end: 1,
            from: { bone: "root" },
            to: { bone: "hand" },
            maximum: 0.5,
          },
          { ...angle, minimum: 3 },
        ],
      },
    ],
    start: 0,
    end: 0,
    rate: 120,
    floor: -1,
    sample: (): Cache.IFrame => ({ seconds: 0, bodies: { rig: states } }),
    allowed: (): boolean => false,
  });
  TestValidator.equals(
    "all independent measurement families collected",
    result.findings.map(
      (finding: (typeof result.findings)[number]): string => finding.kind,
    ),
    ["goal", "distance", "angle"],
  );
}
