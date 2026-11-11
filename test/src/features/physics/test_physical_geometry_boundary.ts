import {
  preparePhysicalGeometry as Geometry,
  Quaternion,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { nclose } from "../internal/nclose";

/** A conservative native search margin discovers exact touching without changing the caller's accepted distance.
 *
 * Scenarios:
 * 1. The original decimal-radius sphere tangent is returned with zero native distance at default and tiny explicit prediction.
 * 2. Offset/rotated sphere, capsule and box boundaries preserve native witnesses and null impulse.
 * 3. A representable positive gap stays absent at default and is admitted only by an explicit sufficient prediction.
 * 4. Query inputs remain unchanged and overflowing composed native transforms are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `preparePhysicalGeometry` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate; 4 numbered scenarios (first: The original decimal-radius sphere tangent is returned with zero native distance at default and tiny...; last: Query inputs remain unchanged and overflowing composed native transforms are refused.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (3 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: The original decimal-radius sphere tangent is returned with zero native distance at default and tiny...; last: Query inputs remain unchanged and overflowing composed native transforms are refused.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_geometry_boundary`, which owns the cases delegated to `PhysicalFixtures`, `nclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The original decimal-radius sphere tangent is returned with zero native distance at default and tiny explicit prediction.).
 */
export async function test_physical_geometry_boundary(): Promise<void> {
  const geometry: Geometry.IQueries = await Geometry();
  const sphere: P.IShape = PhysicalFixtures.sphere().segments[0]!.shapes[0]!;
  const make: (
    shape: P.IShape,
    x: number,
    rotation?: P.ITransform["rotation"],
  ) => Geometry.ICollider = (
    shape: P.IShape,
    x: number,
    rotation: P.ITransform["rotation"] = Quaternion.identity(),
  ): Geometry.ICollider => ({
    body: x === 0 ? "first" : "second",
    bone: "root",
    shape,
    pose: { position: { x, y: 0, z: 0 }, rotation },
  });
  for (const prediction of [0, 1e-9]) {
    const contact: ReturnType<Geometry.IQueries["contact"]> = geometry.contact(
      make(sphere, 0),
      make(sphere, 0.2),
      0,
      prediction,
    );
    TestValidator.predicate(
      "original tangent has an actual zero-distance native witness",
      contact !== null &&
        nclose(contact.separation, 0, 1e-12) &&
        contact.source === "geometric" &&
        contact.impulse === null,
    );
  }
  const shapes: P.IShape[] = [
    sphere,
    { ...sphere, kind: "capsule", radius: 0.1, halfLength: 0.2 },
    { ...sphere, kind: "box", halfExtents: { x: 0.1, y: 0.2, z: 0.3 } },
  ];
  for (const original of shapes) {
    const shape: P.IShape = {
      ...original,
      transform: {
        position: { x: 0, y: 0.3, z: 0.1 },
        rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 17),
      },
    };
    const first: Geometry.ICollider = make(
      shape,
      0,
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
    );
    const second: Geometry.ICollider = make(shape, 0.2, first.pose.rotation);
    const input: string = JSON.stringify({ first, second });
    const tangent: ReturnType<Geometry.IQueries["contact"]> = geometry.contact(
      first,
      second,
      0,
    );
    TestValidator.predicate(
      `${shape.kind} offset tangent retains a geometric witness`,
      tangent !== null &&
        nclose(tangent.separation, 0, 1e-7) &&
        tangent.impulse === null,
    );
    second.pose.position.x = 0.2001;
    assert.equal(geometry.contact(first, second, 0), null);
    const predicted: ReturnType<Geometry.IQueries["contact"]> =
      geometry.contact(first, second, 0, 0.001);
    TestValidator.predicate(
      `${shape.kind} explicit prediction retains positive native distance honestly`,
      predicted !== null &&
        predicted.separation > 0 &&
        nclose(predicted.separation, 0.0001, 1e-7) &&
        predicted.impulse === null,
    );
    second.pose.position.x = 0.2;
    assert.equal(JSON.stringify({ first, second }), input);
  }
  const overflowing: Geometry.ICollider = make(
    {
      ...sphere,
      transform: { ...sphere.transform, position: { x: 2e38, y: 0, z: 0 } },
    },
    2e38,
  );
  assert.throws(
    (): ReturnType<Geometry.IQueries["project"]> =>
      geometry.project(overflowing, { x: 0, y: 0, z: 0 }),
    /Derived native/,
  );
}
