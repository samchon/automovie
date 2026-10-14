import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/**
 * Construct the existing two-particle wearable domain without running its solver.
 *
 * The authored .125-second clock, zero gravity/drag/stiffness and literal rest/mass values remain the test's input premises, not generated expectations.
 *
 * The bound shoulder anchor and torso capsule retain their ids, geometry and mutable records for the original nine scenarios.
 *
 * Each call transfers fresh domain records to its caller and acquires no file, actor host, solver result cache or foreign resource.
 */
export function wearableSoftBodyTestDomain(): IAutoMovieSoftBodyDomain {
  return {
    version: 1,
    id: "cape",
    units: "meter",
    lattice: { columns: 1, rows: 2 },
    solver: {
      fixedStepSeconds: 0.125,
      gravity: { x: 0, y: 0, z: 0 },
      drag: 0,
      iterations: 1,
      stiffness: { structural: 0, shear: 0, bend: 0 },
      referenceSpeed: 1,
      maxSteps: 4,
    },
    rest: [0, 1, 0, 0, 0.5, 0],
    mass: [1, 1],
    anchors: [
      {
        id: "shoulder",
        particle: 0,
        position: null,
        binding: {
          kind: "actor-bone",
          actor: "actor",
          bone: "leftShoulder",
          offset: { x: 0, y: 0, z: 0 },
        },
      },
    ],
    states: [],
    colliders: [
      {
        kind: "body-capsule",
        id: "torso",
        actor: "actor",
        capsule: { from: "hips", to: "head", radius: 0.25 },
      },
    ],
    wind: null,
    selfCollision: false,
  };
}
