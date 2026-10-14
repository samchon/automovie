import { AUTOMOVIE_WORLD_COORDINATE_LIMIT } from "./AUTOMOVIE_WORLD_COORDINATE_LIMIT";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check the retained conservative horizontal radius around the declared anchor against the world coordinate limit.
 *
 * @evidence contracts/common.md#principled-implementation Absolute X/Z anchor coordinates plus a conservative radial reach must not exceed the symmetric metre world limit; equality remains allowed and nonfinite radius refuses. The layout caller supplies finite admitted anchors and nonnegative radius estimates; rotation, vertical reach and model geometry remain outside this check.
 * @evidence contracts/common.md#clear-and-simple-design Grid, scatter, lattice and explicit placement share the horizontal envelope rule while each layout computes its own radius.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States conservative metre reach and anchor/radius premises; layout labels one appended finding and the void result neither transforms a point nor proves realized mesh containment.
 * @evidence contracts/performance.md#efficient-algorithms Fixed finite and absolute-coordinate comparisons take constant work and storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current anchor and radius are compared directly; no cached envelope or pending operation is coordinated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one finding retains layout attribution/correction in the caller's array; the anchor remains borrowed and no geometry population, handle or task is acquired.
 */
export const validateProductionDesignInstanceHorizontalExtent: (diagnostics: IAutoMovieDiagnostic[], anchor: { x: number; z: number; }, radius: number, target: string, file: string, layout: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  anchor: { x: number; z: number },
  radius: number,
  target: string,
  file: string,
  layout: string,
): void => {
  if (
    Number.isFinite(radius) === false ||
    Math.abs(anchor.x) + radius > AUTOMOVIE_WORLD_COORDINATE_LIMIT ||
    Math.abs(anchor.z) + radius > AUTOMOVIE_WORLD_COORDINATE_LIMIT
  )
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      target,
      file,
      `Instance ${layout} derives coordinates beyond the supported world limit. Reduce its extent or move its anchor inward.`,
    );
};
