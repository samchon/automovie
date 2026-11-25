import { solvePhysicalFloorChainTarget } from "@automovie/engine";
import type {
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalPointFixtures } from "../../../internal/PhysicalPointFixtures";

/**
 * A real bounded articulation starting exactly on the floor can lift into
 * positive clearance: an exact floor inequality does not pin the requested
 * departure. (The interval rows themselves are unit-tested in
 * test_unit_engine_physics_linearize_interval.)
 */
export function test_unit_engine_physics_solve_physical_floor_chain_target_interval(): void {
  const profile: P = PhysicalPointFixtures.profile();
  const targets: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    profile.segments.map(
      (
        segment: IAutoMoviePhysicalSegment,
      ): [string, IAutoMovieRigidTransform] => [
        segment.bone,
        structuredClone(segment.neutral),
      ],
    ),
  );
  const lifted: ReturnType<typeof solvePhysicalFloorChainTarget> =
    solvePhysicalFloorChainTarget({
      profile,
      targets,
      chain: ["carrier", "source"],
      contacts: ["source"],
      goal: { x: Math.sqrt(0.99), y: 1.1, z: 0 },
      endpointHeight: 1.1,
      floor: 0.99,
      iterations: 32,
      tolerance: 1e-6,
    });
  TestValidator.predicate(
    "an exact floor inequality does not pin the requested departure",
    lifted.residual < 1e-6 &&
      Math.abs(lifted.targets.source!.position.y - 1.1) < 1e-6,
  );
}
