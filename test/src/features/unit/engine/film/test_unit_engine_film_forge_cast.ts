import { forgeCast, stageScene } from "@automovie/engine";
import type {
  IAutoMovieForgeEntry,
  IAutoMovieForgedCast,
  IAutoMovieSceneNode,
  IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  forgeEntry,
  makeScriptWrite,
  makeStagingWrite,
} from "../../../internal/filmFixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * `forgeCast` validates generated stand-ins for the cast members without an
 * imported model and keys each by its node.
 *
 * Fixture: the duel cast, where `knightA` imports "stickman" and `knightB` has
 * no model reference.
 *
 * Scenarios:
 *
 * 1. One entry for `knightB` succeeds: the models hold exactly `knightB`, with a
 *    skeleton; staging the scene then gives `knightB`'s node that model's id.
 *    Nodes spelled **proto**, constructor and toString stay own keys and keep
 *    the accepted model.
 * 2. An empty plan fails at `$input.entries` with the value `knightB` only; the
 *    imported `knightA` is never demanded.
 * 3. Entries for a stranger, for the imported `knightA`, for `knightB` with the
 *    wrong model id, and again for `knightB` with an imported origin report
 *    type findings at `$input.entries[0].node`, `[1].node`, `[2].model.id`,
 *    `[3].node` and `[3].model.origin`.
 * 4. A `knightB` entry with no skeleton and a part whose material is undeclared
 *    reports `$input.entries[0].model.skeleton` and
 *    `$input.entries[0].model.parts[0].material` together.
 * 5. A script casting `knightA` twice is refused at `$script.cast[1].node`.
 */
export function test_unit_engine_film_forge_cast(): void {
  const script = makeScriptWrite();

  const forged: IAutoMovieForgedCast = forgeCast(script, {
    entries: [forgeEntry("knightB")],
  });
  TestValidator.equals("success", forged.success, true);
  if (forged.success === true) {
    TestValidator.equals("keys", Object.keys(forged.models), ["knightB"]);
    TestValidator.predicate(
      "rigged",
      forged.models["knightB"]!.skeleton !== null,
    );
    const staged: IAutoMovieStagedSet = stageScene(script, makeStagingWrite());
    TestValidator.equals("staging", staged.success, true);
    if (staged.success === true) {
      const node: IAutoMovieSceneNode = staged.scene.nodes.find(
        (n: IAutoMovieSceneNode): boolean => n.id === "knightB",
      )!;
      TestValidator.equals(
        "joined by id",
        node.model,
        forged.models["knightB"]!.id,
      );
    }
  }
  for (const id of ["__proto__", "constructor", "toString"]) {
    const entry: IAutoMovieForgeEntry = forgeEntry(id);
    const result: IAutoMovieForgedCast = forgeCast(
      makeScriptWrite({
        cast: [{ node: id, character: "the champion", modelRef: null }],
      }),
      { entries: [entry] },
    );
    TestValidator.equals(`${id} success`, result.success, true);
    if (result.success === true) {
      TestValidator.equals(
        `${id} own key`,
        Object.prototype.hasOwnProperty.call(result.models, id),
        true,
      );
      TestValidator.predicate(`${id} model`, result.models[id] === entry.model);
    }
  }

  const empty: IAutoMovieForgedCast = forgeCast(script, { entries: [] });
  TestValidator.equals("empty fails", empty.success, false);
  if (empty.success === false) {
    TestValidator.predicate(
      "empty path",
      hasViolation(empty, "type", "$input.entries"),
    );
    TestValidator.predicate(
      "names knightB",
      empty.violations.some((v) => v.value === "knightB"),
    );
    TestValidator.predicate(
      "spares knightA",
      empty.violations.every((v) => v.value !== "knightA"),
    );
  }

  const bad: IAutoMovieForgedCast = forgeCast(script, {
    entries: [
      forgeEntry("ghost"),
      forgeEntry("knightA"),
      forgeEntry("knightB", { id: "wrong-id" }),
      forgeEntry("knightB", { origin: "imported" }),
    ],
  });
  TestValidator.equals("bad fails", bad.success, false);
  if (bad.success === false) {
    for (const path of [
      "$input.entries[0].node",
      "$input.entries[1].node",
      "$input.entries[2].model.id",
      "$input.entries[3].node",
      "$input.entries[3].model.origin",
    ])
      TestValidator.predicate(path, hasViolation(bad, "type", path));
  }

  const boneless: IAutoMovieForgeEntry = forgeEntry("knightB", {
    skeleton: null,
  });
  boneless.model.parts = [
    { ...boneless.model.parts[0]!, material: "no-such-mat" },
  ];
  const rejected: IAutoMovieForgedCast = forgeCast(script, {
    entries: [boneless],
  });
  TestValidator.equals("boneless fails", rejected.success, false);
  if (rejected.success === false) {
    TestValidator.predicate(
      "skeleton",
      hasViolation(rejected, "type", "$input.entries[0].model.skeleton"),
    );
    TestValidator.predicate(
      "material",
      hasViolation(
        rejected,
        "type",
        "$input.entries[0].model.parts[0].material",
      ),
    );
  }

  const twice: IAutoMovieForgedCast = forgeCast(
    makeScriptWrite({
      cast: [
        {
          node: "knightA",
          character: "the imported challenger",
          modelRef: "stickman",
        },
        {
          node: "knightA",
          character: "the generated impostor",
          modelRef: null,
        },
      ],
    }),
    { entries: [forgeEntry("knightA")] },
  );
  TestValidator.equals("duplicate cast fails", twice.success, false);
  TestValidator.predicate(
    "duplicate cast path",
    twice.success === false &&
      hasViolation(twice, "type", "$script.cast[1].node"),
  );
}
