import {
  preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
  physicalPointProjection,
  planPhysicalContactTargets as plan,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalPointBound as Bound,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalPointFixtures } from "../internal/PhysicalPointFixtures";

/** Directional reference support follows arbitrary collider offsets and rotation.
 *
 * Scenarios:
 * 1. Moved external spheres produce independently predicted asin solutions.
 * 2. Same-body support follows a rotating shared ancestor in the actual fitter.
 * 3. Capsule endpoints and eight rotated/offset box corners independently predict support in both directions, for candidate and external references.
 * 4. Numeric-looking string identities remain valid; coercion and ambiguous/missing selectors refuse without mutating borrowed input.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `physicalPointProjection` on in-memory inputs and asserts the returned observations through no assertion call; 4 numbered scenarios (first: Moved external spheres produce independently predicted asin solutions.; last: Numeric-looking string identities remain valid; coercion and ambiguous/missing selectors refuse without...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: Moved external spheres produce independently predicted asin solutions.; last: Numeric-looking string identities remain valid; coercion and ambiguous/missing selectors refuse without...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_point_shape_reference`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalPointFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Moved external spheres produce independently predicted asin solutions.).
 */
export async function test_physical_point_shape_reference(): Promise<void> {
  const profile: P = PhysicalPointFixtures.profile();
  const receiver: P = PhysicalFixtures.sphere(0.01);
  const poses: Record<string, P.ITransform> = Object.fromEntries(
    profile.segments.map((segment: P.ISegment): [string, P.ITransform] => [
      segment.bone,
      structuredClone(segment.neutral),
    ]),
  );
  const geometry: Geometry.IQueries = await Geometry();
  const base: Bound = {
    ...PhysicalPointFixtures.bound(),
    reference: { body: "123", bone: "root", shape: "surface" },
  };
  const fit: (bound: Bound, height: number) => ReturnType<typeof plan> = (
    bound: Bound,
    height: number,
  ): ReturnType<typeof plan> =>
    plan({
      body: "assembly",
      profiles: { assembly: profile, "123": receiver },
      targets: poses,
      actual: {
        assembly: poses,
        "123": {
          root: {
            position: { x: 0, y: height, z: 0 },
            rotation: Quaternion.identity(),
          },
        },
      },
      bindings: [],
      pointBounds: [bound],
      geometry,
      floor: -10,
    });
  // A translated sphere support is exactly height + radius along world Y.
  for (const height of [1.4, 1.6]) {
    const result: ReturnType<typeof plan> = fit(base, height);
    const actual: number = Math.atan2(
      result.targets.source!.position.y - 1,
      result.targets.source!.position.x,
    );
    assert.ok(Math.abs(actual - Math.asin(height + 0.01 - 1)) < 1e-5);
    assert.ok(result.residuals[base.id]! < 1e-6);
  }
  const own: Bound = {
    ...base,
    reference: { body: "assembly", bone: "reference", shape: "surface" },
  };
  const same: ReturnType<typeof plan> = fit(own, 1);
  const angle: number = Math.atan2(
    same.targets.source!.position.y - 1,
    same.targets.source!.position.x,
  );
  assert.ok(
    Math.abs(angle - Math.PI / 4 - Math.asin(0.01 / Math.SQRT2)) < 1e-5,
  );
  const axis: V = Vector3.normalize({ x: 1, y: 2, z: -1 });
  const pose: P.ITransform = {
    position: { x: 0.4, y: 1.7, z: -0.2 },
    rotation: Quaternion.multiply(
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 31),
      Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 67),
    ),
  };
  const shapes: P.IShape[] = [
    {
      id: "surface",
      material: "solid",
      kind: "capsule",
      radius: 0.07,
      halfLength: 0.3,
      transform: {
        position: { x: 0.2, y: -0.1, z: 0.05 },
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 23),
      },
    },
    {
      id: "surface",
      material: "solid",
      kind: "box",
      halfExtents: { x: 0.1, y: 0.3, z: 0.2 },
      transform: {
        position: { x: -0.2, y: 0.1, z: 0.05 },
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 41),
      },
    },
  ];
  for (const shape of shapes)
    for (const sign of [-1, 1]) {
      receiver.segments[0]!.shapes = [shape];
      const direction: V = Vector3.scale(axis, sign);
      const bound: Bound = { ...base, axis: direction };
      const before: string = JSON.stringify({
        profile,
        receiver,
        poses,
        bound,
        pose,
      });
      const center: V = Vector3.add(
        pose.position,
        Quaternion.rotateVector(pose.rotation, shape.transform.position),
      );
      const rotation: P.ITransform["rotation"] = Quaternion.multiply(
        pose.rotation,
        shape.transform.rotation,
      );
      const vertices: V[] =
        shape.kind === "capsule"
          ? [-1, 1].map(
              (end: number): V =>
                Vector3.add(
                  center,
                  Quaternion.rotateVector(rotation, {
                    x: 0,
                    y: end * shape.halfLength,
                    z: 0,
                  }),
                ),
            )
          : [-1, 1].flatMap((x: number): V[] =>
              [-1, 1].flatMap((y: number): V[] =>
                [-1, 1].map(
                  (z: number): V =>
                    Vector3.add(
                      center,
                      Quaternion.rotateVector(rotation, {
                        x: x * (shape.kind === "box" ? shape.halfExtents.x : 0),
                        y: y * (shape.kind === "box" ? shape.halfExtents.y : 0),
                        z: z * (shape.kind === "box" ? shape.halfExtents.z : 0),
                      }),
                    ),
                ),
              ),
            );
      const support: number =
        Math.max(
          ...vertices.map((point: V): number => Vector3.dot(point, direction)),
        ) + (shape.kind === "capsule" ? shape.radius : 0);
      const expected: number =
        Vector3.dot(poses.source!.position, direction) - support;
      assert.ok(
        Math.abs(
          physicalPointProjection(
            "assembly",
            { assembly: profile, "123": receiver },
            { "123": { root: pose } },
            bound,
            poses,
          ) - expected,
        ) < 1e-12,
      );
      const candidateProfile: P = structuredClone(profile);
      candidateProfile.segments.find(
        (segment: P.ISegment): boolean => segment.bone === "reference",
      )!.shapes = [structuredClone(shape)];
      const candidate: Record<string, P.ITransform> = {
        ...poses,
        reference: pose,
      };
      const ownBound: Bound = {
        ...bound,
        reference: { body: "assembly", bone: "reference", shape: "surface" },
      };
      assert.ok(
        Math.abs(
          physicalPointProjection(
            "assembly",
            { assembly: candidateProfile },
            { assembly: poses },
            ownBound,
            candidate,
          ) - expected,
        ) < 1e-12,
      );
      assert.equal(
        JSON.stringify({ profile, receiver, poses, bound, pose }),
        before,
      );
    }
  const invalid: Bound[] = [
    {
      ...base,
      reference: {
        body: 123,
        bone: "root",
        shape: "surface",
      } as unknown as Bound["reference"],
    },
    { ...base, reference: { body: "123", bone: "root", shape: "missing" } },
    {
      ...base,
      reference: {
        body: "123",
        bone: "root",
        shape: "surface",
        localPoint: { x: 0, y: 0, z: 0 },
      } as unknown as Bound["reference"],
    },
    {
      ...base,
      reference: { body: "123", bone: "root" } as unknown as Bound["reference"],
    },
  ];
  for (const bound of invalid)
    assert.throws(
      (): ReturnType<typeof plan> => fit(bound, 1),
      /point relationship/,
    );
}
