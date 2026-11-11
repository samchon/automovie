import {
  preparePhysicalGeometry as Geometry,
  AutoMoviePhysicalSimulation as Simulation,
  planPhysicalContactTargets,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/**
 * Explicit relationship budgets bound the actual simultaneous geometry consumer.
 *
 * Scenarios:
 * 1. The default 16 cap refuses 17 relationships; an explicit 17 cap admits them through the shared fitter and a real actuated one-joint branch.
 * 2. Zero, fractional, nonfinite and over 256 declarations refuse; 256 relationships admit and 257 refuse.
 * 3. Independently counted floor/self/contact rows admit 1024 and refuse 1025 before native allocation.
 * 4. A 65-leaf analytic star admits 64 active coordinates, refuses 65 and ignores a zero-weight collider relationship.
 * 5. One point bound on the remaining leaf combines with 64 collider chains to exceed the same coordinate budget; removing it restores admission.
 * 6. Twenty-four independent joints declare 72 axes but admit 48 or 64 active coordinates; 65 active coordinates refuse while 25 floor and 276 self-pair rows stay below their separate budget.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalSimulation`, `planPhysicalContactTargets`, `preparePhysicalGeometry` on in-memory inputs and asserts the returned observations through no assertion call; 6 numbered scenarios (first: The default 16 cap refuses 17 relationships; an explicit 17 cap admits them through the shared fitter and a...; last: Twenty-four independent joints declare 72 axes but admit 48 or 64 active coordinates; 65 active coordinates...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 6 numbered scenarios (first: The default 16 cap refuses 17 relationships; an explicit 17 cap admits them through the shared fitter and a...; last: Twenty-four independent joints declare 72 axes but admit 48 or 64 active coordinates; 65 active coordinates...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_binding_budget`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The default 16 cap refuses 17 relationships; an explicit 17 cap admits them through the shared fitter and a real actuated one-joint branch.).
 */
export async function test_physical_binding_budget(): Promise<void> {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const receiver: P = PhysicalFixtures.sphere();
  const geometry: Geometry.IQueries = await Geometry();
  /** Independent separation rows exercise the real variable-row consumer without introducing a body-name rule. */
  const bindings: (
    count: number,
    kind?: Binding["kind"],
    own?: P,
  ) => Binding[] = (
    count: number,
    kind: Binding["kind"] = "separate",
    own: P = profile,
  ): Binding[] =>
    Array.from(
      { length: count },
      (_: unknown, index: number): Binding => ({
        id: `relationship-${index}`,
        kind,
        chain: ["upper-0"],
        source: {
          bone: "upper-0",
          shape: own.segments.find(
            (segment: P.ISegment): boolean => segment.bone === "upper-0",
          )!.shapes[0]!.id,
        },
        target: { body: "receiver", bone: "root", shape: "surface" },
        weight: 1,
        compression: 0,
        iterations: 1,
        tolerance: 0.0001,
      }),
    );
  const input: Simulation.IInput = PhysicalFixtures.input(
    [
      PhysicalFixtures.body("assembly", profile, 1 / 120),
      PhysicalFixtures.body("receiver", receiver, 1 / 120),
    ],
    1 / 120,
  );
  const source: Simulation.IBody = input.bodies[0]!;
  source.targets[0]!.bindings = bindings(17);
  assert.throws((): string => Simulation.identity(input), /budget/);
  source.maximumBindings = 17;
  Simulation.identity(input);
  const fitted: ReturnType<typeof planPhysicalContactTargets> =
    planPhysicalContactTargets({
      body: source.id,
      profiles: { assembly: profile, receiver },
      targets: source.targets[0]!.segments,
      actual: {
        assembly: source.targets[0]!.segments,
        receiver: input.bodies[1]!.targets[0]!.segments,
      },
      bindings: source.targets[0]!.bindings,
      geometry,
      floor: -10,
    });
  assert.equal(Object.keys(fitted.residuals).length, 17);
  assert.ok(
    Object.values(fitted.residuals).every(
      (value: number): boolean => value === 0,
    ),
  );
  for (const invalid of [0, 257, 1.5, NaN, Infinity]) {
    source.maximumBindings = invalid;
    assert.throws((): string => Simulation.identity(input), /budget/);
  }
  source.maximumBindings = 256;
  source.targets[0]!.bindings = bindings(256);
  Simulation.identity(input);
  source.targets[0]!.bindings = bindings(257);
  assert.throws((): string => Simulation.identity(input), /budget/);
  const compound: P = structuredClone(profile);
  for (const segment of compound.segments)
    segment.shapes = Array.from(
      { length: 3 },
      (_: unknown, index: number): P.IShape => ({
        ...structuredClone(segment.shapes[0]!),
        id: `${segment.shapes[0]!.id}-${index}`,
      }),
    );
  const bounded: Simulation.IInput = PhysicalFixtures.input(
    [
      PhysicalFixtures.body("assembly", compound, 1 / 120),
      PhysicalFixtures.body("receiver", receiver, 1 / 120),
    ],
    1 / 120,
  );
  const body: Simulation.IBody = bounded.bodies[0]!;
  body.selfAvoidance = { iterations: 1, tolerance: 0.0001 };
  body.maximumBindings = 256;
  // 39 floor rows + 594 enabled shape-pair rows + 130*3 contact rows + one separation =1024.
  body.targets[0]!.bindings = [
    ...bindings(130, "contact", compound),
    { ...bindings(1, "separate", compound)[0]!, id: "last-separation" },
  ];
  Simulation.identity(bounded);
  body.targets[0]!.bindings.push({
    ...bindings(1, "separate", compound)[0]!,
    id: "over-residual-budget",
  });
  assert.throws((): string => Simulation.identity(bounded), /budget/);
  const root: P.ISegment = structuredClone(
    PhysicalFixtures.sphere(0.01).segments[0]!,
  );
  const leaves: P.ISegment[] = Array.from(
    { length: 65 },
    (_: unknown, index: number): P.ISegment => {
      const segment: P.ISegment = structuredClone(root);
      segment.bone = `leaf-${index}`;
      const angle: number = (2 * Math.PI * index) / 65;
      segment.neutral.position = {
        x: 2 * Math.cos(angle),
        y: 1,
        z: 2 * Math.sin(angle),
      };
      return segment;
    },
  );
  const star: P = {
    id: "one-axis-star",
    mass: 66,
    centerOfMass: {
      x:
        leaves.reduce(
          (sum: number, segment: P.ISegment): number =>
            sum + segment.neutral.position.x,
          0,
        ) / 66,
      y: 1,
      z:
        leaves.reduce(
          (sum: number, segment: P.ISegment): number =>
            sum + segment.neutral.position.z,
          0,
        ) / 66,
    },
    provenance:
      "One root and 65 disjoint unit-mass spheres on independent one-axis joints; coordinate admission fixture",
    materials: structuredClone(receiver.materials),
    segments: [root, ...leaves],
    joints: leaves.map(
      (segment: P.ISegment): P.IJoint => ({
        id: segment.bone,
        parent: root.bone,
        child: segment.bone,
        parentFrame: {
          position: {
            x: segment.neutral.position.x,
            y: 0,
            z: segment.neutral.position.z,
          },
          rotation: root.neutral.rotation,
        },
        childFrame: {
          position: { x: 0, y: 0, z: 0 },
          rotation: root.neutral.rotation,
        },
        axes: [
          {
            axis: "x",
            minimum: -1,
            maximum: 1,
            stiffness: 1,
            damping: 0.1,
            maximumTorque: 1,
            channel: `${segment.bone}.hinge`,
          },
        ],
      }),
    ),
  };
  const coordinates: Simulation.IInput = PhysicalFixtures.input(
    [
      PhysicalFixtures.body("star", star, 1 / 120),
      PhysicalFixtures.body("receiver", receiver, 1 / 120),
    ],
    1 / 120,
  );
  const selected: Simulation.IBody = coordinates.bodies[0]!;
  selected.maximumBindings = 65;
  const independent: Binding[] = leaves.map(
    (segment: P.ISegment, index: number): Binding => ({
      id: `independent-${index}`,
      kind: "separate",
      chain: [segment.bone],
      source: { bone: segment.bone, shape: segment.shapes[0]!.id },
      target: { body: "receiver", bone: "root", shape: "surface" },
      weight: 1,
      compression: 0,
      iterations: 1,
      tolerance: 0.0001,
    }),
  );
  selected.targets[0]!.bindings = independent.slice(0, 64);
  Simulation.identity(coordinates);
  selected.targets[0]!.bindings = independent;
  assert.throws(
    (): string => Simulation.identity(coordinates),
    /coordinate budget/,
  );
  selected.targets[0]!.bindings[64]!.weight = 0;
  Simulation.identity(coordinates);
  selected.maximumBindings = 256;
  selected.targets[0]!.bindings = independent.slice(0, 64);
  Simulation.identity(coordinates);
  selected.targets[0]!.pointBounds = [
    {
      id: "independent-point-65",
      chain: [leaves[64]!.bone],
      source: { bone: leaves[64]!.bone, localPoint: { x: 0, y: 0.01, z: 0 } },
      reference: {
        body: "receiver",
        bone: "root",
        localPoint: { x: 0, y: 0, z: 0 },
      },
      axis: { x: 0, y: 0, z: 1 },
      minimum: 0,
      iterations: 1,
      tolerance: 0.0001,
    },
  ];
  assert.throws(
    (): string => Simulation.identity(coordinates),
    /coordinate budget/,
  );
  selected.targets[0]!.pointBounds = [];
  Simulation.identity(coordinates);
  for (const active of [48, 64, 65]) {
    const branches: P.ISegment[] = structuredClone(leaves.slice(0, 24));
    const compact: P = {
      ...structuredClone(star),
      id: `locked-axis-star-${active}`,
      provenance:
        "One root and 24 disjoint unit-mass spheres, with 72 declared joint axes and an independently selected active-coordinate population",
      mass: 25,
      centerOfMass: {
        x:
          branches.reduce(
            (sum: number, segment: P.ISegment): number =>
              sum + segment.neutral.position.x,
            0,
          ) / 25,
        y: 1,
        z:
          branches.reduce(
            (sum: number, segment: P.ISegment): number =>
              sum + segment.neutral.position.z,
            0,
          ) / 25,
      },
      segments: [structuredClone(root), ...branches],
      joints: star.joints.slice(0, 24).map(
        (joint: P.IJoint, index: number): P.IJoint => ({
          ...structuredClone(joint),
          axes: (["x", "y", "z"] as const).map(
            (axis: P.IAxis["axis"], coordinate: number): P.IAxis => ({
              ...joint.axes[0]!,
              axis,
              minimum: index * 3 + coordinate < active ? -1 : 0,
              maximum: index * 3 + coordinate < active ? 1 : 0,
              channel: `${joint.id}.${axis}`,
            }),
          ),
        }),
      ),
    };
    const admitted: Simulation.IInput = PhysicalFixtures.input(
      [PhysicalFixtures.body("locked-star", compact, 1 / 120)],
      1 / 120,
    );
    admitted.bodies[0]!.selfAvoidance = { iterations: 1, tolerance: 0.0001 };

    // Adjacent root/leaf pairs are excluded: 25 floor rows + 24*23/2 self rows = 301.
    if (active <= 64) Simulation.identity(admitted);
    else assert.throws((): string => Simulation.identity(admitted), /budget/);
  }
}
