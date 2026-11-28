import { AutoMovieEnginePhysicalGeometry as Geometry, AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalPointBound as Bound,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../../internal/PhysicalFixtures";
import { PhysicalPointFixtures } from "../../internal/PhysicalPointFixtures";
import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * How far a projected joint angle may stand from its closed form, radians: the
 * projection's micrometre residual on a lever of order 0.1 m.
 */
const PROJECTED_ANGLE: number = 1e-5;

/**
 * Directional reference support follows arbitrary collider offsets and
 * rotation.
 *
 * Scenarios:
 *
 * 1. Moved external spheres produce independently predicted asin solutions.
 * 2. Same-body support follows a rotating shared ancestor in the actual fitter.
 * 3. Capsule endpoints and eight rotated/offset box corners independently predict
 *    support in both directions, for candidate and external references.
 * 4. Numeric-looking string identities remain valid; a missing shape selector
 *    refuses without mutating borrowed input.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains directional support in arbitrary reference frames and admission of exact shape identities.
 * @evidence contracts/development/testing.md#behavioral-verification Fits projected support against displaced external spheres and a moving same-body ancestor, queries capsule and box support and tries an absent selector.
 * @evidence contracts/development/testing.md#independent-expectations Sine inversion gives the expected hinge angles. Capsule endpoints and eight transformed box corners independently give support extrema in each direction.
 */
export async function test_engine_physics_physical_point_projection(): Promise<void> {
  const profile: P = PhysicalPointFixtures.profile();
  const receiver: P = PhysicalFixtures.sphere(0.01);
  const poses: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    profile.segments.map(
      (
        segment: IAutoMoviePhysicalSegment,
      ): [string, IAutoMovieRigidTransform] => [
        segment.bone,
        structuredClone(segment.neutral),
      ],
    ),
  );
  const geometry: IAutoMoviePreparePhysicalGeometry.IQueries = await Geometry.prepare();
  const base: Bound = {
    ...PhysicalPointFixtures.bound(),
    reference: { body: "123", bone: "root", shape: "surface" },
  };
  const fit: (bound: Bound, height: number) => ReturnType<typeof AutoMovieEnginePhysics.planPhysicalContactTargets> = (
    bound: Bound,
    height: number,
  ): ReturnType<typeof AutoMovieEnginePhysics.planPhysicalContactTargets> =>
    AutoMovieEnginePhysics.planPhysicalContactTargets({
      body: "assembly",
      profiles: { assembly: profile, "123": receiver },
      targets: poses,
      actual: {
        assembly: poses,
        "123": {
          root: {
            position: { x: 0, y: height, z: 0 },
            rotation: AutoMovieEngineQuaternion.identity(),
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
    const result: ReturnType<typeof AutoMovieEnginePhysics.planPhysicalContactTargets> = fit(base, height);
    const actual: number = Math.atan2(
      result.targets.source!.position.y - 1,
      result.targets.source!.position.x,
    );
    assert.ok(
      Math.abs(actual - Math.asin(height + 0.01 - 1)) < PROJECTED_ANGLE,
    );
    assert.ok(result.residuals[base.id]! < PhysicalTolerance.CONVERGED);
  }
  const own: Bound = {
    ...base,
    reference: { body: "assembly", bone: "reference", shape: "surface" },
  };
  const same: ReturnType<typeof AutoMovieEnginePhysics.planPhysicalContactTargets> = fit(own, 1);
  const angle: number = Math.atan2(
    same.targets.source!.position.y - 1,
    same.targets.source!.position.x,
  );
  assert.ok(
    Math.abs(angle - Math.PI / 4 - Math.asin(0.01 / Math.SQRT2)) <
      PROJECTED_ANGLE,
  );
  const axis: V = AutoMovieEngineVector3.normalize({ x: 1, y: 2, z: -1 });
  const pose: IAutoMovieRigidTransform = {
    position: { x: 0.4, y: 1.7, z: -0.2 },
    rotation: AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 31),
      AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 67),
    ),
  };
  const shapes: IAutoMoviePhysicalShape[] = [
    {
      id: "surface",
      material: "solid",
      kind: "capsule",
      radius: 0.07,
      halfLength: 0.3,
      transform: {
        position: { x: 0.2, y: -0.1, z: 0.05 },
        rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 23),
      },
    },
    {
      id: "surface",
      material: "solid",
      kind: "box",
      halfExtents: { x: 0.1, y: 0.3, z: 0.2 },
      transform: {
        position: { x: -0.2, y: 0.1, z: 0.05 },
        rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 41),
      },
    },
  ];
  for (const shape of shapes)
    for (const sign of [-1, 1]) {
      receiver.segments[0]!.shapes = [shape];
      const direction: V = AutoMovieEngineVector3.scale(axis, sign);
      const bound: Bound = { ...base, axis: direction };
      const before: string = JSON.stringify({
        profile,
        receiver,
        poses,
        bound,
        pose,
      });
      const center: V = AutoMovieEngineVector3.add(
        pose.position,
        AutoMovieEngineQuaternion.rotateVector(pose.rotation, shape.transform.position),
      );
      const rotation: IAutoMovieRigidTransform["rotation"] =
        AutoMovieEngineQuaternion.multiply(pose.rotation, shape.transform.rotation);
      const vertices: V[] =
        shape.kind === "capsule"
          ? [-1, 1].map(
              (end: number): V =>
                AutoMovieEngineVector3.add(
                  center,
                  AutoMovieEngineQuaternion.rotateVector(rotation, {
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
                    AutoMovieEngineVector3.add(
                      center,
                      AutoMovieEngineQuaternion.rotateVector(rotation, {
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
          ...vertices.map((point: V): number => AutoMovieEngineVector3.dot(point, direction)),
        ) + (shape.kind === "capsule" ? shape.radius : 0);
      const expected: number =
        AutoMovieEngineVector3.dot(poses.source!.position, direction) - support;
      assert.ok(
        Math.abs(
          AutoMovieEnginePhysics.physicalPointProjection(
            "assembly",
            { assembly: profile, "123": receiver },
            { "123": { root: pose } },
            bound,
            poses,
          ) - expected,
        ) < PhysicalTolerance.ROUNDING,
      );
      const candidateProfile: P = structuredClone(profile);
      candidateProfile.segments.find(
        (segment: IAutoMoviePhysicalSegment): boolean =>
          segment.bone === "reference",
      )!.shapes = [structuredClone(shape)];
      const candidate: Record<string, IAutoMovieRigidTransform> = {
        ...poses,
        reference: pose,
      };
      const ownBound: Bound = {
        ...bound,
        reference: { body: "assembly", bone: "reference", shape: "surface" },
      };
      assert.ok(
        Math.abs(
          AutoMovieEnginePhysics.physicalPointProjection(
            "assembly",
            { assembly: candidateProfile },
            { assembly: poses },
            ownBound,
            candidate,
          ) - expected,
        ) < PhysicalTolerance.ROUNDING,
      );
      assert.equal(
        JSON.stringify({ profile, receiver, poses, bound, pose }),
        before,
      );
    }
  const invalid: Bound[] = [
    { ...base, reference: { body: "123", bone: "root", shape: "missing" } },
  ];
  for (const bound of invalid)
    assert.throws(
      (): ReturnType<typeof AutoMovieEnginePhysics.planPhysicalContactTargets> => fit(bound, 1),
      /point relationship/,
    );
}
