import {
  admitForgedCastEntries
} from "../../../../../packages/engine/src/film/internal/admitForgedCastEntries";
import type {
  IAutoMovieCastMember,
  IAutoMovieForgeEntry,
  IAutoMovieForgedCast,
  IAutoMovieModel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../internal/fixtures";

/**
 * Join stand-in models by the declared cast node, preserving their identity.
 *
 * Scenarios:
 *
 * 1. An imported model requires no stand-in. A generated stand-in named
 *    `__proto__` is an ordinary own entry in the returned dictionary.
 * 2. A missing stand-in names its cast member in the findings.
 * 3. Unknown and imported nodes refuse entries. Duplicate stand-ins, a wrong model
 *    id, the wrong origin and missing skeleton report their own paths. Model
 *    validation also locates a missing material inside the forged model.
 */
export function test_engine_film_admit_forged_cast_entries(): void {
  const actor: IAutoMovieCastMember = {
    node: "__proto__",
    character: "Lead",
    modelRef: null,
  };
  const guest: IAutoMovieCastMember = {
    node: "guest",
    character: "Guest",
    modelRef: "imported-guest",
  };
  const model: IAutoMovieModel = { ...createModel(), id: actor.node };
  const entry: IAutoMovieForgeEntry = { node: actor.node, model };
  const valid: IAutoMovieForgedCast = admitForgedCastEntries(
    [actor, guest],
    [entry],
  );
  if (!valid.success) throw new Error(JSON.stringify(valid.violations));
  TestValidator.equals(
    "the forged node is emitted as an own key",
    Object.getOwnPropertyNames(valid.models),
    [actor.node],
  );
  TestValidator.predicate(
    "the dictionary reads the admitted model at the literal key",
    valid.models[actor.node] === model,
  );

  const missing: IAutoMovieForgedCast = admitForgedCastEntries(
    [actor, guest],
    [],
  );
  if (missing.success) throw new Error("missing stand-in was accepted");
  TestValidator.equals(
    "only the cast member without an import is missing",
    missing.violations.map(({ path, value }) => [path, value]),
    [["$input.entries", actor.node]],
  );

  const refused: IAutoMovieForgedCast = admitForgedCastEntries(
    [actor, guest, actor],
    [
      { node: "unknown", model },
      { node: guest.node, model: { ...model, id: guest.node } },
      {
        node: actor.node,
        model: { ...model, id: "other", origin: "imported" },
      },
      {
        node: actor.node,
        model: {
          ...model,
          skeleton: null,
          parts: [{ ...model.parts[0]!, material: "missing" }],
        },
      },
    ],
  );
  if (refused.success) throw new Error("contradictory entries were accepted");
  const paths: string[] = refused.violations.map(({ path }) => path);
  for (const path of [
    "$script.cast[2].node",
    "$input.entries[0].node",
    "$input.entries[1].node",
    "$input.entries[2].model.id",
    "$input.entries[2].model.origin",
    "$input.entries[3].node",
    "$input.entries[3].model.skeleton",
    "$input.entries[3].model.parts[0].material",
  ])
    TestValidator.predicate(`locate ${path}`, paths.includes(path));
}
