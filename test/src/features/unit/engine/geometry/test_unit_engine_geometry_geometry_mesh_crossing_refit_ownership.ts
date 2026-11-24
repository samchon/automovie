import { createAutoMovieMeshCrossingQuery } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshCrossing,
  IAutoMovieMeshCrossingQuery,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

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
 */
export function test_unit_engine_geometry_geometry_mesh_crossing_refit_ownership(): void {
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
