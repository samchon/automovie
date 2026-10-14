import { validateProductionDesignFormationDressing } from "./validateProductionDesignFormationDressing";
import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { validateProductionDesignInteger } from "./validateProductionDesignInteger";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { AUTOMOVIE_WORLD_COORDINATE_LIMIT } from "./AUTOMOVIE_WORLD_COORDINATE_LIMIT";
import { IAutoMovieDiagnostic, IAutoMovieFormationDesign, IAutoMovieFormationLayout } from "@automovie/interface";

/**
 * Check original line/column/wedge capacity, spacing or arc/scatter radius fields after dressing admission.
 *
 * @evidence contracts/common.md#principled-implementation After dressing, closed layout dispatch checks finite spacing/radius and integral ranks/files/depth/seed; rank-times-file and squared-depth capacity must cover count, and arc degrees must lie in (0,360]. The formation pass supplies schema-admitted layouts and count admission; these declared limits do not measure member geometry.
 * @evidence contracts/common.md#clear-and-simple-design Closed layout dispatch owns capacity, spacing, radius, arc and scatter-seed policy; optional dressing admission and scalar numeric checks retain their shared owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States dressing-first order, layout-specific capacity and scalar limits; schema-admitted formation input is borrowed, findings append and no slots or geometry are materialized.
 * @evidence contracts/performance.md#efficient-algorithms Each layout selects fixed scalar checks; dressing uses its own fixed chord/spacing operations.
 * @evidence contracts/performance.md#reuse-equivalent-work One borrowed layout supplies dressing and branch-specific scalar/capacity checks; no slot generation or previous layout verdict is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed field labels and appended correction records remain with the caller's diagnostic array; the layout is borrowed and no slot array, handle or task is acquired.
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
