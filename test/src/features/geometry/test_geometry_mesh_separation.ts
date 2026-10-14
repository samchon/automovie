import { nclose } from "../internal/nclose";
import { createAutoMovieMeshSeparationQuery } from "../../../../packages/engine/src/geometry/createAutoMovieMeshSeparationQuery";
import { type IAutoMovieMesh, type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { type IAutoMovieMeshSeparationQuery } from "../../../../packages/engine/src/geometry/IAutoMovieMeshSeparationQuery";
import { type IAutoMovieMeshSeparationResult } from "../../../../packages/engine/src/geometry/IAutoMovieMeshSeparationResult";

/**
 * A resident separation query qualifies complete features, retaining original
 * face identity and spending one shared budget through BVH and feature work.
 * Scenarios:
 * 1. An exterior face passes a smaller requested gap but not its exact limit.
 * 2. A segment with exterior endpoints crossing the resident interior refuses.
 * 3. A fan with allowed root contact and another crossing remains unproved.
 * 4. Snapshot mutation and a multi-leaf hierarchy preserve geometry identity.
 * 5. Open and collapsed resident triangles are unsigned geometric features.
 * 6. Exhaustion retains the already-spent caller budget without a hidden retry.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs resident feature separation and checks conservative certification, limiting ordinals, snapshot ownership, multi-leaf identity and shared work-budget consumption; complete crossing features and exhausted work remain unproved. It catches endpoint-only or hidden-retry acceptance.
 * @evidence contracts/testing.md#independent-expectations The authored parallel face is one unit away, so a .5 requirement is provable but the exact one-unit boundary remains conservatively below one after outward rounding. A segment through the plane has zero separation; open/collapsed features are unsigned geometry, not interior-volume claims. Unproved status alone does not diagnose penetration.
 * @evidence contracts/testing.md#distinguishing-cases Keeps positive versus exact-limit gap, crossing segment/fan, caller snapshot mutation, multi-leaf original ordinal, open and collapsed residents, shared budget and exhaustion without reset. Registered attachment metadata and source/Float32 cap arithmetic have their own entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly invokes portable separation source with existing synthetic vectors and budget records. It starts no process, browser, GPU or native build and creates no Human asset or additional test case; numerical certification is not visual verification.
 */
export function test_geometry_mesh_separation(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
    indices: [0, 1, 2],
    normals: [],
    uvs: [],
    skin: null,
  };
  const p: (x: number, y: number, z: number) => IAutoMovieVector3 = (x: number, y: number, z: number): IAutoMovieVector3  => ({ x, y, z });
  const query: IAutoMovieMeshSeparationQuery = createAutoMovieMeshSeparationQuery(mesh);
  const budget: { remaining: number; } = { remaining: 100 };
  const above: IAutoMovieVector3[] = [p(0, 0, 1), p(2, 0, 1), p(0, 2, 1)];
  const proved: IAutoMovieMeshSeparationResult = query(above, { clearance: 0.5, budget });
  TestValidator.equals("whole face separated", proved.certified, true);
  TestValidator.equals(
    "box proof needs no limiting triangle",
    proved.triangle,
    -1,
  );
  TestValidator.equals("box work is spent", budget.remaining, 99);
  const exact: IAutoMovieMeshSeparationResult = query(above, { clearance: 1, budget });
  TestValidator.equals(
    "exact limit rounds conservatively",
    exact.certified,
    false,
  );
  TestValidator.predicate(
    "lower bound does not overestimate",
    exact.lowerBound < 1 && exact.lowerBound > 0.999999999999,
  );
  TestValidator.equals("original limiting ordinal", exact.triangle, 0);
  const crossing: IAutoMovieMeshSeparationResult = query([p(0.5, 0.5, -1), p(0.5, 0.5, 1)], {
    clearance: 0.1,
    budget,
  });
  TestValidator.predicate("whole crossing segment", nclose(crossing.lowerBound, 0, 0));
  TestValidator.equals(
    "zero gap still requires strict separation",
    query(above, { clearance: 0, budget }).certified,
    true,
  );
  TestValidator.equals(
    "zero gap does not license a contact",
    query([p(0, 0, 0)], { clearance: 0, budget }).certified,
    false,
  );
  const fan: IAutoMovieMeshSeparationResult = query([p(0, 0, 0), p(0.5, 0.5, 1), p(1, 0.5, -1)], {
    clearance: 0.1,
    budget,
  });
  TestValidator.equals(
    "root contact cannot exempt crossing face",
    fan.certified,
    false,
  );
  mesh.positions.fill(100);
  mesh.indices!.fill(0);
  TestValidator.equals(
    "resident snapshot remains owned",
    query(above, { clearance: 0.5, budget }).certified,
    true,
  );
  const collapsed: IAutoMovieMeshSeparationQuery = createAutoMovieMeshSeparationQuery({
    ...mesh,
    positions: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    indices: [0, 1, 2],
  });
  TestValidator.equals(
    "collapsed resident face remains a point",
    collapsed([p(1, 0, 0)], { clearance: 0.5, budget }).certified,
    true,
  );
  const population: IAutoMovieMesh = {
    positions: [],
    indices: [],
    normals: [],
    uvs: [],
    skin: null,
  };
  for (let at: number = 0; at < 14; at++) {
    const z: number = at === 0 || at === 13 ? 0 : (at - 7) * 10;
    population.positions.push(0, 0, z, 2, 0, z, 0, 2, z);
    population.indices!.push(3 * at, 3 * at + 1, 3 * at + 2);
  }
  const multi: IAutoMovieMeshSeparationResult = createAutoMovieMeshSeparationQuery(population)(
    [p(0.25, 0.25, 0.5)],
    { clearance: 1, budget: { remaining: 100 } },
  );
  TestValidator.equals(
    "stable original ordinal after sorting",
    multi.triangle,
    0,
  );
  TestValidator.predicate(
    "hierarchy visits/prunes retain a lower bound",
    multi.lowerBound > 0.499999999999 && multi.lowerBound <= 0.5,
  );
  for (const remaining of [0, 1]) {
    const short: { remaining: number; } = { remaining };
    let refusal: string = "";
    try {
      query(above, { clearance: 1, budget: short });
    } catch (error) {
      refusal = error instanceof Error ? error.message : "";
    }
    TestValidator.predicate(
      "named work exhaustion",
      refusal.includes("exhausted"),
    );
    TestValidator.equals("spent work survives refusal", short.remaining, 0);
  }
}
