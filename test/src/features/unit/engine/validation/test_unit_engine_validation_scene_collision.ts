import {
  Quaternion,
  measureAutoMovieSceneCollision,
  preparePhysicalGeometry,
} from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMoviePhysicalShape,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { nclose } from "../../../internal/nclose";

/**
 * Compare two candidate searches against known closed solids and named
 * permission.
 *
 * Scenarios:
 *
 * 1. Both searches agree with an exhaustive sphere oracle across formations, a
 *    prop and independently nested paths. Input order cannot change the
 *    findings.
 * 2. A closed solid wholly inside a box produces a signed negative witness. Exact
 *    tangency remains a candidate, while a remote part yields no finding.
 * 3. A named hand contact expires exactly at the second its half-open window ends,
 *    without affecting the independent forearm contact.
 * 4. Proxies, envelope-only and absent geometry retain distinct evidence; an
 *    exhausted search reports remaining work.
 * 5. Enclosing cord segments in one deformable body skip their own pairs, prove
 *    clearance when separated, and stay below confirmation when they overlap a
 *    post.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the geometry, permissions, external grouping and incomplete coverage observations.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the public scene kernel with the real convex query, asserting pair identities, signed witnesses, permission and coverage.
 * @evidence contracts/development/testing.md#independent-expectations The exhaustive reference uses the authored sphere radii and centre distances. Nested box and hand depths follow their axis-aligned face distances, using a tolerance for the native query's precision.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers external and skipped internal pairs, an empty loose group region, tangent and enclosed solids, timed expiry, limited work, unsupported geometry, and separated versus overlapping enclosing solids.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable test_validation_scene_collision function owns a portable in-memory fixture and a geometry-only initialized query. It launches no app or test suite.
 */
