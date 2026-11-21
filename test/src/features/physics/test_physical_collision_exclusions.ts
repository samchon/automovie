import {
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  bindPhysicalWorld,
  isPhysicalPairExcluded,
  preparePhysicalContactHooks,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import RAPIER, { type PhysicsHooks } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Twelve native steps. */
const DURATION: number = 0.1;

/** Declared overlapping pivot neighbours exert no spurious self-contact impulse.
 *
 * Scenarios:
 * 1. Two nonadjacent overlapping spheres on free hinges remain at zero-load rest when excluded.
 * 2. Removing only that exclusion produces an actual contact-driven displacement.
 * 3. A late external impulse resumes with the same exclusion and bit-identical frames.
 * 4. Real collider handles exercise both orders in the contact and sensor masks, and the public lookup reads a later mutable declaration.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Native simulation observes the explicit exclusion, resulting displacement when allowed and exact states after prefix restoration. A real temporary binding exercises both returned hook masks using controlled collider identities.
 * @evidence contracts/development/testing.md#independent-expectations The declared profile adjacency, exclusion and ownership rules give explicit expected masks for both orders; none of those expectations call the old Engine helper. Rest drift and stimulated displacement have independent numeric bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers same-bone shapes, adjacent, declared and undeclared pairs, matching names across two bodies, floor, absent handles, actual handle zero and a later declaration observed by the unprepared caller.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_collision_exclusions`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the overlap, late-edit and callback cases and the expected native isolation.
 */
export async function test_physical_collision_exclusions(): Promise<void> {
  const profile: P = PhysicalFixtures.sphere();
  const root: IAutoMoviePhysicalSegment = profile.segments[0]!;
  const carrier: IAutoMoviePhysicalSegment = structuredClone(root);
  carrier.bone = "carrier";
  carrier.neutral.position = { x: 0, y: 1.2, z: 0 };
  const tip: IAutoMoviePhysicalSegment = structuredClone(root);
  tip.bone = "tip";
  tip.neutral.position = { x: 0.05, y: 1.05, z: 0 };
  profile.segments.push(carrier, tip);
  profile.mass = 3;
  profile.centerOfMass = { x: 0.05 / 3, y: 3.25 / 3, z: 0 };
  profile.joints = [carrier, tip].map(
    (
      segment: IAutoMoviePhysicalSegment,
      index: number,
    ): IAutoMoviePhysicalJoint => {
      const parent: IAutoMoviePhysicalSegment = index === 0 ? root : carrier;
      return {
        id: segment.bone,
        parent: parent.bone,
        child: segment.bone,
        parentFrame: {
          position: Vector3.subtract(
            segment.neutral.position,
            parent.neutral.position,
          ),
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        childFrame: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        axes: [
          {
            axis: "z",
            minimum: -Math.PI,
            maximum: Math.PI,
            stiffness: 0,
            damping: 0,
            maximumTorque: 1,
            channel: "hinge",
          },
        ],
      };
    },
  );
  profile.collisionExclusions = [
    {
      a: "root",
      b: "tip",
      reason: "Fixture's intentionally overlapping pivot solids.",
    },
  ];
  // Twelve steps: an admitted overlap separates within a few steps, and a
  // checkpoint every four steps gives the late impulse a restored world.
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input(
      [PhysicalFixtures.body("rig", profile, DURATION)],
      DURATION,
    );
  input.checkpointEvery = 4;
  const excluded: IAutoMoviePhysicalSimulation =
    await Simulation.compute(input);
  verifyHookScope(excluded.input);
  const includedInput: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  includedInput.bodies[0]!.profile.collisionExclusions = [];
  const included: IAutoMoviePhysicalSimulation =
    await Simulation.compute(includedInput);
  const drift: (run: IAutoMoviePhysicalSimulation) => number = (
    run: IAutoMoviePhysicalSimulation,
  ): number =>
    Vector3.length(
      Vector3.subtract(
        run.cache.at(DURATION).bodies.rig!.tip!.position,
        tip.neutral.position,
      ),
    );
  TestValidator.predicate(
    "excluded overlaps preserve zero-load rest",
    drift(excluded) < 0.0001,
  );
  TestValidator.predicate(
    "admitted overlap delivers a physical displacement",
    drift(included) > 0.005,
  );
  const edited: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  edited.impulses.push({
    step: 9,
    body: "rig",
    bone: "tip",
    point: tip.neutral.position,
    impulse: { x: 0.1, y: 0, z: 0 },
  });
  const resumed: IAutoMoviePhysicalSimulation = await Simulation.compute(
    edited,
    excluded,
  );
  const fresh: IAutoMoviePhysicalSimulation = await Simulation.compute(edited);
  const firstDifference: number = resumed.cache.frames.findIndex(
    (frame: IAutoMoviePhysicalFrame, index: number): boolean =>
      JSON.stringify(frame) !== JSON.stringify(fresh.cache.frames[index]),
  );
  TestValidator.predicate(
    `restored exclusions preserve exact dynamics; first divergent frame ${firstDifference}`,
    firstDifference === -1,
  );
}

/**
 * Check contact and sensor callback values against explicit scope on actual
 * handles, including zero. Synthetic non-collider arguments carry no policy.
 */
function verifyHookScope(
  admitted: IAutoMoviePhysicalSimulationInput.IInput,
): void {
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(admitted);
  const original: IAutoMoviePhysicalSimulationInput.IBody = input.bodies[0]!;
  const root: IAutoMoviePhysicalSegment = original.profile.segments[0]!;
  const baseShape: IAutoMoviePhysicalSegment["shapes"][number] =
    root.shapes[0]!;
  root.shapes.push({ ...structuredClone(baseShape), id: "second-root-shape" });
  const other: IAutoMoviePhysicalSimulationInput.IBody =
    structuredClone(original);
  other.id = "other";
  other.profile.collisionExclusions = [];
  input.bodies.push(other);

  const world: RAPIER.World = new RAPIER.World(input.gravity);
  try {
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      world,
      input,
      false,
    );
    const hooks: PhysicsHooks = preparePhysicalContactHooks(input, bound);
    const first: number = handle("rig", "root", baseShape.id);
    TestValidator.equals("the native first collider handle is zero", first, 0);
    const missing: number = Number.POSITIVE_INFINITY;
    const pairs: readonly [string, number, number, boolean][] = [
      [
        "same segment, different shapes",
        first,
        handle("rig", "root", "second-root-shape"),
        true,
      ],
      ["direct joint neighbours", first, handle("rig", "carrier"), true],
      ["declared overlap", first, handle("rig", "tip"), true],
      [
        "undeclared self contact",
        handle("other", "root"),
        handle("other", "tip"),
        false,
      ],
      [
        "same segment name across bodies",
        first,
        handle("other", "root"),
        false,
      ],
      ["excluded names across bodies", first, handle("other", "tip"), false],
      ["floor collider", first, handle("floor", "floor"), false],
      ["unregistered collider", first, missing, false],
    ];
    for (const [label, a, b, veto] of pairs) {
      const contact: RAPIER.SolverFlags | null = veto
        ? null
        : RAPIER.SolverFlags.COMPUTE_IMPULSE;
      TestValidator.equals(
        label,
        [
          hooks.filterContactPair(a, b, missing, missing),
          hooks.filterContactPair(b, a, missing, missing),
          hooks.filterIntersectionPair(a, b, missing, missing),
          hooks.filterIntersectionPair(b, a, missing, missing),
        ],
        [contact, contact, !veto, !veto],
      );
    }

    const otherRoot: number = handle("other", "root");
    const otherTip: number = handle("other", "tip");
    TestValidator.equals(
      "the live public lookup keeps undeclared self contact",
      isPhysicalPairExcluded(input, bound, otherRoot, otherTip),
      false,
    );
    other.profile.collisionExclusions.push({
      a: "tip",
      b: "root",
      reason: "Explicit mutable caller declaration.",
    });
    TestValidator.equals(
      "the live public lookup observes mutable caller data",
      isPhysicalPairExcluded(input, bound, otherRoot, otherTip),
      true,
    );

    /** Actual Rapier handle for this known shape in the temporary binding. */
    function handle(id: string, bone: string, shape?: string): number {
      for (const [key, side] of bound.colliders)
        if (
          side.body === id &&
          side.bone === bone &&
          (shape === undefined || side.shape === shape)
        )
          return key;
      throw new Error(`Missing test collider ${id}/${bone}/${shape ?? ""}`);
    }
  } finally {
    world.free();
  }
}
