import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { physicalSupportPoint } from "../../../../packages/engine/src/physics/physicalSupportPoint";
import { solvePhysicalArticulationTargets } from "../../../../packages/engine/src/physics/solvePhysicalArticulationTargets";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** A small geometric lever must continue improving until residual tolerance, independently of the size of one improvement.
 *
 * Scenarios:
 * 1. A quarter-millimetre hinge endpoint reaches its admissible target within 0.1 mm.
 * 2. The original goals, fixed pivot and locked rotation axes remain unchanged.
 */
export function test_physical_target_convergence(): void {
  const segment: P.ISegment = PhysicalFixtures.sphere().segments[0]!;
  const profile: P = {
    id: "small-lever",
    mass: 2,
    centerOfMass: { x: 0, y: 1, z: 0 },
    provenance:
      "Two equal rigid bodies joined at their common origin; an observed local point is 0.25 mm from the hinge.",
    materials: PhysicalFixtures.sphere().materials,
    segments: [
      { ...structuredClone(segment), bone: "root" },
      { ...structuredClone(segment), bone: "child" },
    ],
    joints: [
      {
        id: "hinge",
        parent: "root",
        child: "child",
        parentFrame: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        childFrame: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        axes: [
          {
            axis: "z",
            channel: "hinge.angle",
            minimum: -Math.PI / 2,
            maximum: Math.PI / 2,
            stiffness: 1,
            damping: 1,
            maximumTorque: 1,
          },
        ],
      },
    ],
  };
  const targets: Record<string, P.ITransform> = Object.fromEntries(
    profile.segments.map((item: P.ISegment): [string, P.ITransform] => [
      item.bone,
      structuredClone(item.neutral),
    ]),
  );
  const initial: string = JSON.stringify(targets);
  const point: V = { x: 0.00025, y: 0, z: 0 };
  const goal: V = {
    x: point.x * Math.cos(0.8),
    y: 1 + point.x * Math.sin(0.8),
    z: 0,
  };
  const result: ReturnType<typeof solvePhysicalArticulationTargets> =
    solvePhysicalArticulationTargets({
      profile,
      bones: ["child"],
      targets,
      iterations: 64,
      tolerance: 0.0001,
      measure: (poses: Readonly<Record<string, P.ITransform>>): number[] => {
        const difference: V = Vector3.subtract(
          physicalSupportPoint(poses.child!, point),
          goal,
        );
        return [difference.x, difference.y, difference.z];
      },
    });
  TestValidator.predicate(
    "actual residual reaches declared tolerance",
    Vector3.length(
      Vector3.subtract(
        physicalSupportPoint(result.targets.child!, point),
        goal,
      ),
    ) <= 0.0001 && result.residual <= 0.0001,
  );
  TestValidator.equals(
    "borrowed goals stay intact",
    JSON.stringify(targets),
    initial,
  );
  TestValidator.predicate(
    "fixed pivot and locked axes stay intact",
    Vector3.length(
      Vector3.subtract(
        result.targets.root!.position,
        result.targets.child!.position,
      ),
    ) < 1e-12 &&
      Math.abs(result.targets.child!.rotation.x) < 1e-12 &&
      Math.abs(result.targets.child!.rotation.y) < 1e-12,
  );
}
