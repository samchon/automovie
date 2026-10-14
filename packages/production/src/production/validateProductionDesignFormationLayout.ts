import { validateProductionDesignFormationDressing } from "./validateProductionDesignFormationDressing";
import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { validateProductionDesignInteger } from "./validateProductionDesignInteger";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { AUTOMOVIE_WORLD_COORDINATE_LIMIT } from "./AUTOMOVIE_WORLD_COORDINATE_LIMIT";
import { IAutoMovieDiagnostic, IAutoMovieFormationDesign, IAutoMovieFormationLayout } from "@automovie/interface";

/**
 * Check original line/column/wedge capacity, spacing or arc/scatter radius fields after dressing admission.
 *
 * @evidence contracts/common.md#principled-implementation Existing numeric limits and seed policy remain declared production constraints rather than measured member geometry.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignFormationLayout owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Each layout selects fixed scalar checks; dressing uses its own fixed chord/spacing operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignFormationLayout: (diagnostics: IAutoMovieDiagnostic[], formation: IAutoMovieFormationDesign, target: string, file: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  formation: IAutoMovieFormationDesign,
  target: string,
  file: string,
): void => {
  const layout: IAutoMovieFormationLayout = formation.layout;
  validateProductionDesignFormationDressing(diagnostics, formation, target, file);
  if (layout.kind === "line" || layout.kind === "column") {
    validateProductionDesignBounded(
      diagnostics,
      layout.spacing.lateral,
      Number.EPSILON,
      10_000,
      target,
      file,
      "layout.spacing.lateral",
    );
    validateProductionDesignBounded(
      diagnostics,
      layout.spacing.depth,
      Number.EPSILON,
      10_000,
      target,
      file,
      "layout.spacing.depth",
    );
    validateProductionDesignInteger(
      diagnostics,
      layout.ranks,
      1,
      formation.count,
      target,
      file,
      "layout.ranks",
    );
    validateProductionDesignInteger(
      diagnostics,
      layout.files,
      1,
      formation.count,
      target,
      file,
      "layout.files",
    );
    if (layout.ranks * layout.files < formation.count)
      validateProductionDesignInvalid(
        diagnostics,
        "design-range-invalid",
        target,
        file,
        `Layout capacity ${layout.ranks * layout.files} is below count ${formation.count}. Fix layout in the tracked formation design record.`,
      );
  } else if (layout.kind === "wedge") {
    validateProductionDesignBounded(
      diagnostics,
      layout.spacing.lateral,
      Number.EPSILON,
      10_000,
      target,
      file,
      "layout.spacing.lateral",
    );
    validateProductionDesignBounded(
      diagnostics,
      layout.spacing.depth,
      Number.EPSILON,
      10_000,
      target,
      file,
      "layout.spacing.depth",
    );
    validateProductionDesignInteger(
      diagnostics,
      layout.depth,
      1,
      formation.count,
      target,
      file,
      "layout.depth",
    );
    if (layout.depth * layout.depth < formation.count)
      validateProductionDesignInvalid(
        diagnostics,
        "design-range-invalid",
        target,
        file,
        `Wedge depth ${layout.depth} materializes ${layout.depth * layout.depth} slots, below count ${formation.count}. Increase layout.depth in the tracked formation design record.`,
      );
  } else {
    validateProductionDesignBounded(
      diagnostics,
      layout.radius,
      Number.EPSILON,
      AUTOMOVIE_WORLD_COORDINATE_LIMIT,
      target,
      file,
      "layout.radius",
    );
    if (
      layout.kind === "arc" &&
      (Number.isFinite(layout.arcDegrees) === false ||
        layout.arcDegrees <= 0 ||
        layout.arcDegrees > 360)
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-range-invalid",
        target,
        file,
        `Arc degrees must be above 0 and at most 360. Fix layout in the tracked formation design record.`,
      );
    if (layout.kind === "scatter")
      validateProductionDesignInteger(
        diagnostics,
        layout.seed,
        0,
        Number.MAX_SAFE_INTEGER,
        target,
        file,
        "layout.seed",
      );
  }
};
