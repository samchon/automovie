import {
  buildAutoMovieMeshQueryHierarchy,
  collectAutoMovieSpatialQueryCandidates,
  createAutoMovieMeshCrossingQuery,
  measureAutoMovieMeshCrossings,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshCrossing,
  IAutoMovieMeshCrossingOptions,
  IAutoMovieMeshCrossingQuery,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

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
 *
 * 1. A preceding flat witness loses to a later transverse witness in default mode,
 *    while all-pairs keeps all three in documented candidate order.
 * 2. Thirteen blades force a nonleaf hierarchy while retaining buffer order.
 * 3. Rejecting one endpoint of a triangle-pair intersection leaves its other
 *    endpoint eligible; rejecting every transverse point preserves flat
 *    overlap.
 * 4. Boolean queries match independently expected true/false outcomes for strict
 *    crossings, flat overlap, contact, tolerance, emptiness and misses.
 * 5. Editing original target buffers or returned records cannot edit the snapshot;
 *    editing the current subject is observed on the next call.
 * 6. Open sheets need no solid admission, but a triangle entirely inside a
 *    tetrahedron has no surface crossing and receives no containment
 *    certificate.
 * 7. Invalid current or resident buffers and nonfinite/out-of-range tolerance
 *    still refuse, including current admission against an empty resident.
 * 8. The boolean stops classifying after its first accepted witness while the
 *    census continues through both independently crossing subject faces.
 * 9. A self census of a plane and a blade preserves both directed crossing
 *    witnesses and the classifier's original triangle ordinals.
 * 10. A self census with multiple tree leaves ranks actual witnesses by cell
 *     and ordinal, keeps the direction of a nearly degenerate flat pair and
 *     retains the ordered per-point classifier trace.
 * 11. The public ordered collector distinguishes actual box overlap from the
 *     shared-cell neighbourhood even when both use the same ranking.
 * 12. An optional local assembly receipt supplies unchanged indexed geometry
 *     for a timed self census and exact witness digest.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Executes the reusable callable, its boolean and the one-shot census, including a shared self snapshot. Checks authored ordinal/coplanar records, per-point classification, mutation ownership, current-query admission and clear/contact outcomes, catching stale target references, lost pairs and box-only true answers.
 * @evidence contracts/development/testing.md#independent-expectations Hand-authored vertical blades cross z=0 at two interior points; a small flat triangle lies strictly inside the reference triangle, thirteen blades share one ordering cell, and the contained triangle is strictly within the tetrahedron. These geometry-derived expectations are asserted before parity checks; they prove neither penetration depth nor continuous motion.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers default and all-pairs ordering, a self census with an asymmetric classifier, transverse preference, multiple hierarchy leaves, one rejected endpoint and all rejected witnesses, flat callback bypass, clear/touch/empty cases, resident and current mutation, containment, malformed buffers and tolerance bounds.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable named entry calls portable public Engine queries and local authored mesh builders only. It uses the existing synchronous refusal helper and starts no process, browser, GPU, native build or benchmark.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 12 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A preceding flat witness loses to a later transverse witness in default).
 */
export function test_geometry_mesh_crossing_query(): void {
  const receipt: string | undefined = process.env.AUTOMOVIE_CROSSING_SNAPSHOT;
  if (receipt !== undefined) snapshot(receipt);
  selfWitnesses();
  spatialPopulations();
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

  const crossingSelf: IAutoMovieMesh = mesh([
    ...plane.positions,
    ...blade(0.2),
  ]);
  TestValidator.equals(
    "one snapshot keeps both directed strict witnesses",
    measureAutoMovieMeshCrossings(crossingSelf, crossingSelf, {
      allPairs: true,
    }),
    [
      { triangle: 0, other: 1, coplanar: false },
      { triangle: 1, other: 0, coplanar: false },
    ],
  );
  TestValidator.equals(
    "a self census retains subject and candidate ordinals in the classifier",
    measureAutoMovieMeshCrossings(crossingSelf, crossingSelf, {
      acceptTransversePoint: (
        _point: readonly number[],
        first: number,
        second: number,
      ): boolean => first === 1 && second === 0,
    }),
    [{ triangle: 1, other: 0, coplanar: false }],
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

/** Time the existing census on a previously emitted skin, without generation. */
function snapshot(file: string): void {
  const row: string | undefined = readFileSync(file, "utf8")
    .split(/\r?\n/u)
    .find((line): boolean => line.startsWith('{"assembly"'));
  if (row === undefined) throw new Error("Expected an assembly capture row.");
  const { positions, indices } = (JSON.parse(row) as {
    assembly: { skin: { positions: number[]; indices: number[] } };
  }).assembly.skin;
  const surface: IAutoMovieMesh = {
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  };
  const started = performance.now();
  const witnesses = measureAutoMovieMeshCrossings(surface, surface);
  const milliseconds = performance.now() - started;
  const digest = createHash("sha256")
    .update(JSON.stringify(witnesses))
    .digest("hex");
  console.log(
    JSON.stringify({
      triangles: indices.length / 3,
      witnesses: witnesses.length,
      milliseconds,
      digest,
    }),
  );
}

/** Force rank to differ from partition traversal and ordinal alone. */
function selfWitnesses(): void {
  const smallFlat: number[] = resident().positions.slice(0, 9);
  const population: IAutoMovieMesh = mesh([
    0, 0, 0, 10, 0, 0, 0, 10, 0,
    ...smallFlat,
    ...[4, 0.8, 0.2, 1.2, 3, 3.5, 4.5, 4.75, 5, 5.5, 6, 6.5, 7].flatMap(blade),
  ]);
  const ordered = createAutoMovieMeshCrossingQuery(population);
  const expected: IAutoMovieMeshCrossing[] = ordered(population);
  TestValidator.equals("first transverse in the nearest cell", expected[0], {
    triangle: 0,
    other: 3,
    coplanar: false,
  });
  for (const options of [
    undefined,
    { allPairs: false },
    { interiorTolerance: 0.01 },
  ])
    TestValidator.equals(
      "per-subject ordered witnesses from one admitted self snapshot",
      measureAutoMovieMeshCrossings(population, population, options),
      ordered(population, options),
    );
  const classify = (visits: number[][]): IAutoMovieMeshCrossingOptions => ({
    acceptTransversePoint(point, first, second): boolean {
      visits.push([first, second, ...point]);
      return point[0]! > 0.9;
    },
  });
  const orderedVisits: number[][] = [];
  const selfVisits: number[][] = [];
  TestValidator.equals(
    "classifier results retain the ordered witness preference",
    measureAutoMovieMeshCrossings(population, population, classify(selfVisits)),
    ordered(population, classify(orderedVisits)),
  );
  TestValidator.equals("classifier point order", selfVisits, orderedVisits);

  const directional: IAutoMovieMesh = mesh([
    ...plane.positions,
    0.5, 0.5, 0, 0.5 + 1e-9, 0.5, 0, 0.5, 0.5 + 1e-9, 0,
  ]);
  TestValidator.equals(
    "the first triangle's plane retains its own degeneracy threshold",
    measureAutoMovieMeshCrossings(directional, directional),
    [{ triangle: 0, other: 1, coplanar: true }],
  );
}

/** A nearby box can share a cell without reaching the subject's closed box. */
function spatialPopulations(): void {
  const entry = (ordinal: number, from: number, to: number) => ({
    ordinal,
    low: [from, 0, 0],
    high: [to, 0, 0],
    centre: [(from + to) / 2, 0, 0],
  });
  const subject = entry(3, 1, 1.25);
  const hierarchy = buildAutoMovieMeshQueryHierarchy([
    entry(2, 1.5, 1.5),
    entry(1, 1.25, 1.25),
    entry(0, 0.25, 0.25),
  ]);
  TestValidator.equals(
    "closed coordinate overlap",
    collectAutoMovieSpatialQueryCandidates(hierarchy, subject, 1, "overlap")
      .map(({ ordinal }) => ordinal),
    [1],
  );
  TestValidator.equals(
    "shared cell and original ordinal order",
    collectAutoMovieSpatialQueryCandidates(hierarchy, subject, 1, "shared-cell")
      .map(({ ordinal }) => ordinal),
    [1, 2],
  );
}
