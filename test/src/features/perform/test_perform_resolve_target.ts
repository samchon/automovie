import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { resolveTargetPoint } from "@automovie/engine";
import { vclose } from "../internal/predicates";

/**
 * Positional resolution preserves every authored group member.
 *
 * Scenarios:
 * 1. Node and literal-point targets resolve; an absent node returns null.
 * 2. Complete singleton and multi-member groups return equal-weight centroids.
 * 3. Empty, all-missing and partially missing groups return null, including a missing formation table or formation member.
 * 4. Formations carry one member's weight beside each node, regardless of mass.
 * 5. Large finite same-sign coordinates average without summation overflow.
 * 6. Relative direction/offscreen goals and live bones need other context.
 *
 * @evidence contracts/testing.md#behavioral-verification Directly calls resolveTargetPoint and asserts complete-group centroids and null for every missing member; catches silently discarded nodes/formations and overflow of a finite centroid while allowing staged and literal point resolution.
 * @evidence contracts/testing.md#independent-expectations Hand-authored x coordinates 1 and 3 average to 2, and adding a formation at 8 yields 4 under equal member weights; identical 1e308 coordinates average to that same finite value without relying on the implementation's accumulation order. Original vclose component tolerance remains; the unit does not check vector alias identity, malformed/nonfinite shape admission or a different accumulation-rounding bound.
 * @evidence contracts/testing.md#distinguishing-cases Covers existing/missing nodes, literal points, empty/singleton/two-member/mixed-missing groups, supplied and absent formation maps, large finite values and relative/live target kinds; film gate tests own located user-facing membership diagnostics.
 * @evidence contracts/testing.md#execution-ownership This synchronous discoverable unit entry owns all cases and imports the portable engine resolver directly; it needs no host, renderer, native artifact or installed consumer.
 */
export function test_perform_resolve_target(): void {
  const nodes: Map<string, IAutoMovieVector3> = new Map([
    ["a", { x: 1, y: 0, z: 0 }],
    ["b", { x: 3, y: 0, z: 0 }],
  ]);
  function assertPoint(
    title: string,
    actual: IAutoMovieVector3 | null,
    expected: IAutoMovieVector3,
  ): void {
    TestValidator.predicate(title, actual !== null && vclose(actual, expected));
  }
  assertPoint(
    "a staged node resolves",
    resolveTargetPoint({ kind: "node", node: "a" }, nodes),
    { x: 1, y: 0, z: 0 },
  );
  TestValidator.equals(
    "an absent node is unresolved",
    resolveTargetPoint({ kind: "node", node: "z" }, nodes),
    null,
  );
  assertPoint(
    "literal coordinates resolve",
    resolveTargetPoint({ kind: "point", point: { x: 5, y: 1, z: 5 } }, nodes),
    { x: 5, y: 1, z: 5 },
  );
  assertPoint(
    "a singleton keeps its member's position",
    resolveTargetPoint({ kind: "group", nodes: ["a"] }, nodes),
    { x: 1, y: 0, z: 0 },
  );
  assertPoint(
    "a complete group takes its centroid",
    resolveTargetPoint({ kind: "group", nodes: ["a", "b"] }, nodes),
    { x: 2, y: 0, z: 0 },
  );
  for (const members of [[], ["z"], ["a", "z"], ["z", "a"]])
    TestValidator.equals(
      "any absent group member prevents a partial centroid",
      resolveTargetPoint({ kind: "group", nodes: members }, nodes),
      null,
    );
  const formations: Map<string, IAutoMovieVector3> = new Map([
    ["mass", { x: 8, y: 0, z: 0 }],
  ]);
  assertPoint(
    "a compact mass has one member's weight",
    resolveTargetPoint(
      { kind: "group", nodes: ["a", "b"], formations: ["mass"] },
      nodes,
      formations,
    ),
    { x: 4, y: 0, z: 0 },
  );
  assertPoint(
    "a formation-only group resolves with its table",
    resolveTargetPoint(
      { kind: "group", nodes: [], formations: ["mass"] },
      nodes,
      formations,
    ),
    { x: 8, y: 0, z: 0 },
  );
  TestValidator.equals(
    "an unavailable formation table cannot drop a member",
    resolveTargetPoint(
      { kind: "group", nodes: ["a"], formations: ["mass"] },
      nodes,
    ),
    null,
  );
  TestValidator.equals(
    "a missing formation cannot drop a member",
    resolveTargetPoint(
      { kind: "group", nodes: ["a"], formations: ["absent"] },
      nodes,
      formations,
    ),
    null,
  );
  const large: Map<string, IAutoMovieVector3> = new Map([
    ["a", { x: 1e308, y: 0, z: 0 }],
    ["b", { x: 1e308, y: 0, z: 0 }],
  ]);
  assertPoint(
    "finite centroids do not overflow a raw sum",
    resolveTargetPoint({ kind: "group", nodes: ["a", "b"] }, large),
    { x: 1e308, y: 0, z: 0 },
  );
  TestValidator.equals(
    "direction needs facing context",
    resolveTargetPoint({ kind: "direction", headingDeg: 90 }, nodes),
    null,
  );
  TestValidator.equals(
    "offscreen needs camera context",
    resolveTargetPoint({ kind: "offscreen", edge: "left" }, nodes),
    null,
  );
  TestValidator.equals(
    "bone needs live rig context",
    resolveTargetPoint({ kind: "bone", node: "a", bone: "leftHand" }, nodes),
    null,
  );
}
