import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import {
  admitStageCast
} from "../../../../../packages/engine/src/film/staging/internal/admitStageCast";
import type {
  IAutoMovieScript,
  IAutoMovieStageActor,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Cast admission preserves the first model for a declared id, requires one
 * placement for each cast member, and gives mounted actors a placed parent.
 *
 * Scenarios:
 *
 * 1. A duplicate member keeps the first model and earns an indexed finding; an
 *    unplaced cast member and a placed stranger each identify their id.
 * 2. An actor cannot mount itself or an absent actor. An ordinary mounted actor
 *    whose parent is placed is accepted.
 * 3. Every placed actor, including the stranger, claims an id in input order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify first model ownership, cast and placement completeness, mount prerequisites and ordered claimed IDs.
 * @evidence contracts/development/testing.md#behavioral-verification The test admits the authored cast and placements, observes the retained model and recorded node claims, and checks missing and conflicting IDs plus mount diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations The fixture declares the two models with the same ID in known order. Its explicit placement list identifies the stranger and omitted member, and only a placed parent distinct from its rider can satisfy a mount.
 */
export function test_engine_film_admit_stage_cast(): void {
  const out: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const declared: IAutoMovieScript["cast"] = [
    { node: "operator", character: "operator", modelRef: "first-model" },
    { node: "operator", character: "substitute", modelRef: "second-model" },
    { node: "missing", character: "missing", modelRef: null },
    { node: "rider", character: "rider", modelRef: null },
  ];
  const actor = (node: string, parent?: string): IAutoMovieStageActor => ({
    node,
    position: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    attach: parent === undefined ? undefined : { parent, bone: "hips" },
  });
  const claims: [string, string][] = [];
  const cast: Map<string, IAutoMovieScript["cast"][number]> = admitStageCast(
    declared,
    [
      actor("operator", "operator"),
      actor("rider", "operator"),
      actor("stranger", "offstage"),
    ],
    (id: string, path: string): void => {
      claims.push([id, path]);
    },
    out,
  );
  TestValidator.predicate(
    "the first duplicate retains the model",
    cast.get("operator") === declared[0],
  );
  TestValidator.equals(
    "the gate preserves source order across cast and placement diagnostics",
    out.items.map(({ kind, path, value }) => [kind, path, value]),
    [
      ["type", "$script.cast[1].node", "operator"],
      ["type", "$input.actors", "missing"],
      ["type", "$input.actors[0].attach.parent", "operator"],
      ["type", "$input.actors[2].node", "stranger"],
      ["type", "$input.actors[2].attach.parent", "offstage"],
    ],
  );
  TestValidator.equals(
    "all placements share the same claim path scheme",
    claims,
    [
      ["operator", "$input.actors[0].node"],
      ["rider", "$input.actors[1].node"],
      ["stranger", "$input.actors[2].node"],
    ],
  );
}
