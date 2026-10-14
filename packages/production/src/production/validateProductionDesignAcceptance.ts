import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignStorySyncCriterion } from "./validateProductionDesignStorySyncCriterion";
import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { validateProductionDesignAcceptanceCriterionAgainstShot } from "./validateProductionDesignAcceptanceCriterionAgainstShot";
import { IAutoMovieDiagnostic, IAutoMovieAcceptanceCriterion, IAutoMovieShotContract } from "@automovie/interface";
import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Check keyed acceptance identity and criterion text, story-sync feasibility, target and frame/event addressability, then finite metric thresholds in original order.
 *
 * @evidence contracts/common.md#principled-implementation Walks schema-admitted acceptance entries in map order, comparing keyed identity and resolving closed target/criterion kinds against current shot and production records. Frame/event membership and story-window feasibility establish addressability, while a criterion declaration cannot discharge observed review evidence.
 * @evidence contracts/common.md#clear-and-simple-design This acceptance pass owns target dispatch and metric finiteness; the shot-address and story-sync helpers own their distinct criterion rules, and the graph coordinator sorts the accumulated findings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States criterion order, target resolution and declaration-versus-observation limits; productionRoot supplies diagnostic addresses and the borrowed diagnostic array receives every finding without record mutation.
 * @evidence contracts/performance.md#efficient-algorithms Acceptance rows perform map lookups and shot frame/event scans; story-sync criteria add all addressed windows and their owning feasibility costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Each criterion borrows the current graph and resolved shot across its target and address checks; story-window and frame/event helpers still perform their actual searches without a cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-entry attribution is temporary unless retained by appended findings; story-sync adds its window/key populations. The caller owns all diagnostic retention without a local count cap, handle or task.
 */
export function validateProductionDesignAcceptance(diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, productionRoot: string): void {
for (const [id, acceptance] of graph.acceptance) {
    const target: string = `acceptance:${id}`;
    const file: string = `${productionRoot}/acceptance/${encodeAutoMoviePathSegment(id)}.json`;
    validateProductionDesignText(diagnostics, acceptance.id, target, file, "id");
    validateProductionDesignText(diagnostics, acceptance.target.id, target, file, "target.id");
    if (acceptance.id !== id)
      validateProductionDesignInvalid(
        diagnostics,
        "design-identity-mismatch",
        target,
        file,
        `Acceptance file identity is "${id}" but value id is "${acceptance.id}". Rewrite it as a tracked acceptance record using one matching id.`,
      );
    const criterion: IAutoMovieAcceptanceCriterion = acceptance.criterion;
    if (criterion.kind !== "metric")
      validateProductionDesignText(
        diagnostics,
        criterion.expectation,
        target,
        file,
        "criterion.expectation",
      );
    if (criterion.kind === "story-sync")
      validateProductionDesignStorySyncCriterion(
        diagnostics,
        graph,
        acceptance,
        criterion,
        target,
        file,
      );
    if (acceptance.target.kind === "shot") {
      const shot: IAutoMovieShotContract | undefined = graph.shots.get(acceptance.target.id);
      if (shot === undefined)
        validateProductionDesignMissing(
          diagnostics,
          target,
          file,
          `shot "${acceptance.target.id}"`,
          `Create or correct the shot contract record for "${acceptance.target.id}" or change ${id}.target`,
        );
      else {
        if (
          (criterion.kind === "frame" || criterion.kind === "event") &&
          criterion.shot !== undefined &&
          criterion.shot !== shot.id
        )
          validateProductionDesignMissing(
            diagnostics,
            target,
            file,
            `criterion shot "${criterion.shot}"`,
            `remove criterion.shot or change it to target shot "${shot.id}"`,
          );
        validateProductionDesignAcceptanceCriterionAgainstShot(
          diagnostics,
          criterion,
          shot,
          target,
          file,
          id,
        );
      }
    } else {
      if (
        graph.production !== null &&
        acceptance.target.id !== graph.production.id
      )
        validateProductionDesignMissing(
          diagnostics,
          target,
          file,
          `film "${acceptance.target.id}"`,
          `change ${id}.target to production "${graph.production.id}"`,
        );
      if (criterion.kind === "frame" || criterion.kind === "event") {
        if (criterion.shot === undefined)
          validateProductionDesignMissing(
            diagnostics,
            target,
            file,
            "criterion shot",
            `set ${id}.criterion.shot so a film-level frame or event is unambiguous`,
          );
        else {
          const shot: IAutoMovieShotContract | undefined = graph.shots.get(criterion.shot);
          if (shot === undefined)
            validateProductionDesignMissing(
              diagnostics,
              target,
              file,
              `criterion shot "${criterion.shot}"`,
              `Create or correct the shot contract record for "${criterion.shot}" or change ${id}.criterion.shot`,
            );
          else
            validateProductionDesignAcceptanceCriterionAgainstShot(
              diagnostics,
              criterion,
              shot,
              target,
              file,
              id,
            );
        }
      }
    }
    if (
      acceptance.criterion.kind === "metric" &&
      Number.isFinite(acceptance.criterion.value) === false
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-range-invalid",
        target,
        file,
        `Metric value must be finite. Fix ${id}.criterion in the tracked acceptance record.`,
      );
  }
}
