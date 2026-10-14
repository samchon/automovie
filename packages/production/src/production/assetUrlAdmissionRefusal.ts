import type { IAutoMovieAssetProvenance } from "@automovie/interface";

import { autoMovieExternalLocatorRefusal } from "./contentIdentity";

/**
 * Locate embedded credentials in optional source and license metadata.
 *
 * Non-URL descriptions remain allowed. A refusal returns the field and class
 * rather than the locator, so callers can report the defect without its secret.
 * Generated acquisition facts belong to their separate provenance gate.
 *
 * @evidence contracts/common.md#principled-implementation The shared external-locator parser recognizes URL userinfo in the two descriptive locations; the typed asset supplies strings and absent metadata introduces no locator to inspect.
 * @evidence contracts/common.md#clear-and-simple-design This credential-only boundary returns a small refusal, while callers own diagnostic wording and the generation gate owns reproducibility and byte identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No provider or local asset is special-cased, and secret locator text never enters the returned refusal. Non-URL descriptions remain accepted by the metadata contract.
 * @evidence contracts/common.md#meaningful-documentation States optional metadata behavior, credential-only policy, returned secret-free field identity and separate generation admission.
 * @evidence contracts/performance.md#efficient-algorithms Two optional locations are scanned once; URL parsing takes time and transient storage proportional to their total text length and returns at most one fixed-size refusal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each asset's current metadata is inspected once and no credential verdict is cached across edits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources URL parser objects are call-local and only the field/class result transfers to the caller; no secret string, handle or task is retained privately.
 */
export function assetUrlAdmissionRefusal(
  asset: IAutoMovieAssetProvenance,
): { field: "original" | "license"; reason: "credential-bearing" } | null {
  for (const field of ["original", "license"] as const) {
    const locator: string | undefined = asset[field]?.url;
    if (locator !== undefined && autoMovieExternalLocatorRefusal(locator) === "credential-bearing")
      return { field, reason: "credential-bearing" };
  }
  return null;
}
