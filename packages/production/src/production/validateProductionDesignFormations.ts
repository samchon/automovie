import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { validateProductionDesignInteger } from "./validateProductionDesignInteger";
import { AUTOMOVIE_MAX_FORMATION_MEMBERS } from "./AUTOMOVIE_MAX_FORMATION_MEMBERS";
import { validateProductionDesignBoundedVector } from "./validateProductionDesignBoundedVector";
import { AUTOMOVIE_WORLD_COORDINATE_LIMIT } from "./AUTOMOVIE_WORLD_COORDINATE_LIMIT";
import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { validateProductionDesignFormationLayout } from "./validateProductionDesignFormationLayout";
import { validateProductionDesignUniqueTextValues } from "./validateProductionDesignUniqueTextValues";
import { AUTOMOVIE_MAX_FORMATION_HEROES } from "./AUTOMOVIE_MAX_FORMATION_HEROES";
import { IAutoMovieDiagnostic } from "@automovie/interface";
import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Check keyed formation identity, model reference, count, anchor, heading, seed, layout, capabilities and unique hero slots/actors.
 *
 * @evidence contracts/common.md#principled-implementation Schema-admitted map entries must match exact keyed ids and existing model recipes; scalar gates constrain count/anchor/heading/seed and the layout helper checks capacity. Local Sets enforce unique hero slots/actors alongside slot/count and hero-count limits. These declarations do not establish placement clearance or source realization.
 * @evidence contracts/common.md#clear-and-simple-design This per-record formation pass owns keyed identity, model membership and hero-slot/actor uniqueness; aggregate budgets precede it and layout arithmetic remains in the layout helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation Documents metre anchors, degree headings, integral counts/seeds and hero identity limits; sharedRoot supplies record paths and all findings append without changing records or realizing members.
 * @evidence contracts/performance.md#efficient-algorithms Formation fields and hero populations are scanned with call-local identity sets; each fixed layout check retains its original arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Each formation borrows the current model map and keeps local slot/actor Sets across its hero loop; no earlier graph admission or realized formation is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Hero identity Sets and capability keys are temporary, proportional to supplied populations; all appended findings remain in the caller's array without a diagnostic cap, handle or task.
 */
export function validateProductionDesignFormations(diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, sharedRoot: string): void {
for (const [id, formation] of graph.formations) {
    const target: string = `formation:${id}`;
    const file: string = `${sharedRoot}/formations/${encodeAutoMoviePathSegment(id)}.json`;
    validateProductionDesignText(diagnostics, formation.id, target, file, "id");
    validateProductionDesignText(diagnostics, formation.modelRecipe, target, file, "modelRecipe");
    if (formation.id !== id)
      validateProductionDesignInvalid(
        diagnostics,
        "design-identity-mismatch",
        target,
        file,
        `Formation file identity is "${id}" but value id is "${formation.id}". Rewrite it as a tracked formation design using one matching id.`,
      );
    if (graph.models.has(formation.modelRecipe) === false)
      validateProductionDesignMissing(
        diagnostics,
        target,
        file,
        `model recipe "${formation.modelRecipe}"`,
        `Create or correct the model recipe record for "${formation.modelRecipe}" or change ${id}.modelRecipe`,
      );
    validateProductionDesignInteger(
      diagnostics,
      formation.count,
      1,
      AUTOMOVIE_MAX_FORMATION_MEMBERS,
      target,
      file,
      "count",
    );
    validateProductionDesignBoundedVector(
      diagnostics,
      formation.anchor,
      -AUTOMOVIE_WORLD_COORDINATE_LIMIT,
      AUTOMOVIE_WORLD_COORDINATE_LIMIT,
      target,
      file,
      "anchor",
    );
    validateProductionDesignBounded(
      diagnostics,
      formation.facingDeg,
      -360_000,
      360_000,
      target,
      file,
      "facingDeg",
    );
    validateProductionDesignInteger(
      diagnostics,
      formation.seed,
      0,
      Number.MAX_SAFE_INTEGER,
      target,
      file,
      "seed",
    );
    validateProductionDesignFormationLayout(diagnostics, formation, target, file);
    validateProductionDesignUniqueTextValues(
      diagnostics,
      formation.capabilities,
      target,
      file,
      "capabilities",
    );
    const slots: Set<number> = new Set<number>();
    const actors: Set<string> = new Set<string>();
    if (formation.heroOverrides.length > AUTOMOVIE_MAX_FORMATION_HEROES)
      validateProductionDesignInvalid(
        diagnostics,
        "design-range-invalid",
        target,
        file,
        `Formation "${id}" promotes ${formation.heroOverrides.length} heroes, above the explicit-node limit ${AUTOMOVIE_MAX_FORMATION_HEROES}. Keep the anonymous crowd instanced.`,
      );
    for (const hero of formation.heroOverrides) {
      if (
        Number.isInteger(hero.slot) === false ||
        hero.slot < 0 ||
        hero.slot >= formation.count
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          `Hero slot ${hero.slot} is outside formation count ${formation.count}. Fix heroOverrides in the tracked formation design record.`,
        );
      if (slots.has(hero.slot))
        validateProductionDesignInvalid(
          diagnostics,
          "design-duplicate-id",
          target,
          file,
          `Hero slot ${hero.slot} is duplicated. Keep each slot once in the tracked formation design record.`,
        );
      slots.add(hero.slot);
      validateProductionDesignText(diagnostics, hero.actor, target, file, "heroOverrides.actor");
      if (actors.has(hero.actor))
        validateProductionDesignInvalid(
          diagnostics,
          "design-duplicate-id",
          target,
          file,
          `Hero actor "${hero.actor}" is assigned to more than one slot. Keep each actor identity once in the tracked formation design record.`,
        );
      actors.add(hero.actor);
    }
  }
}
