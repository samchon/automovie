import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignDressedInterval } from "./validateProductionDesignDressedInterval";
import { IAutoMovieDiagnostic, IAutoMovieFormationDesign, IAutoMovieFormationLayout } from "@automovie/interface";

/**
 * Read existing optional dressing after the layout kind, admit its metre bounds and require twice each spacing tolerance or the arc's narrower tolerance to stay below its neighbour interval.
 *
 * @evidence contracts/common.md#principled-implementation Scatter and absent dressing return unchanged; other layouts first check lateral/depth metre bounds. Arc uses the represented neighbour chord and twice the narrower tolerance, while straight layouts check each spacing against twice its axis tolerance. Schema-admitted layout/count and separate layout-range checks remain premises; one arc member has infinite neighbour interval and no body-clearance proof follows.
 * @evidence contracts/common.md#clear-and-simple-design The layout gate delegates optional dressing here; scalar bounds and straight-axis neighbour intervals use shared helpers while this owner computes the arc chord relation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation Defines absent/scatter skips, metre tolerance bounds, one-member arc behavior and the narrower-tolerance arc test; findings append to the borrowed array without producing placement or a clearance certificate.
 * @evidence contracts/performance.md#efficient-algorithms Fixed layout fields and one arc chord calculation take constant work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One borrowed layout/dressing pair supplies scalar and neighbour checks; the chord is computed once for an arc and no placement result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fixed scalar/label temporaries are local; appended range/interval findings transfer to the caller-owned array without retaining a member population, handle or task.
 */
export const validateProductionDesignFormationDressing: (diagnostics: IAutoMovieDiagnostic[], formation: IAutoMovieFormationDesign, target: string, file: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  formation: IAutoMovieFormationDesign,
  target: string,
  file: string,
): void => {
  const layout: IAutoMovieFormationLayout = formation.layout;
  if (layout.kind === "scatter") return;
  const dressing: { lateral: number; depth: number } | undefined = layout.dressing;
  if (dressing === undefined) return;
  validateProductionDesignBounded(
    diagnostics,
    dressing.lateral,
    0,
    10_000,
    target,
    file,
    "layout.dressing.lateral",
  );
  validateProductionDesignBounded(
    diagnostics,
    dressing.depth,
    0,
    10_000,
    target,
    file,
    "layout.dressing.depth",
  );
  if (layout.kind === "arc") {
    // An arc of one member has no neighbour, so there is no interval to keep
    // and no divisor to take. Every comparison against an unreachable chord is
    // false, which is how that case declines without a rule of its own.
    const chord: number =
      formation.count < 2
        ? Number.POSITIVE_INFINITY
        : 2 *
          layout.radius *
          Math.sin(
            (layout.arcDegrees * Math.PI) / 180 / (2 * (formation.count - 1)),
          );
    if (2 * Math.min(dressing.lateral, dressing.depth) >= chord)
      validateProductionDesignInvalid(
        diagnostics,
        "design-range-invalid",
        target,
        file,
        `Dressing can move two neighbouring members of this arc onto one another, because twice its narrower tolerance reaches the whole chord between adjacent slots whichever way that chord runs. Reduce layout.dressing, or widen layout.radius or layout.arcDegrees, in the tracked formation design record.`,
      );
    return;
  }
  validateProductionDesignDressedInterval(
    diagnostics,
    dressing.lateral,
    layout.spacing.lateral,
    "lateral",
    target,
    file,
  );
  validateProductionDesignDressedInterval(
    diagnostics,
    dressing.depth,
    layout.spacing.depth,
    "depth",
    target,
    file,
  );
};
