import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignVector } from "./validateProductionDesignVector";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { validateProductionDesignFinite } from "./validateProductionDesignFinite";
import { IAutoMovieDiagnostic, IAutoMovieShotPredicate, IAutoMovieWorldLandmark } from "@automovie/interface";

/**
 * Require a nonempty predicate list, finite values and nonnegative tolerance, then check actor or point/formation/landmark selector fields.
 *
 * @evidence contracts/common.md#principled-implementation The local selector retains current graph reference lookups and never evaluates the predicate on emitted source.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignPredicates owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Predicate work includes declared world-landmark searches and fixed selector checks; no scene or runtime task is built.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignPredicates: (diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, predicates: readonly IAutoMovieShotPredicate[], target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  graph: IAutoMovieProductionDesignGraph,
  predicates: readonly IAutoMovieShotPredicate[],
  target: string,
  file: string,
  field: string,
): void => {
  if (predicates.length === 0)
    validateProductionDesignInvalid(
      diagnostics,
      "design-collection-empty",
      target,
      file,
      `${field} must contain at least one machine-checkable predicate. Descriptive prose cannot prove compiled realization.`,
    );
  /** Check actor or scene selector address fields without resolving a runtime object. */
  const selector: (value: Extract<IAutoMovieShotPredicate, { kind: "position"; }>["subject"] | Extract<IAutoMovieShotPredicate, { kind: "distance"; }>["from"], path: string) => void = (
    value:
      | Extract<IAutoMovieShotPredicate, { kind: "position" }>["subject"]
      | Extract<IAutoMovieShotPredicate, { kind: "distance" }>["from"],
    path: string,
  ): void => {
    if (value.kind === "point")
      validateProductionDesignVector(diagnostics, value.position, target, file, path);
    else {
      validateProductionDesignText(diagnostics, value.id, target, file, `${path}.id`);
      if (
        value.kind === "formation" &&
        graph.formations.has(value.id) === false
      )
        validateProductionDesignMissing(
          diagnostics,
          target,
          file,
          `formation "${value.id}"`,
          `Create or correct the formation design record for "${value.id}" or correct ${path}`,
        );
      if (
        value.kind === "landmark" &&
        graph.world?.landmarks.some((landmark: IAutoMovieWorldLandmark): boolean => landmark.id === value.id) !==
          true
      )
        validateProductionDesignMissing(
          diagnostics,
          target,
          file,
          `landmark "${value.id}"`,
          `add that landmark to the tracked world design record or correct ${path}`,
        );
    }
  };
  for (const predicate of predicates) {
    validateProductionDesignFinite(diagnostics, predicate.value, target, file, `${field}.value`);
    if (
      Number.isFinite(predicate.tolerance) === false ||
      predicate.tolerance < 0
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-range-invalid",
        target,
        file,
        `${field}.tolerance must be a finite non-negative value. Correct the predicate.`,
      );
    if (predicate.kind === "joint-angle")
      validateProductionDesignText(diagnostics, predicate.actor, target, file, `${field}.actor`);
    else if (predicate.kind === "position")
      selector(predicate.subject, `${field}.subject`);
    else {
      selector(predicate.from, `${field}.from`);
      selector(predicate.to, `${field}.to`);
    }
  }
};
