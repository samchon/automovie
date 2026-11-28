import { AutoMovieEngineXpbdCollider, AutoMovieEngineXpbdWorld, AutoMovieEnginePhysicalSimulation as Simulation, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../internal/PhysicalFixtures";

/** Twelve fixed steps. */
const DURATION: number = 0.1;

/**
 * Declared overlapping pivot neighbours exert no spurious self-contact impulse.
 *
 * Scenarios:
 *
 * 1. Two nonadjacent overlapping spheres on free hinges remain at zero-load rest
 *    when excluded.
 * 2. Removing only that exclusion produces an actual contact-driven displacement.
 * 3. A late external impulse resumes with the same exclusion and bit-identical
 *    frames.
 * 4. Real colliders exercise both argument orders of the world's pair filter,
 *    which serves contact response and sensor overlaps alike, and the public
 *    lookup reads a later mutable declaration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents exclusion of declared overlapping neighbors across response, sensor queries and checkpoint replay.
 * @evidence contracts/development/testing.md#behavioral-verification Steps equal overlapping spheres with and without exclusion, compares an impulse resume to continuous frames, and probes both collider orders and mutable declarations.
 * @evidence contracts/development/testing.md#independent-expectations An excluded unloaded fixture stays at rest, an admitted overlap supplies physical displacement, and resumed motion matches continuous frames bit for bit.
 */
export async function test_engine_physics_xpbd_collision_exclusions(): Promise<void> {
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
          position: AutoMovieEngineVector3.subtract(
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
    AutoMovieEngineVector3.length(
      AutoMovieEngineVector3.subtract(
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
 * Check the world's pair filter against explicit scope on real colliders, in
 * both argument orders. A collider the binding never created carries no
 * policy.
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

  const world: AutoMovieEngineXpbdWorld = new AutoMovieEngineXpbdWorld(input.gravity);
  const bound: ReturnType<typeof Simulation.bindWorld> = Simulation.bindWorld(
    world,
    input,
    false,
  );
  const filter: AutoMovieEngineXpbdWorld.Filter = AutoMovieEnginePhysics.preparePhysicalContactHooks(
    input,
    bound,
  );
  const first: AutoMovieEngineXpbdCollider = collider("rig", "root", baseShape.id);
  const missing: AutoMovieEngineXpbdCollider = new AutoMovieEngineXpbdCollider(
    Number.POSITIVE_INFINITY,
    first.body,
    baseShape,
    0,
    0,
    false,
  );
  const pairs: readonly IPairCase[] = [
    {
      label: "same segment, different shapes",
      a: first,
      b: collider("rig", "root", "second-root-shape"),
      veto: true,
    },
    {
      label: "direct joint neighbours",
      a: first,
      b: collider("rig", "carrier"),
      veto: true,
    },
    {
      label: "declared overlap",
      a: first,
      b: collider("rig", "tip"),
      veto: true,
    },
    {
      label: "undeclared self contact",
      a: collider("other", "root"),
      b: collider("other", "tip"),
      veto: false,
    },
    {
      label: "same segment name across bodies",
      a: first,
      b: collider("other", "root"),
      veto: false,
    },
    {
      label: "excluded names across bodies",
      a: first,
      b: collider("other", "tip"),
      veto: false,
    },
    {
      label: "floor collider",
      a: first,
      b: collider("floor", "floor"),
      veto: false,
    },
    { label: "unregistered collider", a: first, b: missing, veto: false },
  ];
  for (const { label, a, b, veto } of pairs)
    TestValidator.equals(label, [filter(a, b), filter(b, a)], [!veto, !veto]);

  const otherRoot: number = collider("other", "root").handle;
  const otherTip: number = collider("other", "tip").handle;
  TestValidator.equals(
    "the live public lookup keeps undeclared self contact",
    AutoMovieEnginePhysics.isPhysicalPairExcluded(input, bound, otherRoot, otherTip),
    false,
  );
  other.profile.collisionExclusions.push({
    a: "tip",
    b: "root",
    reason: "Explicit mutable caller declaration.",
  });
  TestValidator.equals(
    "the live public lookup observes mutable caller data",
    AutoMovieEnginePhysics.isPhysicalPairExcluded(input, bound, otherRoot, otherTip),
    true,
  );

  /** The world's collider for this known shape in the temporary binding. */
  function collider(
    id: string,
    bone: string,
    shape?: string,
  ): AutoMovieEngineXpbdCollider {
    for (const [key, side] of bound.colliders)
      if (
        side.body === id &&
        side.bone === bone &&
        (shape === undefined || side.shape === shape)
      )
        return world.colliders.find(
          (candidate: AutoMovieEngineXpbdCollider): boolean =>
            candidate.handle === key,
        )!;
    throw new Error(`Missing test collider ${id}/${bone}/${shape ?? ""}`);
  }
}

/** One filter case: two colliders and whether the filter must veto them. */
interface IPairCase {
  /** What the pair is. */
  label: string;

  /** The first collider. */
  a: AutoMovieEngineXpbdCollider;

  /** The second collider. */
  b: AutoMovieEngineXpbdCollider;

  /** Whether the pair must never touch. */
  veto: boolean;
}
