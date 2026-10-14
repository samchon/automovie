import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignDressedInterval } from "./validateProductionDesignDressedInterval";
import { IAutoMovieDiagnostic, IAutoMovieFormationDesign, IAutoMovieFormationLayout } from "@automovie/interface";

/**
 * Read existing optional dressing after the layout kind, admit its metre bounds and require twice each spacing tolerance or the arc's narrower tolerance to stay below its neighbour interval.
 *
 * @evidence contracts/common.md#principled-implementation Scatter and absent dressing return unchanged. One arc member has no finite neighbour interval; no placement or body-clearance proof follows.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignFormationDressing owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Fixed layout fields and one arc chord calculation take constant work and storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
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
