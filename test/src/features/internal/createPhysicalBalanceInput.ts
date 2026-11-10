import type { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { PhysicalFixtures } from "./PhysicalFixtures";
import { PhysicalSupportFixtures } from "./PhysicalSupportFixtures";

/** Own the unchanged matrix inputs so observations and assertions exercise the same policies, masses and perturbations. */
export function createPhysicalBalanceInput(
  profile: P,
  actuation: "world" | "internal",
  impulse: number,
  duration: number,
): Simulation.IInput {
  const body: Simulation.IBody = PhysicalSupportFixtures.body(
    profile,
    duration,
  );
  if (actuation === "internal") {
    body.actuation = "internal";
    body.compensateGravity = true;
    body.supportTracking = {
      pattern: body.balance!.pattern,
      stiffness: 100 * profile.mass,
      damping: 10 * profile.mass,
      maximumForce: 12 * profile.mass,
      iterations: 0,
    };
    for (const target of body.targets)
      target.supportStrength = Object.fromEntries(
        body.supportTracking.pattern.limbs.map(
          (
            limb: (typeof body.supportTracking.pattern.limbs)[number],
          ): [string, number] => [limb.bone, 1],
        ),
      );
  }
  const input: Simulation.IInput = PhysicalFixtures.input([body], duration);
  Object.assign(input, {
    gravity: { x: 0, y: -9.81, z: 0 },
    floor: 0,
    substeps: 32,
    iterations: 64,
    ...(actuation === "internal" ? { internalIterations: 4 } : {}),
  });
  // The configured perturbation can carry this freely falling body beyond a
  // default 20 m patch. Keep the finite domain guard and declare the episode's
  // impulse-derived travel envelope instead of misclassifying flight as failure.
  const reach: number = Math.max(
    20,
    (Math.abs(impulse) / profile.mass) * duration + 2,
  );
  input.floorBounds.min.x = -reach;
  input.floorBounds.max.x = reach;
  input.impulses.push({
    step: 120,
    body: profile.id,
    bone: profile.segments[0]!.bone,
    point: { ...profile.centerOfMass },
    impulse: { x: impulse, y: 0, z: 0 },
  });
  return input;
}
