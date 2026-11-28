import {
  AutoMovieEnginePhysicalGeometry as Geometry,
  AutoMovieEngineQuaternion,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../../internal/PhysicalFixtures";
import { PhysicalTolerance } from "../../internal/PhysicalTolerance";
import { nclose } from "../../internal/nclose";

/**
 * How far a native contact separation may stand from its closed form, metres:
 * the native query's own convergence, which stops at about 1e-7.
 */
const NATIVE_DISTANCE: number = 1e-7;

/**
 * The engine's exact convex queries find touching at zero distance without
 * changing the caller's accepted distance.
 *
 * Scenarios:
 *
 * 1. The original decimal-radius sphere tangent is returned with zero native
 *    distance at default and tiny explicit prediction.
 * 2. Offset/rotated sphere, capsule and box boundaries preserve native witnesses
 *    and null impulse.
 * 3. A representable positive gap stays absent at default and is admitted only by
 *    an explicit sufficient prediction.
 * 4. Query inputs remain unchanged, and a negative prediction is refused rather
 *    than measured.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies exact convex tangency, explicit separated-pair prediction, native witnesses and invalid prediction refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Queries direct and transformed sphere, capsule and box placements at zero distance and a representable gap, and submits a negative prediction.
 * @evidence contracts/development/testing.md#independent-expectations True tangency has native distance zero. Positive gap is absent by default and admitted only with sufficient explicit prediction, keeping its positive distance and geometric impulse null.
 */
export async function test_engine_physics_prepare_physical_geometry_boundary(): Promise<void> {
  const geometry: IAutoMoviePreparePhysicalGeometry.IQueries = await Geometry.prepare();
  const sphere: IAutoMoviePhysicalShape =
    PhysicalFixtures.sphere().segments[0]!.shapes[0]!;
  const make: (
    shape: IAutoMoviePhysicalShape,
    x: number,
    rotation?: IAutoMovieRigidTransform["rotation"],
  ) => IAutoMoviePreparePhysicalGeometry.ICollider = (
    shape: IAutoMoviePhysicalShape,
    x: number,
    rotation: IAutoMovieRigidTransform["rotation"] = AutoMovieEngineQuaternion.identity(),
  ): IAutoMoviePreparePhysicalGeometry.ICollider => ({
    body: x === 0 ? "first" : "second",
    bone: "root",
    shape,
    pose: { position: { x, y: 0, z: 0 }, rotation },
  });
  for (const prediction of [0, 1e-9]) {
    const contact: ReturnType<
      IAutoMoviePreparePhysicalGeometry.IQueries["contact"]
    > = geometry.contact(make(sphere, 0), make(sphere, 0.2), 0, prediction);
    TestValidator.predicate(
      "original tangent has an actual zero-distance native witness",
      contact !== null &&
        nclose(contact.separation, 0, PhysicalTolerance.ROUNDING) &&
        contact.source === "geometric" &&
        contact.impulse === null,
    );
  }
  const shapes: IAutoMoviePhysicalShape[] = [
    sphere,
    { ...sphere, kind: "capsule", radius: 0.1, halfLength: 0.2 },
    { ...sphere, kind: "box", halfExtents: { x: 0.1, y: 0.2, z: 0.3 } },
  ];
  for (const original of shapes) {
    const shape: IAutoMoviePhysicalShape = {
      ...original,
      transform: {
        position: { x: 0, y: 0.3, z: 0.1 },
        rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 17),
      },
    };
    const first: IAutoMoviePreparePhysicalGeometry.ICollider = make(
      shape,
      0,
      AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
    );
    const second: IAutoMoviePreparePhysicalGeometry.ICollider = make(
      shape,
      0.2,
      first.pose.rotation,
    );
    const input: string = JSON.stringify({ first, second });
    const tangent: ReturnType<
      IAutoMoviePreparePhysicalGeometry.IQueries["contact"]
    > = geometry.contact(first, second, 0);
    TestValidator.predicate(
      `${shape.kind} offset tangent retains a geometric witness`,
      tangent !== null &&
        nclose(tangent.separation, 0, NATIVE_DISTANCE) &&
        tangent.impulse === null,
    );
    second.pose.position.x = 0.2001;
    assert.equal(geometry.contact(first, second, 0), null);
    const predicted: ReturnType<
      IAutoMoviePreparePhysicalGeometry.IQueries["contact"]
    > = geometry.contact(first, second, 0, 0.001);
    TestValidator.predicate(
      `${shape.kind} explicit prediction retains positive native distance honestly`,
      predicted !== null &&
        predicted.separation > 0 &&
        nclose(predicted.separation, 0.0001, NATIVE_DISTANCE) &&
        predicted.impulse === null,
    );
    second.pose.position.x = 0.2;
    assert.equal(JSON.stringify({ first, second }), input);
  }
  assert.throws(
    (): ReturnType<IAutoMoviePreparePhysicalGeometry.IQueries["contact"]> =>
      geometry.contact(make(sphere, 0), make(sphere, 0.2), 0, -1),
    /Invalid physical contact query time or prediction/,
  );
}
