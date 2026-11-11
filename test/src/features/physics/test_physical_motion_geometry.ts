import {
  AutoMovieMotionAudit as Audit,
  type AutoMoviePhysicsCache as Cache,
} from "@automovie/engine";
import type { IAutoMovieMotionGeometry as Geometry } from "@automovie/interface";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Disconnected carriers audit without invented native masses or joints.
 *
 * Scenarios:
 * 1. Two independent collision carriers and an observation-only origin satisfy an analytic distance promise.
 * 2. Duplicate frames, missing materials/joint carriers, invalid transforms and nonfinite observations refuse.
 * 3. Physical and geometric descriptions are exclusive; native profile validation remains mandatory on the physical path.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMovieMotionAudit`, `AutoMoviePhysicsCache` on in-memory inputs and asserts the returned observations through no assertion call; 3 numbered scenarios (first: Two independent collision carriers and an observation-only origin satisfy an analytic distance promise.; last: Physical and geometric descriptions are exclusive; native profile validation remains mandatory on the...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Two independent collision carriers and an observation-only origin satisfy an analytic distance promise.; last: Physical and geometric descriptions are exclusive; native profile validation remains mandatory on the...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_motion_geometry`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Two independent collision carriers and an observation-only origin satisfy an analytic distance promise.).
 */
export async function test_physical_motion_geometry(): Promise<void> {
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
  const state: (x: number) => Cache.ISegment = (x: number): Cache.ISegment => ({
    position: { x, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
  });
  const input: Audit.IInput = {
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
    sample: (): Cache.IFrame => ({
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
      value.segments[0]!.shapes[0]!.transform.position.x = 1e100;
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
        } as Audit.IBody,
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
      sample: (): Cache.IFrame => ({
        seconds: 0,
        bodies: { observed: { first: state(1), second: state(2) } },
      }),
    }),
    /sampled state/,
  );
  await assert.rejects(
    Audit.run({
      ...input,
      sample: (): Cache.IFrame => ({
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
