import type { IAutoMovieAssetProvenance } from "@automovie/interface";

import { autoMovieExternalLocatorRefusal } from "./contentIdentity";

/**
 * Locate embedded credentials in descriptive asset metadata.
 *
 * The returned field and failure class keep the secret out of diagnostics.
 *
 * @author Samchon
 */
export const assetUrlAdmissionRefusal = (
  asset: IAutoMovieAssetProvenance,
): {
  field: "original" | "license";
  reason: "credential-bearing";
} | null => {
  for (const field of ["original", "license"] as const) {
    const locator = asset[field]?.url;
    if (
      locator !== undefined &&
      autoMovieExternalLocatorRefusal(locator) === "credential-bearing"
    )
      return { field, reason: "credential-bearing" };
  }
  return null;
};
