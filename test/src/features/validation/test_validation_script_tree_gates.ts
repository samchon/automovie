import {
  IAutoMovieConstraintViolation,
  IAutoMovieScriptNode,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateScriptTree } from "../../../../packages/engine/src/validation/validateScriptTree";
import { createScriptTreeFixture } from "../internal/createScriptTreeFixture";

/** Run a mutation of an otherwise valid tree against its independent flat header and beats. */
function gate(
  mutate: (tree: IAutoMovieScriptNode[]) => IAutoMovieScriptNode[],
): IAutoMovieValidation {
  const fixture: Parameters<typeof validateScriptTree>[0] =
    createScriptTreeFixture();
  return validateScriptTree({ ...fixture, tree: mutate(fixture.tree) });
}

/** Require the located refusal and, when supplied, the independently expected reason. */
function refusal(
  name: string,
  result: IAutoMovieValidation,
  path: string,
  reason: string = "",
): void {
  TestValidator.predicate(
    name,
    result.success === false &&
      result.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.kind === "type" &&
          item.path === path &&
          item.expected.includes(reason),
      ),
  );
}

/** Change one named node without relying on its array position to find it. */
function edit(
  id: string,
  mutate: (node: IAutoMovieScriptNode) => IAutoMovieScriptNode,
): IAutoMovieValidation {
  return gate((tree: IAutoMovieScriptNode[]): IAutoMovieScriptNode[] =>
    tree.map(
      (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
        node.id === id ? mutate(node) : node,
    ),
  );
}

/**
 * Every graph and editorial payload gate reports the authored field that failed.
 *
 * Scenarios:
 * 1. Blank/duplicate ids, missing/multiple/wrong roots and a nonroot intent fail.
 * 2. Dangling parents, illegal parent kinds and cyclic chains fail.
 * 3. Self/dangling temporal and interaction edges fail at their respective fields.
 * 4. Unknown, duplicate and missing beat claims fail the one-to-one join.
 * 5. Negative and nonfinite dialogue anchors fail independently.
 * 6. Blank or unequal intent headers and blank group rationale fail.
 * 7. Cycle members and their ancestors name each chain's first repeated node.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs source script admission on independently malformed graph, join, anchor and editorial payloads and asserts violation kinds and exact authored paths; editorial and cycle regressions also require their reason so an unrelated graph fault cannot satisfy them.
 * @evidence contracts/testing.md#independent-expectations Expectations follow the allowed parent table, exactly one intent root, nonself resolved cross edges, one-to-one beat join, finite nonnegative anchors and nonblank exact header agreement; the hand-authored act-scene-group cycle determines each chain's first repeated parent independently of traversal.
 * @evidence contracts/testing.md#distinguishing-cases Owns each structural refusal, empty/duplicate identities, missing references and beat claims, two invalid anchor domains and every editorial field's blank/unequal case; valid five-kind, empty-beat and deep acyclic trees belong to test_validation_script_tree.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous unit function owns all mutations and private assertion helpers; shared fixtures contain portable authored data and require no host or dynamic registration.
 */
export function test_validation_script_tree_gates(): void {
  refusal(
    "blank id",
    edit(
      "grp",
      (node: IAutoMovieScriptNode): IAutoMovieScriptNode => ({
        ...node,
        id: " ",
      }),
    ),
    "$input.tree[3].id",
  );
  refusal(
    "duplicate id",
    edit(
      "grp",
      (node: IAutoMovieScriptNode): IAutoMovieScriptNode => ({
        ...node,
        id: "act1",
      }),
    ),
    "$input.tree[3].id",
  );
  const noRoot: IAutoMovieValidation = edit(
    "root",
    (node: IAutoMovieScriptNode): IAutoMovieScriptNode => ({
      ...node,
      parent: "act1",
    }),
  );
  refusal("missing root", noRoot, "$input.tree");
  refusal("nonroot intent", noRoot, "$input.tree[0].parent");
  refusal(
    "multiple roots",
    edit(
      "act1",
      (node: IAutoMovieScriptNode): IAutoMovieScriptNode => ({
        ...node,
        parent: null,
      }),
    ),
    "$input.tree",
  );
  refusal(
    "wrong root kind",
    gate((tree: IAutoMovieScriptNode[]): IAutoMovieScriptNode[] =>
      tree
        .filter((node: IAutoMovieScriptNode): boolean => node.kind !== "intent")
        .map(
          (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
            node.id === "act1" ? { ...node, parent: null } : node,
        ),
    ),
    "$input.tree[0].kind",
  );
  refusal(
    "dangling parent",
    edit(
      "grp",
      (node: IAutoMovieScriptNode): IAutoMovieScriptNode => ({
        ...node,
        parent: "ghost",
      }),
    ),
    "$input.tree[3].parent",
  );
  refusal(
    "illegal act under scene",
    edit(
      "act1",
      (node: IAutoMovieScriptNode): IAutoMovieScriptNode => ({
        ...node,
        parent: "scene1",
      }),
    ),
    "$input.tree[1].parent",
  );
  const temporal: IAutoMovieValidation = gate(
    (tree: IAutoMovieScriptNode[]): IAutoMovieScriptNode[] =>
      tree.map(
        (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
          node.id === "b1"
            ? { ...node, temporal: "b1" }
            : node.id === "b2"
              ? { ...node, temporal: "ghost" }
              : node,
      ),
  );
  refusal("self temporal", temporal, "$input.tree[4].temporal");
  refusal("dangling temporal", temporal, "$input.tree[5].temporal");
  const interactions: IAutoMovieValidation = edit(
    "b1",
    (node: IAutoMovieScriptNode): IAutoMovieScriptNode => ({
      ...node,
      interactsWith: ["b1", "ghost"],
    }),
  );
  refusal("self interaction", interactions, "$input.tree[4].interactsWith[0]");
  refusal(
    "dangling interaction",
    interactions,
    "$input.tree[4].interactsWith[1]",
  );
  refusal(
    "unknown beat",
    edit(
      "b1",
      (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
        node.kind === "beat"
          ? { ...node, payload: { ...node.payload, beat: "ghost" } }
          : node,
    ),
    "$input.tree[4].payload.beat",
  );
  const duplicateClaim: IAutoMovieValidation = edit(
    "b2",
    (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
      node.kind === "beat"
        ? { ...node, payload: { ...node.payload, beat: "beat-1" } }
        : node,
  );
  refusal(
    "duplicate beat claim",
    duplicateClaim,
    "$input.tree[5].payload.beat",
  );
  refusal(
    "duplicate claim leaves beat unclaimed",
    duplicateClaim,
    "$input.tree",
  );
  refusal(
    "missing beat node",
    gate((tree: IAutoMovieScriptNode[]): IAutoMovieScriptNode[] =>
      tree.filter((node: IAutoMovieScriptNode): boolean => node.id !== "b2"),
    ),
    "$input.tree",
  );
  const anchors: IAutoMovieValidation = edit(
    "b1",
    (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
      node.kind === "beat"
        ? {
            ...node,
            payload: {
              ...node.payload,
              dialogue: [
                { speaker: "A", text: "x", anchor: -1 },
                { speaker: "B", text: "y", anchor: Number.NaN },
              ],
            },
          }
        : node,
  );
  for (const index of [0, 1])
    TestValidator.predicate(
      `invalid anchor ${index}`,
      anchors.success === false &&
        anchors.violations.some(
          (item: IAutoMovieConstraintViolation): boolean =>
            item.kind === "range" &&
            item.path === `$input.tree[4].payload.dialogue[${index}].anchor`,
        ),
    );
  for (const field of ["logline", "theme"] as const)
    for (const value of [" ", "Another authored statement"])
      refusal(
        `intent ${field} rejects ${JSON.stringify(value)}`,
        edit(
          "root",
          (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
            node.kind === "intent"
              ? { ...node, payload: { ...node.payload, [field]: value } }
              : node,
        ),
        `$input.tree[0].payload.${field}`,
        value.trim().length === 0 ? "non-empty" : "exactly match",
      );
  refusal(
    "blank group rationale",
    edit(
      "grp",
      (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
        node.kind === "group"
          ? { ...node, payload: { rationale: "\t " } }
          : node,
    ),
    "$input.tree[3].payload.rationale",
    "group rationale must be non-empty",
  );
  const cycle: IAutoMovieValidation = edit(
    "act1",
    (node: IAutoMovieScriptNode): IAutoMovieScriptNode => ({
      ...node,
      parent: "grp",
    }),
  );
  for (const [index, repeated] of [
    [1, "act1"],
    [2, "scene1"],
    [3, "grp"],
    [4, "grp"],
    [5, "grp"],
  ] as const)
    refusal(
      `cycle chain ${index}`,
      cycle,
      `$input.tree[${index}].parent`,
      `cyclic at "${repeated}"`,
    );
}
