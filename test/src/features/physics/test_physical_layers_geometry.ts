import {
  preparePhysicalGeometry as Geometry,
  auditPhysicalOutcomes,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Physical geometry behavior.
 *
 * Scenarios:
 * 1. Exercise actual public inputs and compare physical quantities.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `auditPhysicalOutcomes`, `preparePhysicalGeometry` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate; 1 numbered scenario (first: Exercise actual public inputs and compare physical quantities.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (3 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 1 numbered scenario (first: Exercise actual public inputs and compare physical quantities.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_layers_geometry`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 1 numbered scenario it runs, each sentence naming the input and the behavior it pins (first: Exercise actual public inputs and compare physical quantities.).
 */
export async function test_physical_layers_geometry(): Promise<void> {
  const geometry: Geometry.IQueries = await Geometry();
  const sphere: P.IShape = {
    kind: "sphere",
    id: "surface",
    radius: 0.1,
    material: "solid",
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  };
  const collider: (body: string, x: number) => Geometry.ICollider = (
    body: string,
    x: number,
  ): Geometry.ICollider => ({
    body,
    bone: "root",
    shape: sphere,
    pose: { position: { x, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
  });
  const hit: ReturnType<Geometry.IQueries["contact"]> = geometry.contact(
    collider("a", 0),
    collider("b", 0.15),
    1,
  );
  TestValidator.predicate(
    "geometry contacts surfaces without inventing impulse",
    (): boolean =>
      hit !== null &&
      hit.separation < 0 &&
      hit.impulse === null &&
      geometry.contact(collider("a", 0), collider("b", 0.25), 1) === null,
  );
  const box: Geometry.ICollider = {
    body: "box",
    bone: "root",
    shape: {
      id: "box",
      kind: "box",
      halfExtents: { x: 0.225, y: 0.27, z: 0.108 },
      material: "solid",
      transform: sphere.transform,
    },
    pose: {
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
    },
  };
  const floor: Geometry.ICollider = {
    body: "floor",
    bone: "root",
    shape: {
      id: "floor",
      kind: "box",
      halfExtents: { x: 20, y: 0.5, z: 20 },
      material: "solid",
      transform: sphere.transform,
    },
    pose: {
      position: { x: 0, y: -0.5, z: 0 },
      rotation: sphere.transform.rotation,
    },
  };
  const clearance: ReturnType<Geometry.IQueries["contact"]> = geometry.contact(
    box,
    floor,
    0,
    1,
  );
  TestValidator.predicate(
    "a quarter-turn swaps the vertical box extent without inventing floor overlap",
    Math.abs(geometry.minimumY(box) - 0.775) < 1e-12 &&
      clearance !== null &&
      Math.abs(clearance.separation - 0.775) < 1e-5 &&
      clearance.normal.y < -0.999 &&
      clearance.impulse === null &&
      geometry.contact(box, floor, 0) === null,
  );
  const outcome: auditPhysicalOutcomes.IFinding[] = auditPhysicalOutcomes({
    actions: [
      {
        id: "planned-hit",
        seconds: 1,
        tolerance: 0.01,
        actor: "a",
        target: "b",
        actorShapes: ["surface"],
        targetShapes: ["surface"],
        expected: "contact",
        source: "solver",
      },
    ],
    contacts: hit ? [hit] : [],
    falls: [],
    observedFalls: {},
    missDistance: (): number => 0.05,
    allowUnplanned: (): boolean => true,
  });
  TestValidator.predicate(
    "a solver promise fails loudly on geometric evidence",
    (): boolean =>
      outcome.some(
        (finding: (typeof outcome)[number]): boolean =>
          finding.actionId === "planned-hit" && finding.missDistance === 0.05,
      ),
  );
}
