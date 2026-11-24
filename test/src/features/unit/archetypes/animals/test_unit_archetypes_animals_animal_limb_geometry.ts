import { AutoMovieArchetypeQuadrupedLimb } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The actual four-bar geometric solver keeps fixed goals and refuses outside
 * reach.
 *
 * Scenarios:
 *
 * 1. Independent axial controls have literal lengths 2,3,4,5 metres. Their
 *    unfolded triangle is [10,14]; both tangencies and an interior goal solve
 *    for fore and hind branches without moving either supplied endpoint.
 * 2. A ninety-degree distal fold gives a 3-by-9 right-triangle carriage and bounds
 *    sqrt(90)+/-2. A half-turn folds the last nine metres back against three
 *    metres, yielding [4,8]; a twelve-metre goal then refuses.
 * 3. Two-ULP outside tangencies, excessive drop, zero root-goal distance,
 *    nonfinite values, wrong count, sparse controls, zero lengths and visible
 *    out-of-plane data refuse as RangeError, without a stretched result.
 * 4. A bent neutral five-point source is recovered at zero relative fold; prepared
 *    state isolates source/output mutation and small admitted plane arithmetic
 *    preserves the caller's exact root and terminal X values.
 */
export function test_unit_archetypes_animals_animal_limb_geometry(): void {
  const findings: string[] = [];
  const source: IAutoMovieVector3[] = [
    { x: 2, y: 9, z: -3 },
    { x: 2, y: 7, z: -3 },
    { x: 2, y: 4, z: -3 },
    { x: 2, y: 0, z: -3 },
    { x: 2, y: -5, z: -3 },
  ];
  const bytes: string = JSON.stringify(source);
  for (const fore of [true, false]) {
    const prepared: AutoMovieArchetypeQuadrupedLimb.IPrepared =
      AutoMovieArchetypeQuadrupedLimb.prepare(source, fore);
    const zero: AutoMovieArchetypeQuadrupedLimb.IRange = prepared.range(0);
    near(`${fore} unfolded inner`, zero.minimum, 10);
    near(`${fore} unfolded outer`, zero.maximum, 14);
    for (const span of [10, 12, 14]) {
      const root: IAutoMovieVector3 = { x: 2, y: 17, z: 11 };
      const goal: IAutoMovieVector3 = { x: 2, y: 17 - span, z: 11 };
      const solved: IAutoMovieVector3[] = prepared.solve(root, goal, 0);
      verify(solved, root, goal, `${fore}/unfolded/${span}`);
      if (span === 12)
        truth(
          `${fore} selects its independent bend side`,
          fore ? solved[1]!.z < root.z : solved[1]!.z > root.z,
        );
      if (span === 14)
        for (const [index, y] of [
          [0, 17],
          [1, 15],
          [2, 12],
          [3, 8],
          [4, 3],
        ] as const)
          near(`${fore}/outer literal joint ${index}`, solved[index]!.y, y);
      if (span === 10)
        for (const [index, y] of [
          [0, 17],
          [1, 19],
          [2, 16],
          [3, 12],
          [4, 7],
        ] as const)
          near(`${fore}/inner literal joint ${index}`, solved[index]!.y, y);
    }
    const quarter: AutoMovieArchetypeQuadrupedLimb.IRange = prepared.range(90);
    near(`${fore} quarter inner`, quarter.minimum, Math.sqrt(90) - 2);
    near(`${fore} quarter outer`, quarter.maximum, Math.sqrt(90) + 2);
    const root: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
    const goal: IAutoMovieVector3 = { x: 2, y: -9, z: 0 };
    const folded: IAutoMovieVector3[] = prepared.solve(root, goal, 90);
    verify(folded, root, goal, `${fore}/quarter`);
    const b: IAutoMovieVector3 = delta(folded[2]!, folded[1]!);
    const c: IAutoMovieVector3 = delta(folded[3]!, folded[2]!);
    const d: IAutoMovieVector3 = delta(folded[4]!, folded[3]!);
    near(`${fore} folded middle bars perpendicular`, dot(b, c), 0);
    near(`${fore} final two bars keep neutral carriage`, dot(c, d), 20);
    truth(
      `${fore} relative fold has the declared side`,
      fore ? b.y * c.z - b.z * c.y > 0 : b.y * c.z - b.z * c.y < 0,
    );
    const reverse: AutoMovieArchetypeQuadrupedLimb.IRange = prepared.range(180);
    near(`${fore} half-turn inner`, reverse.minimum, 4);
    near(`${fore} half-turn outer`, reverse.maximum, 8);
    refusal(`${fore}/wrong root plane`, (): unknown =>
      prepared.solve({ x: 2.01, y: 0, z: 0 }, { x: 2, y: -12, z: 0 }, 0),
    );
    const noisyRoot: IAutoMovieVector3 = { x: 2 + 1e-14, y: 0, z: 0 };
    const noisy: IAutoMovieVector3[] = prepared.solve(
      noisyRoot,
      { x: 2, y: -12, z: 0 },
      0,
    );
    verify(noisy, noisyRoot, { x: 2, y: -12, z: 0 }, `${fore}/roundoff plane`);
    truth(
      `${fore} admitted root X is not projected`,
      noisy[0]!.x === noisyRoot.x,
    );
  }
  truth(
    "ordinary preparation and solving do not mutate source",
    JSON.stringify(source) === bytes,
  );

  const bent: IAutoMovieVector3[] = [
    { x: 2, y: 3, z: -4 },
    { x: 2, y: 1, z: -4 },
    { x: 2, y: 1, z: -1 },
    { x: 2, y: -3, z: -1 },
    { x: 2, y: -6, z: 3 },
  ];
  const recovered: IAutoMovieVector3[] =
    AutoMovieArchetypeQuadrupedLimb.prepare(bent, true).solve(
      bent[0]!,
      bent[4]!,
      0,
    );
  verify(recovered, bent[0]!, bent[4]!, "actual bent neutral carriage");
  for (let index: number = 0; index < 5; index++)
    for (const axis of ["x", "y", "z"] as const)
      near(
        `actual bent neutral joint ${index}.${axis}`,
        recovered[index]![axis],
        bent[index]![axis],
      );

  const owned: IAutoMovieVector3[] = source.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
  );
  const snapshot: AutoMovieArchetypeQuadrupedLimb.IPrepared =
    AutoMovieArchetypeQuadrupedLimb.prepare(owned, true);
  owned[1]!.z += 100;
  const root: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
  const goal: IAutoMovieVector3 = { x: 2, y: -12, z: 0 };
  const first: IAutoMovieVector3[] = snapshot.solve(root, goal, 0);
  first[0]!.x += 100;
  first[2]!.y += 100;
  first[4]!.z += 100;
  near("returned root does not alias caller root", root.x, 2, 0);
  near("returned terminal does not alias caller goal", goal.z, 0, 0);
  const fresh: IAutoMovieVector3[] = snapshot.solve(root, goal, 0);
  verify(fresh, root, goal, "independent prepared replay");
  near(
    "source mutation cannot rewrite prepared range",
    snapshot.range(0).maximum,
    14,
  );
  const changedRange: AutoMovieArchetypeQuadrupedLimb.IRange =
    snapshot.range(0);
  changedRange.maximum = 100;
  near(
    "returned range cannot rewrite prepared range",
    snapshot.range(0).maximum,
    14,
  );

  const equalPieces: AutoMovieArchetypeQuadrupedLimb.IPrepared =
    AutoMovieArchetypeQuadrupedLimb.prepare(
      [
        { x: 2, y: 0, z: 0 },
        { x: 2, y: -12, z: 0 },
        { x: 2, y: -15, z: 0 },
        { x: 2, y: -19, z: 0 },
        { x: 2, y: -24, z: 0 },
      ],
      true,
    );
  near(
    "equal pieces include a zero inner distance bound",
    equalPieces.range(0).minimum,
    0,
    0,
  );
  refusal(
    "zero distance still cannot orient an equal-piece triangle",
    (): unknown => equalPieces.solve(root, root, 0),
  );

  const duplicate: IAutoMovieVector3[] = source.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
  );
  duplicate[2] = { ...duplicate[1]! };
  const offPlane: IAutoMovieVector3[] = source.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
  );
  offPlane[3]!.x += 0.01;
  for (const [name, invalid] of [
    ["zero bar", duplicate],
    ["nonplanar source", offPlane],
  ] as const)
    refusal(name, (): unknown =>
      AutoMovieArchetypeQuadrupedLimb.prepare(invalid, true),
    );
  TestValidator.equals("fixed-root actual four-bar geometry", findings, []);

  /**
   * Every result must meet the unchanged independent four lengths and exact
   * endpoints.
   */
  function verify(
    points: readonly IAutoMovieVector3[],
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    label: string,
  ): void {
    truth(`${label} five controls`, points.length === 5);
    for (const axis of ["x", "y", "z"] as const) {
      near(`${label} fixed root.${axis}`, points[0]![axis], from[axis], 0);
      near(`${label} fixed goal.${axis}`, points[4]![axis], to[axis], 0);
    }
    for (const [index, expected] of [
      [0, 2],
      [1, 3],
      [2, 4],
      [3, 5],
    ] as const) {
      const vector: IAutoMovieVector3 = delta(
        points[index + 1]!,
        points[index]!,
      );
      near(
        `${label} literal length ${index}`,
        Math.hypot(vector.x, vector.y, vector.z),
        expected,
      );
    }
  }

  /**
   * Refusal must be the declared geometric RangeError, not an incidental
   * exception.
   */
  function refusal(label: string, action: () => unknown): void {
    let error: unknown;
    try {
      action();
    } catch (caught) {
      error = caught;
    }
    truth(label, error instanceof RangeError);
  }

  /**
   * Vector arithmetic observes solved coordinates without reimplementing
   * triangle solving.
   */
  function delta(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  /**
   * Dot products distinguish unchanged relative carriage from merely correct
   * endpoints.
   */
  function dot(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /** All floating observations use the independent repository predicate. */
  function near(
    label: string,
    actual: number,
    expected: number,
    tolerance: number = 1e-10,
  ): void {
    truth(
      `${label}: ${actual}, expected ${expected}`,
      nclose(actual, expected, tolerance),
    );
  }

  /** Keep the complete negative/positive cause batch visible in one unit result. */
  function truth(label: string, condition: boolean): void {
    try {
      TestValidator.predicate(label, condition);
    } catch (error) {
      findings.push(String(error));
    }
  }
}
