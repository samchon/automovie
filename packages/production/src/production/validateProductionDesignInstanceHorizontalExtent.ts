import { AUTOMOVIE_WORLD_COORDINATE_LIMIT } from "./AUTOMOVIE_WORLD_COORDINATE_LIMIT";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check the retained conservative horizontal radius around the declared anchor against the world coordinate limit.
 *
 * @evidence contracts/common.md#principled-implementation Unrepresentable radius refuses; rotation, vertical reach and realized mesh admission remain with their existing owners.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignInstanceHorizontalExtent owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Fixed finite and absolute-coordinate comparisons take constant work and storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
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
