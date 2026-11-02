import { TestValidator } from "@nestia/e2e";

import { HumanAnatomy as A } from "../internal/HumanAnatomy";
import { HumanPlaneIndex } from "../internal/HumanPlaneIndex";
import { nclose } from "../internal/nclose";

/**
 * Parallel-plane acceleration preserves the complete cutter's geometry.
 *
 * Scenarios:
 * 1. Straight, bowed and translated tubes preserve every crossing triangle.
 * 2. Disconnected tubes, oblique normals, vertex and edge tangencies retain
 *    the same girth, area, points, containment and outside distance.
 * 3. A triangle taller than 60 mm survives a plane near its far end.
 * 4. Empty, singleton, reordered and duplicate regions retain their semantics;
 *    malformed and non-finite inputs refuse instead of silently losing cuts.
 * 5. A longitudinal workload meets declared candidate-count and memory budgets.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the index and existing cutter, comparing accelerated cuts with full scans and independently enumerating every crossing triangle. Missing candidates, changed region order or changed cut results fail. The long-triangle case is red with the former lo-minus-60 height-window shortcut, which excludes that crossing triangle, and green with this index.
 * @evidence contracts/testing.md#independent-expectations The oracle uses the cutter's explicit signed-distance crossing predicate on all supplied triangles, independently of projected intervals or the index tree. Full-scan cutter outputs establish acceleration parity, not anatomy correctness; a separate 20 mm circular tube perimeter has the analytic 40 pi expectation within its polygon chord deficit. Visit and byte budgets were declared before measurement in HumanPlaneIndex; no hardware-dependent timing limit is asserted.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty/singleton/reordered/duplicate regions, displaced and bent geometry, disjoint components, arbitrary finite normals, zero normal, exact vertex/edge contact, large-coordinate cancellation, subnormal values, malformed indices and NaN/infinite input. Whole-person geometry and anatomical limits remain owned by the anatomy tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test under --include human_plane_index. It creates synthetic typed arrays and invokes local geometry functions without generating a person or starting any host, process or GPU.
 */
export function test_human_plane_index(): void {
  for (const [bow, offset, copies] of [
    [0, 0, 1],
    [130, 0, 1],
    [130, 45, 1],
    [80, 0, 2],
  ]) {
    const skin: A.ISkin = tubes(bow!, offset!, copies!, 16, 32);
    for (const normal of [
      [0, 1, 0],
      [0.3, 0.8, -0.2],
      [0, 0, 1],
    ] as A.V3[]) {
      const index: HumanPlaneIndex = new HumanPlaneIndex(skin, normal);
      const section: (origin: A.V3, pick?: A.V3) => A.ICut | null = A.parallel(skin, normal);
      for (const y of [0, 18.75, 75, 150, 150.123, 225, 300, 301]) {
        const origin: A.V3 = [0, y, 0];
        const candidates: Uint32Array = index.query(origin);
        complete(skin, origin, normal, candidates);
        sameCut(
          A.cut(skin, origin, normal, origin),
          section(origin),
        );
      }
    }
  }

  // A 128-sided circle's perimeter deficit is less than 0.013 mm.
  const round: A.ISkin = tubes(0, 0, 1, 4, 128);
  const origin: A.V3 = [0, 150.123, 0];
  const normal: A.V3 = [0, 1, 0];
  const cut: A.ICut | null = A.cut(
    round,
    origin,
    normal,
    origin,
    new HumanPlaneIndex(round, normal).query(origin),
  );
  TestValidator.predicate(
    "analytic circle",
    cut !== null && nclose(cut.girth, 40 * Math.PI, 0.02),
  );

  // A caller's later direction change cannot invalidate the prepared plane.
  const mutable: A.V3 = [0, 1, 0];
  const section: (origin: A.V3, pick?: A.V3) => A.ICut | null = A.parallel(round, mutable);
  mutable[0] = 1;
  sameCut(A.cut(round, origin, normal, origin), section(origin));

  const tall: A.ISkin = mesh([0, 0, 0, 1, 120, 0, -1, 120, 0], [0, 1, 2]);
  TestValidator.predicate(
    "long triangle survives",
    new HumanPlaneIndex(tall, normal).query([0, 100, 0])[0] === 0,
  );
  for (const y of [0, 60, 120, 121])
    complete(
      tall,
      [0, y, 0],
      normal,
      new HumanPlaneIndex(tall, normal).query([0, y, 0]),
    );
  const region: Uint32Array = Uint32Array.from([3, 1, 3, 0]);
  const ordered: HumanPlaneIndex = new HumanPlaneIndex(round, normal, region);
  TestValidator.predicate(
    "region order and duplicates",
    [...ordered.query([0, 37.5, 0])].join(",") === "3,1,3,0",
  );
  TestValidator.predicate(
    "empty region",
    new HumanPlaneIndex(round, normal, new Uint32Array()).query(origin)
      .length === 0,
  );
  TestValidator.predicate(
    "empty mesh",
    new HumanPlaneIndex(mesh([], []), normal).query(origin).length === 0,
  );
  TestValidator.predicate(
    "zero normal",
    new HumanPlaneIndex(tall, [0, 0, 0]).query(origin).length === 1,
  );

  // Cancellation and subnormal terms must not remove a crossing triangle.
  for (const [skin, at, n] of [
    [
      mesh(
        [1e15, 1e15, 0, 1e15 + 1, 1e15 - 1, 0, 1e15 - 1, 1e15 + 1, 1],
        [0, 1, 2],
      ),
      [1e15, 1e15, 0],
      [1, -1, 0],
    ],
    [
      mesh(
        [0, 0, 0, 0, Number.MIN_VALUE, 0, 1, -Number.MIN_VALUE, 0],
        [0, 1, 2],
      ),
      [0, 0, 0],
      [0, 1, 0],
    ],
    [
      mesh([1e308, 0, 0, 0, 1, 0, 0, -1, 0], [0, 1, 2]),
      [-1e308, 0, 0],
      [0, 1, 0],
    ],
  ] as [A.ISkin, A.V3, A.V3][]) {
    complete(skin, at, n, new HumanPlaneIndex(skin, n).query(at));
  }
  for (const operation of [
    (): unknown => new HumanPlaneIndex(tall, [NaN, 1, 0]),
    (): unknown => new HumanPlaneIndex(tall, [0, Infinity, 0]),
    (): unknown => new HumanPlaneIndex(tall, normal, Uint32Array.from([1])),
    (): unknown => new HumanPlaneIndex(mesh([0, 0], []), normal),
    (): unknown => new HumanPlaneIndex(mesh([0, 0, 0], [0, 1, 0]), normal),
    (): unknown => new HumanPlaneIndex(mesh([NaN, 0, 0], [0, 0, 0]), normal),
    (): unknown => new HumanPlaneIndex(tall, normal).query([0, NaN, 0]),
    (): unknown => new HumanPlaneIndex(tall, normal).query([0, Infinity, 0]),
  ]) {
    let refused: boolean = false;
    try {
      operation();
    } catch (error) {
      refused = error instanceof RangeError;
    }
    TestValidator.predicate("malformed input refuses", refused);
  }

  // This longitudinal mesh has two triangle rows crossing each ordinary plane.
  const workload: A.ISkin = tubes(80, 45, 1, 1000, 100);
  const prepared: HumanPlaneIndex = new HumanPlaneIndex(workload, normal);
  let visits: number = 0;
  for (let i: number = 0; i < 400; i++)
    visits += prepared.query([0, (300 * (i + 0.37)) / 400, 0]).length;
  TestValidator.predicate(
    "candidate visit budget",
    visits <= (0.25 * 400 * workload.I.length) / 3,
  );
  TestValidator.predicate(
    "retained byte budget",
    prepared.bytes <= (64 * workload.I.length) / 3,
  );
}

