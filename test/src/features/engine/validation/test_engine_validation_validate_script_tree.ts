import { validateScriptTree } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieScriptNode,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createScriptTreeFixture } from "../../internal/createScriptTreeFixture";

type Input = Parameters<typeof validateScriptTree>[0];

/**
 * `validateScriptTree` admits a screenplay refinement tree joined one-to-one to
 * the flat beats, and names the node field that breaks it.
 *
 * Fixture: the five-kind tree (intent root, act1, scene1, grp, beats b1 and b2
 * claiming beat-1 and beat-2).
 *
 * Scenarios:
 *
 * 1. The tree, a lone intent root over no beats, and a 10 000-deep alternating
 *    group/scene chain (no recursion limit) validate.
 * 2. Type findings: grp's parent `ghost` at `[3].parent`; act1 under scene1 at
 *    `[1].parent`; b1 temporal to itself and b2 to `ghost` at `[4].temporal`
 *    and `[5].temporal`; b1 interacting with itself and `ghost` at
 *    `[4].interactsWith[0]` and `[1]`; b1 claiming `ghost` at
 *    `[4].payload.beat`; b2 claiming beat-1 again at `[5].payload.beat`.
 */
export function test_engine_validation_validate_script_tree(): void {
  const fixture: Input = createScriptTreeFixture();
  const refused = (
    label: string,
    result: IAutoMovieValidation,
    path: string,
  ): void =>
    TestValidator.predicate(
      label,
      result.success === false &&
        result.violations.some(
          (v: IAutoMovieConstraintViolation): boolean =>
            v.kind === "type" && v.path === `$input.tree${path}`,
        ),
    );
  const edit = (
    changes: Record<
      string,
      (node: IAutoMovieScriptNode) => IAutoMovieScriptNode
    >,
  ): IAutoMovieValidation =>
    validateScriptTree({
      ...fixture,
      tree: fixture.tree.map(
        (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
          changes[node.id]?.(node) ?? node,
      ),
    });
  const claim =
    (beat: string) =>
    (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
      node.kind === "beat"
        ? { ...node, payload: { ...node.payload, beat } }
        : node;

  // 1.
  TestValidator.equals("five kinds", validateScriptTree(fixture).success, true);
  const root: IAutoMovieScriptNode = fixture.tree[0]!;
  const minimal: Input = { ...fixture, tree: [root], beats: [] };
  TestValidator.equals(
    "intent only",
    validateScriptTree(minimal).success,
    true,
  );
  const deep: IAutoMovieScriptNode[] = [root];
  for (let i: number = 1; i < 10000; i++)
    deep.push(
      i % 2 === 1
        ? {
            id: `deep-${i}`,
            kind: "group",
            parent: i === 1 ? "root" : `deep-${i - 1}`,
            temporal: null,
            interactsWith: [],
            payload: { rationale: "Nested editorial group" },
          }
        : {
            id: `deep-${i}`,
            kind: "scene",
            parent: `deep-${i - 1}`,
            temporal: null,
            interactsWith: [],
            payload: {
              interiorExterior: "EXT",
              location: "location",
              timeOfDay: "day",
              description: null,
            },
          },
    );
  TestValidator.equals(
    "deep chain",
    validateScriptTree({ ...minimal, tree: deep }).success,
    true,
  );

  // 2.
  refused(
    "dangling parent",
    edit({ grp: (n) => ({ ...n, parent: "ghost" }) }),
    "[3].parent",
  );
  refused(
    "act under scene",
    edit({ act1: (n) => ({ ...n, parent: "scene1" }) }),
    "[1].parent",
  );
  const temporal: IAutoMovieValidation = edit({
    b1: (n) => ({ ...n, temporal: "b1" }),
    b2: (n) => ({ ...n, temporal: "ghost" }),
  });
  refused("self temporal", temporal, "[4].temporal");
  refused("dangling temporal", temporal, "[5].temporal");
  const interacts: IAutoMovieValidation = edit({
    b1: (n) => ({ ...n, interactsWith: ["b1", "ghost"] }),
  });
  refused("self interaction", interacts, "[4].interactsWith[0]");
  refused("dangling interaction", interacts, "[4].interactsWith[1]");
  refused("unknown beat", edit({ b1: claim("ghost") }), "[4].payload.beat");
  refused("duplicate claim", edit({ b2: claim("beat-1") }), "[5].payload.beat");
}
