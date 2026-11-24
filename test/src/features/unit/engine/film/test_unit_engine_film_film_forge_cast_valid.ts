import { forgeCast, stageScene } from "@automovie/engine";
import type {
  IAutoMovieForgedCast,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  forgeEntry,
  makeScriptWrite,
  makeStagingWrite,
} from "../../../internal/filmFixtures";

/**
 * Pins the happy path of the FORGE consumer and its join with staging: the one cast member without a `modelRef` gets exactly one validated stand-in, keyed by its node, and the staged scene's `modelRef ?? node` fallback resolves to that forged model's id.
 *
 * Scenarios:
 *
 * 1. The duel cast (knightA imports "stickman", knightB has no modelRef) with one forge entry for knightB → success; `models` holds exactly knightB's rig with a skeleton.
 * 2. Chained into `stageScene`, knightB's scene node carries model "knightB": the exact key `forgeCast` validated, closing the loop from forge to stage.
 * 3. Valid nonblank nodes spelled __proto__, constructor or toString remain own dictionary entries and preserve the accepted model reference.
 */
export function test_unit_engine_film_film_forge_cast_valid(): void {
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
