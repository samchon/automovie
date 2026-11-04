import {
  type IAutoMovieMeshCrossing,
  type IAutoMovieMeshCrossingOptions,
  type IAutoMovieMeshCrossingQuery,
  createAutoMovieMeshCrossingQuery,
  measureAutoMovieMeshCrossings,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/** Make independent indexed triangles from their authored XYZ coordinates. */
function mesh(positions: number[]): IAutoMovieMesh {
  return {
    positions,
    indices: Array.from(
      { length: positions.length / 3 },
      (_: unknown, index: number): number => index,
    ),
    normals: null,
    uvs: null,
    skin: null,
  };
}

/** The triangle contains the positive X/Y region strictly below x+y=2. */
const plane: IAutoMovieMesh = mesh([0, 0, 0, 2, 0, 0, 0, 2, 0]);

/** A vertical blade has two distinct plane intersections at x and x+0.3. */
function blade(x: number): number[] {
  return [x, 0.2, -1, x, 0.2, 1, x + 0.6, 0.2, 1];
}

/** An interior coplanar triangle precedes two strict transverse blades. */
function resident(): IAutoMovieMesh {
  return mesh([
    0.1,
    0.4,
    0,
    0.3,
    0.4,
    0,
    0.1,
    0.6,
    0,
    ...blade(0.2),
    ...blade(0.8),
  ]);
}

/**
 * A resident crossing query preserves actual witness identity while owning its
 * target snapshot independently of later buffer edits.
 *
 * Scenarios:
 * 1. A preceding flat witness loses to a later transverse witness in default
 *    mode, while all-pairs keeps all three in documented candidate order.
 * 2. Thirteen blades force a nonleaf hierarchy while retaining buffer order.
 * 3. Rejecting one endpoint of a triangle-pair intersection leaves its other
 *    endpoint eligible; rejecting every transverse point preserves flat overlap.
 * 4. Boolean queries match independently expected true/false outcomes for
 *    strict crossings, flat overlap, contact, tolerance, emptiness and misses.
 * 5. Editing original target buffers or returned records cannot edit the
 *    snapshot; editing the current subject is observed on the next call.
 * 6. Open sheets need no solid admission, but a triangle entirely inside a
 *    tetrahedron has no surface crossing and receives no containment certificate.
 * 7. Invalid current or resident buffers and nonfinite/out-of-range tolerance
 *    still refuse, including current admission against an empty resident.
 * 8. The boolean stops classifying after its first accepted witness while
 *    the census continues through both independently crossing subject faces.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the reusable callable, its boolean and the legacy delegating census. Checks exact authored ordinal/coplanar records, per-point cap behavior, mutation ownership, current-query admission and clear/contact outcomes, catching stale mutable target references, lost pairs and box-only true answers.
 * @evidence contracts/testing.md#independent-expectations Hand-authored vertical blades cross z=0 at two interior points; a small flat triangle lies strictly inside the reference triangle, thirteen blades share one ordering cell, and the contained triangle is strictly within the tetrahedron. These geometry-derived expectations are asserted before parity checks; they prove neither penetration depth nor continuous motion.
 * @evidence contracts/testing.md#distinguishing-cases Covers default versus all-pairs ordering, transverse preference, more than one hierarchy leaf, one rejected endpoint versus all rejected witnesses, flat callback bypass, clear/touch/empty/tolerance neighbours, resident/current mutations, open-sheet versus containment meaning, malformed buffers and all tolerance range boundaries. Existing crossing tests retain their shared-corner folds and ULP cases.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry calls portable public Engine queries and local authored mesh builders only. It uses the existing synchronous refusal helper and starts no process, browser, GPU, native build or benchmark.
 */
export function test_geometry_mesh_crossing_query(): void {
  const target: IAutoMovieMesh = resident();
  const query: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(target);
  const expected: IAutoMovieMeshCrossing[] = [
    { triangle: 0, other: 0, coplanar: true },
    { triangle: 0, other: 1, coplanar: false },
    { triangle: 0, other: 2, coplanar: false },
  ];
  TestValidator.equals(
    "flat then both transverse witnesses",
    query(plane, {
      allPairs: true,
    }),
    expected,
  );
  TestValidator.equals("default prefers transverse", query(plane), [
    expected[1],
  ]);
  TestValidator.equals(
    "explicit default preserves preference",
    query(plane, {
      allPairs: false,
    }),
    [expected[1]],
  );
  TestValidator.equals(
    "one-shot shares the complete owner",
    measureAutoMovieMeshCrossings(plane, target, { allPairs: true }),
    expected,
  );

  const population: IAutoMovieMesh = mesh(
    Array.from({ length: 13 }, (_: unknown, ordinal: number): number[] =>
      blade(0.1 + ordinal * 0.04),
    ).flat(),
  );
  const ordered: IAutoMovieMeshCrossing[] = Array.from(
    { length: 13 },
    (_: unknown, ordinal: number): IAutoMovieMeshCrossing => ({
      triangle: 0,
      other: ordinal,
      coplanar: false,
    }),
  );
  TestValidator.equals(
    "tree partition preserves original ordinals and order",
    createAutoMovieMeshCrossingQuery(population)(plane, { allPairs: true }),
    ordered,
  );

  const capped: IAutoMovieMeshCrossingOptions = {
    allPairs: true,
    acceptTransversePoint: (
      point: readonly number[],
      first: number,
      second: number,
    ): boolean => first === 0 && second === 1 && point[0]! > 0.3,
  };
  TestValidator.equals(
    "cap removes only one point, not its pair",
    query(plane, capped),
    [expected[0], expected[1]],
  );
  const reject: IAutoMovieMeshCrossingOptions = {
    acceptTransversePoint: (): boolean => false,
  };
  TestValidator.equals(
    "flat witness bypasses transverse cap",
    query(plane, reject),
    [expected[0]],
  );
  const transverse: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(mesh(blade(0.2)));
  TestValidator.equals(
    "all rejected endpoint witnesses stay clear",
    transverse(plane, reject),
    [],
  );

  const twice: IAutoMovieMesh = mesh([...plane.positions, ...plane.positions]);
  let classified: number = 0;
  const observe: IAutoMovieMeshCrossingOptions = {
    acceptTransversePoint: (): boolean => {
      classified++;
      return true;
    },
  };
  TestValidator.equals(
    "boolean finds the first real witness",
    transverse.crosses(twice, observe),
    true,
  );
  TestValidator.equals(
    "boolean stops classifying later witnesses",
    classified,
    1,
  );
  classified = 0;
  TestValidator.equals(
    "census retains both crossing subject faces",
    transverse(twice, observe),
    [
      { triangle: 0, other: 0, coplanar: false },
      { triangle: 1, other: 0, coplanar: false },
    ],
  );
  TestValidator.equals("census classifies both real witnesses", classified, 2);

  const clear: IAutoMovieMesh = mesh(
    plane.positions.map((value: number, index: number): number =>
      index % 3 === 2 ? value + 4 : value,
    ),
  );
  const touch: IAutoMovieMesh = mesh([0.2, 0.2, 0, 0.2, 0.2, 1, 0.8, 0.2, 1]);
  const empty: IAutoMovieMesh = mesh([]);
  const cases: readonly {
    name: string;
    query: IAutoMovieMeshCrossingQuery;
    first: IAutoMovieMesh;
    options?: IAutoMovieMeshCrossingOptions;
    expected: boolean;
  }[] = [
    { name: "transverse", query: transverse, first: plane, expected: true },
    {
      name: "flat despite rejected transverse",
      query,
      first: plane,
      options: reject,
      expected: true,
    },
    {
      name: "all capped",
      query: transverse,
      first: plane,
      options: reject,
      expected: false,
    },
    { name: "lifted clear", query, first: clear, expected: false },
    {
      name: "endpoint contact",
      query: createAutoMovieMeshCrossingQuery(touch),
      first: plane,
      expected: false,
    },
    { name: "empty source", query, first: empty, expected: false },
    {
      name: "empty resident",
      query: createAutoMovieMeshCrossingQuery(empty),
      first: plane,
      expected: false,
    },
    {
      name: "interior margin",
      query: transverse,
      first: plane,
      options: { interiorTolerance: 0.49 },
      expected: false,
    },
  ];
  for (const scenario of cases)
    for (const allPairs of [false, true]) {
      const options: IAutoMovieMeshCrossingOptions = {
        ...scenario.options,
        allPairs,
      };
      const found: boolean = scenario.query.crosses(scenario.first, options);
      TestValidator.equals(
        `${scenario.name} witnessed boolean ${allPairs}`,
        found,
        scenario.expected,
      );
      TestValidator.equals(
        `${scenario.name} census parity ${allPairs}`,
        scenario.query(scenario.first, options).length > 0,
        found,
      );
    }

  target.positions.fill(Number.NaN);
  target.indices![0] = 999;
  TestValidator.equals(
    "resident buffer mutation cannot change snapshot",
    query(plane, { allPairs: true }),
    expected,
  );
  TestValidator.predicate(
    "fresh resident admits current buffers and refuses corruption",
    throwsError(
      (): IAutoMovieMeshCrossingQuery =>
        createAutoMovieMeshCrossingQuery(target),
    ),
  );
  const report: IAutoMovieMeshCrossing[] = query(plane, { allPairs: true });
  report[0]!.other = 999;
  report.pop();
  TestValidator.equals(
    "returned records cannot edit later reports",
    query(plane, { allPairs: true }),
    expected,
  );
  const current: IAutoMovieMesh = mesh([...plane.positions]);
  TestValidator.equals(
    "current subject initially crosses",
    query.crosses(current),
    true,
  );
  for (let i: number = 2; i < current.positions.length; i += 3)
    current.positions[i]! += 4;
  TestValidator.equals(
    "current subject geometry is never cached",
    query.crosses(current),
    false,
  );

  const tetrahedron: IAutoMovieMesh = mesh([
    0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0,
    0, 4, 4, 0, 0, 0, 0, 4, 0, 4, 0,
  ]);
  const inside: IAutoMovieMesh = mesh([
    0.5, 0.5, 0.5, 0.7, 0.5, 0.5, 0.5, 0.7, 0.5,
  ]);
  const shell: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(tetrahedron);
  TestValidator.equals(
    "containment is not surface crossing",
    shell(inside),
    [],
  );
  TestValidator.equals(
    "boolean gives no containment certificate",
    shell.crosses(inside),
    false,
  );

  for (const tolerance of [Number.NaN, Infinity, -Infinity, -0.01, 0.5, 1]) {
    TestValidator.predicate(
      `callable refuses tolerance ${tolerance}`,
      throwsError(
        (): IAutoMovieMeshCrossing[] =>
          query(plane, { interiorTolerance: tolerance }),
        "finite [0, 0.5)",
      ),
    );
    TestValidator.predicate(
      `boolean refuses tolerance ${tolerance}`,
      throwsError(
        (): boolean => query.crosses(plane, { interiorTolerance: tolerance }),
        "finite [0, 0.5)",
      ),
    );
  }
  const invalid: IAutoMovieMesh = {
    ...plane,
    positions: [...plane.positions],
    indices: [0, 1, 99],
  };
  TestValidator.predicate(
    "boolean admits current indices even with empty resident",
    throwsError((): boolean =>
      createAutoMovieMeshCrossingQuery(empty).crosses(invalid),
    ),
  );
  TestValidator.predicate(
    "callable refuses current nonfinite position",
    throwsError(
      (): IAutoMovieMeshCrossing[] =>
        query({ ...plane, positions: [NaN, ...plane.positions.slice(1)] }),
      "finite complete triangle buffers",
    ),
  );
}
