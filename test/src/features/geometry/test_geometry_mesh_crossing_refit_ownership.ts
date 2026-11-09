import {
  type IAutoMovieMeshCrossing,
  type IAutoMovieMeshCrossingQuery,
  createAutoMovieMeshCrossingQuery,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/** Give every authored triple explicit immutable-addressing input for the query. */
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

/**
 * Independent fixed-layout snapshots retain every ordinal across degenerate
 * geometry, rejected inputs and subsequent caller mutations.
 *
 * Scenarios:
 * 1. Fourteen zero-area triangles form a real nonleaf partition. The twelfth
 *    becomes a known crossing, degenerates again and becomes valid again,
 *    retaining ordinal11 and independently usable earlier snapshots.
 * 2. Source position/index edits cannot change the adopted layout; refit input
 *    and returned report edits cannot alter existing or later snapshots.
 * 3. Wrong scalar counts, nonfinite/hole coordinates including an unused vertex
 *    refuse without damaging the source; empty and implicit-index layouts work.
 * 4. A triangle whose segment merely ends on the reference plane stays clear,
 *    while the adjacent strictly penetrating placement reports the same ordinal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public fixed-layout refit method through degenerate/valid cycles, malformed inputs and source/refit/result mutation. Checks literal original ordinal11 witnesses, earlier query independence, full-position admission, empty and implicit-index semantics, and exact endpoint contact versus a piercing. An active-triangle filter, stale/mutable layout, partial validation or shared mutable world state fails these observations.
 * @evidence contracts/development/testing.md#independent-expectations Fourteen collapsed triples have zero area and cannot pierce the authored z=0 plane. Replacing exactly triple11 with a vertical blade yields its sole known strict intersection; the same blade ending on the plane only touches. Expected records come from original index order and geometric incidence, with fresh-constructor comparisons used as additional compatibility checks rather than the only oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers more than one leaf, initially degenerate and later re-degenerate triangles, refits from the original and derived snapshots, source index/current coordinate/result mutation, too-short/long/nontriplet arrays, all nonfinite forms and sparse holes, unused positions, empty indices with unused vertices, empty/implicit layouts and equality versus strict penetration. The world-placement companion owns affine/mirrored ordering, callback caps and open/closed examples.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable portable geometry unit owns local authored arrays and invokes public Engine APIs plus the existing synchronous refusal helper. It starts no process, browser, GPU, compiler, benchmark or dynamic case registration.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Fourteen zero-area triangles form a real nonleaf partition. The twelfth).
 */
export function test_geometry_mesh_crossing_refit_ownership(): void {
  const plane: IAutoMovieMesh = mesh([0, 0, 0, 2, 0, 0, 0, 2, 0]);
  const collapsed: number[] = [];
  for (let ordinal: number = 0; ordinal < 14; ordinal++)
    for (let corner: number = 0; corner < 3; corner++)
      collapsed.push(10 + ordinal, 0, 0);
  const source: IAutoMovieMesh = mesh([...collapsed]);
  const template: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(source);
  const active: number[] = [...collapsed];
  active.splice(11 * 9, 9, 0.2, 0.2, -1, 0.2, 0.2, 1, 0.8, 0.2, 1);
  const expected: IAutoMovieMeshCrossing[] = [
    { triangle: 0, other: 11, coplanar: false },
  ];
  TestValidator.equals(
    "all original collapsed triples are clear",
    template(plane, { allPairs: true }),
    [],
  );

  // The template must own its original addressing before these caller edits.
  source.positions.fill(NaN);
  source.indices!.fill(0);
  const valid: IAutoMovieMeshCrossingQuery = template.withPositions(active);
  TestValidator.equals(
    "initially zero-area ordinal becomes the sole crossing",
    valid(plane, { allPairs: true }),
    expected,
  );
  TestValidator.equals(
    "fresh current geometry has that same original witness",
    createAutoMovieMeshCrossingQuery(mesh([...active]))(plane, {
      allPairs: true,
    }),
    expected,
  );
  const degenerate: IAutoMovieMeshCrossingQuery =
    valid.withPositions(collapsed);
  TestValidator.equals(
    "derived snapshot retains a now-degenerate original ordinal",
    degenerate(plane, { allPairs: true }),
    [],
  );
  const restored: IAutoMovieMeshCrossingQuery =
    degenerate.withPositions(active);
  TestValidator.equals(
    "derived degenerate snapshot can restore that ordinal",
    restored(plane, { allPairs: true }),
    expected,
  );
  TestValidator.equals(
    "initial template remains independent",
    template(plane),
    [],
  );
  TestValidator.equals(
    "earlier valid query remains independent",
    valid(plane),
    expected,
  );
  TestValidator.equals(
    "earlier degenerate query remains independent",
    degenerate(plane),
    [],
  );

  active.fill(Infinity);
  collapsed.fill(-Infinity);
  const report: IAutoMovieMeshCrossing[] = valid(plane, { allPairs: true });
  report[0]!.triangle = 999;
  report[0]!.other = 999;
  report.pop();
  TestValidator.equals(
    "refit input and report edits cannot change the current snapshot",
    valid(plane, { allPairs: true }),
    expected,
  );
  TestValidator.equals(
    "a sibling snapshot owns its current coordinates",
    restored(plane, { allPairs: true }),
    expected,
  );
  TestValidator.equals(
    "source template never rereads edited original positions",
    template.crosses(plane),
    false,
  );

  const current: number[] = Array.from(
    { length: source.positions.length },
    (): number => 0,
  );
  current.splice(11 * 9, 9, 0.2, 0.2, -1, 0.2, 0.2, 1, 0.8, 0.2, 1);
  for (const length of [
    current.length - 3,
    current.length - 1,
    current.length + 1,
    current.length + 3,
  ])
    TestValidator.predicate(
      `wrong position cardinality ${length} refuses`,
      throwsError(
        (): IAutoMovieMeshCrossingQuery =>
          template.withPositions(Array.from({ length }, (): number => 0)),
        "original XYZ position cardinality",
      ),
    );
  for (const value of [NaN, Infinity, -Infinity]) {
    const invalid: number[] = [...current];
    invalid[0] = value;
    TestValidator.predicate(
      `nonfinite current coordinates refuse ${value}`,
      throwsError(
        (): IAutoMovieMeshCrossingQuery => template.withPositions(invalid),
        "finite complete triangle buffers",
      ),
    );
  }

  // Leave slot zero absent while populating every other original coordinate.
  const sparse: number[] = new Array<number>(current.length);
  for (let scalar: number = 1; scalar < current.length; scalar++)
    sparse[scalar] = current[scalar]!;
  TestValidator.predicate(
    "coordinate holes refuse",
    throwsError(
      (): IAutoMovieMeshCrossingQuery => template.withPositions(sparse),
      "finite complete triangle buffers",
    ),
  );
  TestValidator.predicate(
    "fresh constructor also refuses coordinate holes",
    throwsError(
      (): IAutoMovieMeshCrossingQuery =>
        createAutoMovieMeshCrossingQuery(mesh(sparse)),
      "finite complete triangle buffers",
    ),
  );
  TestValidator.equals(
    "failed refits leave earlier geometry usable",
    valid(plane),
    expected,
  );
  TestValidator.equals(
    "successful refit after failures still owns the fixed addressing",
    template.withPositions(current)(plane),
    expected,
  );

  const unused: IAutoMovieMesh = {
    ...mesh([0.2, 0.2, -1, 0.2, 0.2, 1, 0.8, 0.2, 1, 10, 10, 10]),
    indices: [0, 1, 2],
  };
  const unusedTemplate: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(unused);
  const badUnused: number[] = [...unused.positions];
  badUnused[11] = NaN;
  TestValidator.predicate(
    "unused coordinates are admitted on refit too",
    throwsError(
      (): IAutoMovieMeshCrossingQuery =>
        unusedTemplate.withPositions(badUnused),
      "finite complete triangle buffers",
    ),
  );
  const empty: IAutoMovieMeshCrossingQuery = createAutoMovieMeshCrossingQuery(
    mesh([]),
  );
  TestValidator.equals(
    "empty layout can produce another empty snapshot",
    empty.withPositions([])(plane),
    [],
  );
  TestValidator.equals(
    "empty layout boolean remains false",
    empty.withPositions([]).crosses(plane),
    false,
  );
  TestValidator.predicate(
    "empty layout cannot change its vertex count",
    throwsError(
      (): IAutoMovieMeshCrossingQuery => empty.withPositions([0, 0, 0]),
      "original XYZ position cardinality",
    ),
  );
  const noTriangles: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery({ ...mesh([0, 0, 0]), indices: [] });
  TestValidator.equals(
    "empty index population retains unused-coordinate cardinality",
    noTriangles.withPositions([1, 2, 3])(plane),
    [],
  );
  TestValidator.predicate(
    "empty index population still validates unused coordinates",
    throwsError(
      (): IAutoMovieMeshCrossingQuery => noTriangles.withPositions([NaN, 0, 0]),
      "finite complete triangle buffers",
    ),
  );

  const implicitSource: IAutoMovieMesh = {
    ...mesh([0.2, 0.2, -1, 0.2, 0.2, 1, 0.8, 0.2, 1]),
    indices: null,
  };
  const implicit: IAutoMovieMeshCrossingQuery =
    createAutoMovieMeshCrossingQuery(implicitSource);
  const touch: number[] = [0.2, 0.2, 0, 0.2, 0.2, 1, 0.8, 0.2, 1];
  const contact: IAutoMovieMeshCrossingQuery = implicit.withPositions(touch);
  TestValidator.equals(
    "exact segment endpoint contact is clear",
    contact(plane),
    [],
  );
  TestValidator.equals(
    "exact segment endpoint boolean remains clear",
    contact.crosses(plane),
    false,
  );
  TestValidator.equals(
    "fresh exact-contact query is also clear",
    createAutoMovieMeshCrossingQuery(mesh(touch))(plane),
    [],
  );
  TestValidator.equals(
    "implicit fixed triples remain addressed after strict piercing returns",
    contact.withPositions(implicitSource.positions)(plane),
    [{ triangle: 0, other: 0, coplanar: false }],
  );
}
