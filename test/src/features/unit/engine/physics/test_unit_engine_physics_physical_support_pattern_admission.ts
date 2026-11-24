import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type {
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieFootfallPattern as Pattern,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../../../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../../../internal/PhysicalSupportFixtures";

/**
 * Shared support-only and balance admission.
 *
 * Scenarios:
 *
 * 1. One stationary tracking support with minimumSupports=1 remains legal.
 * 2. Missing carriers, wrong witness carriers, disconnected chains and a
 *    misordered reach refuse.
 * 3. Empty explicit floor witnesses retain the documented shape fallback.
 */
export function test_unit_engine_physics_physical_support_pattern_admission(): void {
  const body: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalSupportFixtures.body(PhysicalModelFixtures.quadrupod(), 1 / 120);
  const pattern: Pattern = structuredClone(body.balance!.pattern);
  pattern.limbs = pattern.limbs.slice(0, 1);
  pattern.minimumSupports = 1;
  delete body.balance;
  body.supportTracking = {
    pattern,
    stiffness: 100,
    damping: 10,
    maximumForce: 100,
  };
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], 1 / 120);
  Simulation.identity(input);
  const mutations: ((limb: Pattern["limbs"][number]) => void)[] = [
    (limb: Pattern["limbs"][number]): void => {
      limb.contacts = ["missing"];
      limb.floorPoints = [
        { bone: "missing", localPoint: { x: 0, y: 0, z: 0 } },
      ];
    },
    (limb: Pattern["limbs"][number]): void => {
      limb.floorPoints = [
        { bone: "support-1", localPoint: { x: 0, y: 0, z: 0 } },
      ];
    },
    (limb: Pattern["limbs"][number]): void => {
      limb.chain = ["upper-1", "lower-0", "support-0"];
    },

    (limb: Pattern["limbs"][number]): void => {
      limb.reach = { root: "lower-0", middle: "upper-0", tip: "support-0" };
    },
  ];
  for (const mutate of mutations) {
    const invalid: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(input);
    mutate(invalid.bodies[0]!.supportTracking!.pattern.limbs[0]!);
    assert.throws((): string => Simulation.identity(invalid));
  }
  pattern.limbs[0]!.floorPoints = [];
  Simulation.identity(input);
}