/** Independently retain every triangle whose actual signed distances straddle zero. */
function complete(
  skin: A.ISkin,
  origin: A.V3,
  normal: A.V3,
  candidates: Uint32Array,
): void {
  const found: Set<number> = new Set(candidates);
  for (let t: number = 0; t < skin.I.length / 3; t++) {
    const signs: boolean[] = [];
    for (let k: number = 0; k < 3; k++) {
      const v: number = skin.I[3 * t + k]!;
      signs.push(
        (skin.P[3 * v]! - origin[0]) * normal[0] +
          (skin.P[3 * v + 1]! - origin[1]) * normal[1] +
          (skin.P[3 * v + 2]! - origin[2]) * normal[2] >=
          0,
      );
    }
    TestValidator.predicate(
      "no false negative",
      (signs[0] === signs[1] && signs[1] === signs[2]) || found.has(t),
    );
  }
}

/** The accelerated region must leave every observable component result equal. */
function sameCut(a: A.ICut | null, b: A.ICut | null): void {
  TestValidator.predicate("cut existence", (a === null) === (b === null));
  if (a === null || b === null) return;
  TestValidator.predicate(
    "cut scalars",
    nclose(a.girth, b.girth, 1e-9) &&
      nclose(a.area, b.area, 1e-9) &&
      nclose(a.outside, b.outside, 1e-9),
  );
  TestValidator.predicate("cut containment", a.contained === b.contained);
  TestValidator.predicate(
    "cut point count",
    a.points.length === b.points.length,
  );
  a.points.forEach((p: A.V3, i: number): void => {
    TestValidator.predicate(
      "cut points",
      p.every((x: number, j: number): boolean =>
        nclose(x, b.points[i]![j]!, 1e-9),
      ),
    );
  });
}

/** Closed rings with an optional bowed centreline and disconnected translated copy. */
function tubes(
  bow: number,
  offset: number,
  copies: number,
  rows: number,
  phases: number,
): A.ISkin {
  const P: number[] = [];
  const I: number[] = [];
  for (let c: number = 0; c < copies; c++) {
    const start: number = P.length / 3;
    for (let k: number = 0; k <= rows; k++) {
      const t: number = k / rows;
      for (let j: number = 0; j < phases; j++) {
        const theta: number = (2 * Math.PI * j) / phases;
        P.push(
          offset + 100 * c + bow * Math.sin(Math.PI * t) + 20 * Math.cos(theta),
          300 * t,
          20 * Math.sin(theta),
        );
        if (k === rows) continue;
        const a: number = start + k * phases + j;
        const b: number = start + k * phases + ((j + 1) % phases);
        I.push(a, a + phases, b, b, a + phases, b + phases);
      }
    }
  }
  return mesh(P, I);
}

/** Synthetic skin without a Human generation, rig or anatomical prior. */
function mesh(P: number[], I: number[]): A.ISkin {
  return {
    name: "plane fixture",
    P: Float64Array.from(P),
    I: Uint32Array.from(I),
    tri: new Int32Array(I.length / 3),
    chains: ["fixture"],
    joints: new Map(),
  };
}
