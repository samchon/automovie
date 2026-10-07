import { createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

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
 */
export const test_geometry_mesh_separation = (): void => {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
    indices: [0, 1, 2],
    normals: [],
    uvs: [],
    skin: null,
  };
  const p = (x: number, y: number, z: number) => ({ x, y, z });
  const query = createAutoMovieMeshSeparationQuery(mesh);
  const budget = { remaining: 100 };
  const above = [p(0, 0, 1), p(2, 0, 1), p(0, 2, 1)];
  const proved = query(above, { clearance: 0.5, budget });
  TestValidator.equals("whole face separated", proved.certified, true);
  TestValidator.equals(
    "box proof needs no limiting triangle",
    proved.triangle,
    -1,
  );
  TestValidator.equals("box work is spent", budget.remaining, 99);
  const exact = query(above, { clearance: 1, budget });
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
  const crossing = query([p(0.5, 0.5, -1), p(0.5, 0.5, 1)], {
    clearance: 0.1,
    budget,
  });
  TestValidator.equals("whole crossing segment", crossing.lowerBound, 0);
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
  const fan = query([p(0, 0, 0), p(0.5, 0.5, 1), p(1, 0.5, -1)], {
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
  const collapsed = createAutoMovieMeshSeparationQuery({
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
  for (let at = 0; at < 14; at++) {
    const z = at === 0 || at === 13 ? 0 : (at - 7) * 10;
    population.positions.push(0, 0, z, 2, 0, z, 0, 2, z);
    population.indices!.push(3 * at, 3 * at + 1, 3 * at + 2);
  }
  const multi = createAutoMovieMeshSeparationQuery(population)(
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
    const short = { remaining };
    let refusal = "";
    try {
      query(above, { clearance: 1, budget: short });
    } catch (error) {
      refusal = (error as Error).message;
    }
    TestValidator.predicate(
      "named work exhaustion",
      refusal.includes("exhausted"),
    );
    TestValidator.equals("spent work survives refusal", short.remaining, 0);
  }
};
