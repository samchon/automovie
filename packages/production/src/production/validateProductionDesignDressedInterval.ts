import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Append the original refusal when twice a metre tolerance reaches its declared spacing.
 *
 * @evidence contracts/common.md#principled-implementation Two independently displaced neighbours can consume twice the declared metre tolerance, so 2*tolerance reaching spacing appends a range refusal, including equality. Formation dressing separately validates the scalar ranges; this represented-number comparison alone does not reject every nonfinite input or prove body clearance.
 * @evidence contracts/common.md#clear-and-simple-design Line, column and wedge dressing share this one-axis interval relation; layout selection and tolerance bounds remain with the formation owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States metre units, twice-tolerance boundary and independent range-admission premise; the axis labels one appended correction and both supplied scalars remain unchanged.
 * @evidence contracts/performance.md#efficient-algorithms One scalar comparison and optional diagnostic construction take constant work plus message length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current tolerance and spacing are compared directly; this scalar relation coordinates no cached or pending operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one finding retains the constructed metre/axis correction in the caller's array; no layout population, handle or task is retained here.
 */
export const validateProductionDesignDressedInterval: (diagnostics: IAutoMovieDiagnostic[], tolerance: number, spacing: number, axis: string, target: string, file: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  tolerance: number,
  spacing: number,
  axis: string,
  target: string,
  file: string,
): void => {
  if (2 * tolerance >= spacing)
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      target,
      file,
      `Dressing tolerance ${tolerance} m reaches half the ${spacing} m ${axis} interval it perturbs, so two neighbouring members can stand in one place. Keep twice layout.dressing.${axis} below layout.spacing.${axis} in the tracked formation design record.`,
    );
};
