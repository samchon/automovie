import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type {
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";
import { physicalMovingPair } from "../../../internal/physicalMovingPair";

/**
 * A body's `releaseOnContact` hands the whole body to the solver on positive
 * solver contact with the named shapes, irreversibly, and a return the receiver
 * blocks is refused rather than passed through it.
 *
 * Scenarios, 0.5 s at 120 Hz and 8 substeps:
 *
 * 1. A kinematic striker sweeping into the moving pair's child within the release
 *    window leaves the pair's root `dynamic` at 0.5 s; the same sweep 3 m up, a
 *    miss, leaves it `authored`.
 * 2. A ball returning toward a kinematic sphere in its way is refused with
 *    "Physical return intersects receiver".
 */
export async function test_unit_engine_physics_physical_release_on_contact(): Promise<void> {
  // 1. A hit and a miss.
  const owner = async (miss: boolean): Promise<string> => {
    const receiving: IAutoMoviePhysicalSimulationInput.IBody =
      physicalMovingPair(0.5);
    for (const [step, target] of receiving.targets.entries())
      target.dynamicSegments = step < 30 ? ["child"] : [];
    receiving.releaseOnContact = {
      earliest: 0.05,
      latest: 0.3,
      shapes: ["child-surface"],
      otherBody: "striker",
      otherShapes: ["surface"],
    };
    const striker: IAutoMoviePhysicalSimulationInput.IBody =
      PhysicalFixtures.body("striker", PhysicalFixtures.sphere(), 0.5);
    striker.mode = { kind: "kinematic" };
    for (const [step, target] of striker.targets.entries()) {
      const at: IAutoMovieRigidTransform["position"] =
        receiving.targets[step]!.segments.child!.position;
      target.segments.root!.position = {
        x: at.x,
        y: miss ? 3 : at.y,
        z: at.z - 0.4 + (2 * step) / 120,
      };
    }
    const scene: IAutoMoviePhysicalSimulationInput.IInput =
      PhysicalFixtures.input([receiving, striker], 0.5);
    scene.substeps = 8;
    const run: IAutoMoviePhysicalSimulation = await Simulation.compute(scene);
    return run.cache.ownershipAt(receiving.id, "root", 0.5);
  };
  TestValidator.equals(
    "only positive contact releases",
    [await owner(false), await owner(true)],
    ["dynamic", "authored"],
  );

  // 2. A blocked return.
  const ball: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
    "returning",
    PhysicalFixtures.sphere(),
    0.6,
  );
  for (const [step, target] of ball.targets.entries()) {
    target.dynamicSegments = step <= 24 ? ["root"] : [];
    target.segments.root!.position.x = (2 * step) / 120;
  }
  const obstacle: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalFixtures.body("obstacle", PhysicalFixtures.sphere(), 0.6);
  obstacle.mode = { kind: "kinematic" };
  for (const target of obstacle.targets)
    target.segments.root!.position.x = 0.55;
  const blocked: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([ball, obstacle], 0.6);
  blocked.substeps = 8;
  blocked.impulses.push({
    step: 10,
    body: ball.id,
    bone: "root",
    impulse: { x: -2, y: 0, z: 0 },
    point: { x: 0.15, y: 1, z: 0 },
  });
  let refused: boolean = false;
  try {
    await Simulation.compute(blocked);
  } catch (error: unknown) {
    refused =
      error instanceof Error &&
      error.message.includes("Physical return intersects receiver");
  }
  TestValidator.predicate("a blocked return is refused", refused);
}
