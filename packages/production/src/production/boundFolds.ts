
import { IAutoMovieProductionShotProgram, IAutoMovieShotSourceOutput } from "@automovie/interface";

/**
 * Copy nonempty authored building-fold and design-lineage lists into compiled shot output.
 *
 * The fixed supported key list preserves field order, skips absent/empty arrays and structured-clones each retained list. Caller data remains separate from the compiled result; clone failures propagate and this carrier performs no independent domain validation.
 *
 * @evidence contracts/common.md#principled-implementation Explicit authorable fields connect validated shot-program folds to the compiled representation consumed downstream. Shot assembly supplies the admitted program; structuredClone preserves supported data graphs without adding a rendering or semantic-admission guarantee.
 * @evidence contracts/common.md#clear-and-simple-design One carrier projection keeps optional fold transfer separate from engine validation and shot-source assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty optional lists are intentionally omitted, not interpreted as failed admission. The supported field inventory is a product mapping, and no fixture, image output or foreign field is copied as a hidden override.
 * @evidence contracts/common.md#meaningful-documentation Documents supported optional-list transfer, omitted empties, detached clone ownership and propagated clone failures.
 * @evidence contracts/performance.md#efficient-algorithms The fixed key scan is bounded but cloning traverses and allocates the complete retained data graphs, including geometry/arrays and shared-reference handling. Work and result bytes grow with authored fold content, without a cap here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each retained list is cloned once per compilation; changed program ownership requires a fresh transfer and no cross-attempt clone cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the detached cloned records until compiled output is released; input records remain borrowed during cloning. No handle, decoder or task is acquired.
 */
export function boundFolds(
  program: IAutoMovieProductionShotProgram
): Partial<IAutoMovieShotSourceOutput> {
  const carried: Record<string, unknown> = {};
  for (const key of [
    "designReferences",
    "designEvidence",
    "designLineages",
    "fluidDomains",
    "waterFeatures",
    "softBodyDomains",
    "softFurnishings",
    "plantingDomains",
    "plantingClusters",
    "plantingInstallations",
    "serviceNetworks",
  ] as const) {
    const records: IAutoMovieProductionShotProgram[typeof key] = program[key];
    if (records === undefined || records.length === 0) continue;
    carried[key] = structuredClone(records);
  }
  return carried as Partial<IAutoMovieShotSourceOutput>;
}
