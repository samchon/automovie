import type { IAutoMovieMotionGeometry } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AutoMovieMotionAudit as Audit } from "../../../../packages/engine/src/physics/AutoMovieMotionAudit";
import type { AutoMoviePhysicsCache as Cache } from "../../../../packages/engine/src/physics/AutoMoviePhysicsCache";
import { measurePhysicalMotionConstraint as Measure } from "../../../../packages/engine/src/physics/measurePhysicalMotionConstraint";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Numerical audit observes actual endpoint witnesses and three-point flexion.
 *
 * Scenarios:
 * 1. A hand witness extends 65 mm along its actual forearm ray.
 * 2. A rigid point follows the bone's 90 degree rotation.
 * 3. A straight chain measures zero bend, a right-angle chain measures pi/2.
 * 4. The complete audit collects simultaneous goal, spread and angle failures.
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