export async function test_unit_engine_validation_scene_collision(): Promise<void> {
  const geometry: IAutoMoviePreparePhysicalGeometry.IQueries =
    await preparePhysicalGeometry();
  const radius: number = 0.375;
  const formationA: Collision.IGroup = {
    id: "line-a",
    kind: "managed-formation",
  };
  const formationB: Collision.IGroup = {
    id: "line-b",
    kind: "managed-formation",
  };
  const rows: readonly (readonly [
    string,
    number,
    Collision.IGroup?,
    string?,
  ])[] = [
    ["line-a/slot-0", 0, formationA, "near"],
    ["line-a/slot-1", 0.25, formationA, "near"],
    ["line-a/slot-4097", 20, formationA, "far"],
    ["line-b/hero", 0.5, formationB, "near"],
    ["line-b/slot-0", -20, formationB, "west"],
    ["line-b/slot-1", 40, formationB, "east"],
    ["set/obstacle", 0.375],
    ["scene/nesting/actor-0", 80],
    ["scene/nesting/actor-1", 80.25],
  ];
  const parts: Collision.IPart[] = rows.map(
    ([id, x, group, region]): Collision.IPart => ({
      ...shapePart(id, x, { kind: "sphere", radius }),
      ...(group === undefined ? {} : { group }),
      ...(region === undefined ? {} : { region }),
    }),
  );
  const expected: string[] = [];
  for (const [i, [a, x, group]] of rows.entries())
    for (const [b, y, otherGroup] of rows.slice(i + 1))
      if (
        (group === undefined || group !== otherGroup) &&
        Math.abs(x - y) < 2 * radius
      )
        expected.push([a, b].sort(compareText).join("|"));

  const simple: Collision.IResult = measureAutoMovieSceneCollision({
    parts,
    geometry,
    seconds: 0,
    maxComparisons: 200,
  });
  const refined: Collision.IResult = measureAutoMovieSceneCollision({
    parts,
    geometry,
    seconds: 0,
    maxComparisons: 200,
    refinement: "region",
  });
  const reordered: Collision.IResult = measureAutoMovieSceneCollision({
    parts: parts.slice().reverse(),
    geometry,
    seconds: 0,
    maxComparisons: 200,
    refinement: "region",
  });
  TestValidator.equals(
    "simple search matches exhaustive sphere oracle",
    simple.findings
      .map(({ first, second }) => `${first}|${second}`)
      .sort(compareText),
    expected.sort(compareText),
  );
  TestValidator.predicate(
    "every reference overlap is supported by displayed solid geometry",
    simple.findings.every(
      (finding: Collision.IFinding): boolean => finding.status === "confirmed",
    ),
  );
  TestValidator.equals(
    "region bounds preserve the same pair and witness order",
    refined.findings,
    simple.findings,
  );
  TestValidator.equals(
    "reordering cannot change the result",
    reordered,
    refined,
  );
  TestValidator.equals(
    "only the authored managed groups report internal exclusions",
    refined.internalGroups,
    [formationA, formationB],
  );
  TestValidator.equals(
    "fixed test scenes stay within the budget",
    [simple.budgetExhausted, refined.budgetExhausted],
    [false, false],
  );
  TestValidator.predicate(
    "region bounds remove some of the part comparisons in this fixture",
    refined.compared.parts < simple.compared.parts,
  );

  const box: IAutoMovieVector3 = { x: 0.5, y: 0.5, z: 0.5 };
  const inside: Collision.IResult = measureAutoMovieSceneCollision({
    parts: [
      shapePart("box", 0, { kind: "box", halfExtents: box }),
      shapePart("contents", 0.125, { kind: "sphere", radius: 0.125 }),
      shapePart("remote", 2, { kind: "sphere", radius: 0.125 }),
      shapePart("tangent", 0.75, { kind: "sphere", radius: 0.25 }),
    ],
    geometry,
    seconds: 0,
    maxComparisons: 50,
  });
  TestValidator.equals(
    "containment and tangency are distinct",
    inside.findings.map(({ first, second, status }) => ({
      first,
      second,
      status,
    })),
    [
      { first: "box", second: "contents", status: "confirmed" },
      { first: "box", second: "tangent", status: "candidate" },
    ],
  );
  TestValidator.predicate(
    "the contained sphere is half a metre from clearing the closest face",
    inside.findings.some(
      (finding: Collision.IFinding): boolean =>
        finding.second === "contents" &&
        finding.separation !== null &&
        nclose(finding.separation, -0.5, 0.0001) &&
        finding.point !== null,
    ),
  );

  const held: Collision.IPart[] = [
    shapePart("bed/frame", 0, { kind: "box", halfExtents: box }),
    shapePart("person/forearm", -0.375, { kind: "sphere", radius: 0.25 }),
    shapePart("person/hand", 0.375, { kind: "sphere", radius: 0.25 }),
  ];
  const allowances: Collision.IAllowance[] = [
    {
      first: "person/hand",
      second: "bed/frame",
      startSeconds: 0,
      endSeconds: 0.5,
      maxPenetration: 0.4,
    },
    {
      first: "bed/frame",
      second: "person/hand",
      startSeconds: 0.25,
      endSeconds: 0.375,
      maxPenetration: 0.25,
    },
  ];
  const instants: ReadonlyArray<[number, Collision.IFinding["status"]]> = [
    [0.125, "permitted"],
    [0.25, "confirmed"],
    [0.375, "permitted"],
    [0.5, "confirmed"],
  ];
  for (const [seconds, status] of instants) {
    const actual: Collision.IResult = measureAutoMovieSceneCollision({
      parts: held,
      geometry,
      seconds,
      allowances,
      maxComparisons: 50,
    });
    TestValidator.equals(
      `named permission at ${seconds} seconds`,
      actual.findings.map(
        (finding: Collision.IFinding): string => finding.status,
      ),
      ["confirmed", status],
    );
  }

  const scoped: Collision.IResult = measureAutoMovieSceneCollision({
    parts: held,
    geometry,
    seconds: 0.125,
    allowances: [{ ...allowances[0]!, firstJoints: ["finger"] }],
    maxComparisons: 50,
  });
  TestValidator.equals(
    "a joint-scoped window never relaxes whole-part shapes",
    scoped.findings.map(
      (finding: Collision.IFinding): string => finding.status,
    ),
    ["confirmed", "confirmed"],
  );

  const proxy: Collision.IPart = shapePart(
    "proxy",
    2,
    { kind: "sphere", radius: 0.5 },
    "proxy",
  );
  const proxyTarget: Collision.IPart = shapePart("target", 2.25, {
    kind: "sphere",
    radius: 0.5,
  });
  const bounds: Collision.IPart = {
    id: "envelope",
    geometry: {
      kind: "envelope",
      bounds: { min: { x: 4.5, y: -1, z: -1 }, max: { x: 5.5, y: 1, z: 1 } },
    },
  };
  const candidate: Collision.IResult = measureAutoMovieSceneCollision({
    parts: [
      proxy,
      proxyTarget,
      bounds,
      shapePart("enclosed", 5, { kind: "sphere", radius: 0.5 }),
      { id: "unsupported", geometry: null },
    ],
    geometry,
    seconds: 0,
    maxComparisons: 50,
  });
  TestValidator.equals(
    "proxy witness and bounds-only evidence are separate",
    candidate.findings.map(({ first, second, status, basis }) => ({
      first,
      second,
      status,
      basis,
    })),
    [
      {
        first: "enclosed",
        second: "envelope",
        status: "candidate",
        basis: "envelope",
      },
      { first: "proxy", second: "target", status: "proxy", basis: "proxy" },
    ],
  );
  TestValidator.predicate(
    "a box-only candidate has no manufactured point or depth",
    candidate.findings[0]?.point === null &&
      candidate.findings[0]?.separation === null,
  );
  TestValidator.equals(
    "unavailable geometry is explicit",
    candidate.unboundedParts,
    ["unsupported"],
  );

  const proxyMiss: Collision.IResult = measureAutoMovieSceneCollision({
    parts: [proxy, shapePart("remote", -2, { kind: "sphere", radius: 0.5 })],
    geometry,
    seconds: 0,
    maxComparisons: 50,
  });
  TestValidator.equals(
    "even a disjoint proxy leaves displayed geometry unverified",
    { proxies: proxyMiss.proxyParts, findings: proxyMiss.findings },
    { proxies: ["proxy"], findings: [] },
  );

  const cord: Collision.IGroup = { id: "cord", kind: "deformable-body" };
  const segments: Collision.IPart[] = [0, 0.5].map(
    (x: number, index: number): Collision.IPart => ({
      ...shapePart(
        `cord/segment/${index}`,
        x + 10,
        { kind: "sphere", radius: 0.3 },
        "enclosing",
      ),
      group: cord,
    }),
  );
  const enclosedMiss: Collision.IResult = measureAutoMovieSceneCollision({
    parts: [
      ...segments,
      shapePart("post", 12, { kind: "sphere", radius: 0.5 }),
    ],
    geometry,
    seconds: 0,
    maxComparisons: 50,
  });
  TestValidator.equals(
    "separated enclosing solids prove clearance and skip their own body's pairs",
    {
      findings: enclosedMiss.findings,
      proxies: enclosedMiss.proxyParts,
      groups: enclosedMiss.internalGroups,
    },
    { findings: [], proxies: [], groups: [cord] },
  );
  const enclosedHit: Collision.IResult = measureAutoMovieSceneCollision({
    parts: [
      ...segments,
      shapePart("post", 10.75, { kind: "sphere", radius: 0.5 }),
    ],
    geometry,
    seconds: 0,
    maxComparisons: 50,
  });
  TestValidator.equals(
    "an enclosing overlap stays below displayed confirmation",
    enclosedHit.findings.map(({ first, second, status, basis }) => ({
      first,
      second,
      status,
      basis,
    })),
    [
      {
        first: "cord/segment/0",
        second: "post",
        status: "proxy",
        basis: "proxy",
      },
      {
        first: "cord/segment/1",
        second: "post",
        status: "proxy",
        basis: "proxy",
      },
    ],
  );

  const budget: Collision.IResult = measureAutoMovieSceneCollision({
    parts: [proxy, proxyTarget],
    geometry,
    seconds: 0,
    maxComparisons: 2,
  });
  TestValidator.equals(
    "zero narrow work cannot establish a clean result",
    {
      exhausted: budget.budgetExhausted,
      shapes: budget.compared.shapes,
      findings: budget.findings,
    },
    { exhausted: true, shapes: 0, findings: [] },
  );
  assert.throws(
    (): Collision.IResult =>
      measureAutoMovieSceneCollision({
        parts: [proxy, proxy],
        geometry,
        seconds: 0,
        maxComparisons: 100,
      }),
    /distinct paths/,
  );
}

/** Order paths by code unit, independent of locale. */
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Construct an admitted sphere or closed box centred on the world X axis. */
function shapePart(
  id: string,
  x: number,
  volume:
    | Pick<
        Extract<IAutoMoviePhysicalShape, { kind: "sphere" }>,
        "kind" | "radius"
      >
    | Pick<
        Extract<IAutoMoviePhysicalShape, { kind: "box" }>,
        "kind" | "halfExtents"
      >,
  basis: "displayed" | "enclosing" | "proxy" = "displayed",
): Collision.IPart {
  return {
    id,
    geometry: {
      kind: "shape",
      basis,
      collider: {
        body: id,
        bone: "root",
        shape: {
          ...volume,
          id,
          material: "solid",
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: Quaternion.identity(),
          },
        },
        pose: { position: { x, y: 0, z: 0 }, rotation: Quaternion.identity() },
      },
    },
  };
}
