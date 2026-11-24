import {
  AutoMovieMotionAudit as Audit,
  measurePhysicalMotionConstraint as measure,
} from "@automovie/engine";
import type {
  IAutoMovieMotionGeometry as Geometry,
  IAutoMovieMeasurePhysicalMotionConstraint,
  IAutoMovieMotionAudit,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSegmentState,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../../../../features/internal/PhysicalFixtures";

/**
 * Physical constraints measure explicit world witnesses and inspect only declared geometry.
 *
 * Scenarios:
 * - A free witness may measure a disconnected carrier. Malformed segment identifiers, shapes, joints and sampled states are rejected.
 * - A rigid local point and a point on a ray have independent analytic positions. Orthogonal and straight three-point chains produce different bends.
 * - One sampled frame reports simultaneous target, distance and angle violations.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public constraint measure and numerical auditor directly on one instantaneous frame.
 * @evidence contracts/development/testing.md#independent-expectations Positions follow a quarter turn or projection along a unit ray. Angle expectations are zero or a right angle from the assigned point coordinates.
 * @evidence contracts/development/testing.md#distinguishing-cases Observed and missing witnesses, valid and malformed carriers, endpoint and angular metrics and aggregated findings.
 * @evidence contracts/development/testing.md#execution-ownership All frames are analytic. No generated performance or motion clip is required.
 * @evidence contracts/development/common.md#meaningful-documentation Names the independent constraints and observation rules.
 */
export async function test_motion_audit_physical_audit_witnesses(): Promise<void> {
  const geometry: Geometry = {
    segments: ["first", "second"].map(
      (bone: string): Geometry["segments"][number] => ({
        bone,
        shapes: structuredClone(
          PhysicalFixtures.sphere(0.1).segments[0]!.shapes,
        ),
      }),
    ),
    materials: PhysicalFixtures.sphere().materials,
    joints: [],
    witnesses: ["observed-origin"],
  };
  const state: (x: number) => IAutoMoviePhysicalSegmentState = (
    x: number,
  ): IAutoMoviePhysicalSegmentState => ({
    position: { x, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
  });
  const input: IAutoMovieMotionAudit.IInput = {
    bodies: [
      {
        id: "observed",
        geometry,
        speeds: {},
        supports: [],
        floorTolerance: 0,
        overlapTolerance: 0,
        jointTolerance: 0,
        constraints: [
          {
            kind: "distance",
            label: "observed spread",
            start: 0,
            end: 0,
            from: { bone: "observed-origin" },
            to: { bone: "second" },
            minimum: 2,
            maximum: 2,
          },
        ],
      },
    ],
    start: 0,
    end: 0,
    rate: 120,
    floor: 0,
    sample: (): IAutoMoviePhysicalFrame => ({
      seconds: 0,
      bodies: {
        observed: {
          first: state(1),
          second: state(2),
          "observed-origin": state(0),
        },
      },
    }),
    allowed: (): boolean => false,
  };
  assert.deepEqual((await Audit.run(input)).findings, []);
  const states = input.sample(0).bodies.observed!;
  const root = states.first!,
    hand = states.second!,
    pivot = states["observed-origin"]!;
  const chain = { root, hand, pivot };
  const goal: IAutoMovieMeasurePhysicalMotionConstraint.IConstraint = {
    kind: "goal",
    label: "ray",
    start: 0,
    end: 0,
    point: { bone: "hand", ray: { from: "root", distance: 0.065 } },
    target: () => ({ x: 2.065, y: 1, z: 0 }),
    maximum: 0.001,
  };
  assert.ok(measure(goal, chain, 0) < 1e-12);
  const turned = {
    ...root,
    rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
  };
  assert.ok(
    measure(
      {
        ...goal,
        point: { bone: "root", localPoint: { x: 1, y: 0, z: 0 } },
        target: () => ({ x: 1, y: 2, z: 0 }),
      },
      { ...chain, root: turned },
      0,
    ) < 1e-12,
  );
  const angle: IAutoMovieMeasurePhysicalMotionConstraint.IConstraint = {
    kind: "angle",
    label: "three points",
    from: { bone: "root" },
    pivot: { bone: "pivot" },
    to: { bone: "hand" },
    start: 0,
    end: 0,
    minimum: 3,
  };
  assert.ok(
    Math.abs(
      measure(
        angle,
        { ...chain, hand: { ...hand, position: { x: 0, y: 2, z: 0 } } },
        0,
      ) -
        Math.PI / 2,
    ) < 1e-12,
  );
  assert.ok(measure(angle, { ...chain, hand: state(-1) }, 0) < 1e-12);
  const measured = await Audit.run({
    ...input,
    bodies: [
      {
        ...input.bodies[0]!,
        constraints: [
          {
            ...goal,
            point: { bone: "first" },
            target: () => ({ x: 1.01, y: 1, z: 0 }),
          },
          {
            kind: "distance",
            label: "separation",
            from: { bone: "first" },
            to: { bone: "second" },
            start: 0,
            end: 0,
            maximum: 0.5,
          },
          {
            ...angle,
            from: { bone: "observed-origin" },
            pivot: { bone: "first" },
            to: { bone: "second" },
          },
        ],
      },
    ],
  });
  assert.deepEqual(
    measured.findings.map((f) => f.kind),
    ["goal", "distance", "angle"],
  );
  const before: string = JSON.stringify(geometry);
  const mutations: ((value: Geometry) => void)[] = [
    (value: Geometry): void => {
      value.witnesses = ["first"];
    },
    (value: Geometry): void => {
      value.witnesses = ["same", "same"];
    },
    (value: Geometry): void => {
      value.segments[1]!.bone = "first";
    },
    (value: Geometry): void => {
      value.segments[0]!.shapes[0]!.material = "missing";
    },
    (value: Geometry): void => {
      value.segments[0]!.shapes[0]!.transform.rotation.w = 2;
    },
    (value: Geometry): void => {
      value.segments[0]!.shapes[0]!.transform.position.x = Infinity;
    },
    (value: Geometry): void => {
      value.segments[0]!.shapes.push(
        structuredClone(value.segments[0]!.shapes[0]!),
      );
    },
    (value: Geometry): void => {
      value.joints = [
        {
          id: "joint",
          parent: "first",
          child: "missing",
          parentFrame: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
          childFrame: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
          axes: [],
        },
      ];
    },
  ];
  for (const mutate of mutations) {
    const changed: Geometry = structuredClone(geometry);
    mutate(changed);
    await assert.rejects(
      Audit.run({
        ...input,
        bodies: [
          { ...input.bodies[0]!, geometry: changed, profile: undefined },
        ],
      }),
      /geometry/,
    );
  }
  await assert.rejects(
    Audit.run({
      ...input,
      bodies: [
        {
          ...input.bodies[0]!,
          profile: PhysicalFixtures.sphere(),
        } as IAutoMovieMotionAudit.IBody,
      ],
    }),
    /body/,
  );
  const invalidProfile: ReturnType<typeof PhysicalFixtures.sphere> =
    PhysicalFixtures.sphere();
  invalidProfile.mass = 0;
  await assert.rejects(
    Audit.run({
      ...input,
      bodies: [
        { ...input.bodies[0]!, profile: invalidProfile, geometry: undefined },
      ],
    }),
    /body/,
  );
  await assert.rejects(
    Audit.run({
      ...input,
      sample: (): IAutoMoviePhysicalFrame => ({
        seconds: 0,
        bodies: { observed: { first: state(1), second: state(2) } },
      }),
    }),
    /sampled state/,
  );
  await assert.rejects(
    Audit.run({
      ...input,
      sample: (): IAutoMoviePhysicalFrame => ({
        seconds: 0,
        bodies: {
          observed: {
            first: state(1),
            second: state(2),
            "observed-origin": state(NaN),
          },
        },
      }),
    }),
    /sampled state/,
  );
  assert.equal(JSON.stringify(geometry), before);
}
