import type {
  IAutoMovieSceneNode,
  IAutoMovieScript,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieForgedCast } from "../../../../packages/engine/src/film/IAutoMovieForgedCast";
import type { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { forgeCast } from "../../../../packages/engine/src/film/forgeCast";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import {
  forgeEntry,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";

/**
 * Pins the happy path of the FORGE consumer and its join with staging: the one cast member without a `modelRef` gets exactly one validated stand-in, keyed by its node, and the staged scene's `modelRef ?? node` fallback resolves to that forged model's id.
 *
 * Scenarios:
 *
 * 1. The duel cast (knightA imports "stickman", knightB has no modelRef) with one forge entry for knightB → success; `models` holds exactly knightB's rig with a skeleton.
 * 2. Chained into `stageScene`, knightB's scene node carries model "knightB": the exact key `forgeCast` validated, closing the loop from forge to stage.
 * 3. Valid nonblank nodes spelled __proto__, constructor or toString remain own dictionary entries and preserve the accepted model reference.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls forgeCast and stageScene, asserting accepted rigs, exact key joins and own entries for names inherited by ordinary JavaScript objects; detects lost or prototype-mutating registrations.
 * @evidence contracts/testing.md#independent-expectations The nonblank cast-node contract reserves no JavaScript property names, so every submitted node must be an own result key containing its submitted model; staging resolves the same literal id.
 * @evidence contracts/testing.md#distinguishing-cases Covers the ordinary singleton forge join and three reserved dictionary spellings; missing, duplicate, imported and malformed rigs remain covered by other forge entries.
 * @evidence contracts/testing.md#execution-ownership This synchronous portable entry imports engine source directly and reuses existing stand-in fixtures; it creates no viewer, browser, process or Human observation fixture.
 */
export function test_film_forge_cast_valid(): void {
  const script: IAutoMovieScript = makeScriptWrite();
  const forged: IAutoMovieForgedCast = forgeCast(script, {
    entries: [forgeEntry("knightB")],
  });
  TestValidator.equals("success", forged.success, true);
  if (forged.success !== true) return;
  TestValidator.equals("forged keys", Object.keys(forged.models), ["knightB"]);
  TestValidator.predicate(
    "stand-in is rigged",
    forged.models["knightB"]!.skeleton !== null,
  );

  const staged: IAutoMovieStagedSet = stageScene(script, makeStagingWrite());
  TestValidator.equals("staging", staged.success, true);
  if (staged.success !== true) return;
  const nodeB: IAutoMovieSceneNode = staged.scene.nodes.find(
    (n: IAutoMovieSceneNode): boolean => n.id === "knightB",
  )!;
  TestValidator.equals(
    "scene joins the forged model by id",
    nodeB.model,
    forged.models["knightB"]!.id,
  );
  for (const id of ["__proto__", "constructor", "toString"]) {
    const entry: ReturnType<typeof forgeEntry> = forgeEntry(id);
    const result: IAutoMovieForgedCast = forgeCast(
      makeScriptWrite({
        cast: [{ node: id, character: "the champion", modelRef: null }],
      }),
      { entries: [entry] },
    );
    TestValidator.predicate(
      `forge preserves own key ${id}`,
      result.success &&
        Object.prototype.hasOwnProperty.call(result.models, id) &&
        result.models[id] === entry.model,
    );
  }
}
