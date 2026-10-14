import { IAutoMovieRepaintGeneratorProvenance } from "@automovie/interface";
import { autoMovieExternalLocatorRefusal, canonicalizeAutoMovieJson } from "./contentIdentity";
import { productionRepaintIdentityHasExactKeys } from "./productionRepaintIdentityHasExactKeys";
import { productionRepaintIdentityIsNonBlank } from "./productionRepaintIdentityIsNonBlank";

/**
 * Admit a declared cost basis and reasoned repaint consumer before canonicalizing their provenance.
 *
 * Optional source, license and termsCheckedAt values must be strings and cannot contain locator-detected credentials. Empty optional text and non-date termsCheckedAt text remain accepted descriptive metadata. This operation checks neither license terms nor the truth of the stated cost or consumer reason.
 *
 * @evidence contracts/common.md#principled-implementation Exact required/optional keys, trimmed cost/reason and the repaint consumer kind establish the descriptive record; supplied metadata strings pass the existing credential-bearing locator predicate before canonical JSON.
 * @evidence contracts/common.md#clear-and-simple-design Provenance admission owns descriptive context while runtime identity and actual request/provider execution remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hidden enumerable fields and credential-bearing optional locators refuse; optional dates, license rights, cost truth and an actual app consumer are not independently verified here.
 * @evidence contracts/common.md#meaningful-documentation Prose states optional-string meaning, exact consumer vocabulary and the limits of metadata admission rather than promising terms review.
 * @evidence contracts/performance.md#efficient-algorithms Fixed metadata-field visits include locator scans proportional to their text; key admission and complete canonicalization include actual supplied key/text populations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This descriptive validator owns no cross-request coordinator or cache; changed provenance is canonicalized from its current fields.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Locator/key temporaries and canonical traversal state remain local; the caller receives one string without network, file or provider resources.
 */
export const canonicalAutoMovieRepaintGeneratorProvenance: (provenance: IAutoMovieRepaintGeneratorProvenance) => string = (
  provenance: IAutoMovieRepaintGeneratorProvenance,
): string => {
  if (
    productionRepaintIdentityHasExactKeys(
      provenance,
      ["cost", "consumer"],
      ["source", "license", "termsCheckedAt"],
    ) === false ||
    ["source", "license", "termsCheckedAt"].some((field: string): boolean => {
      const value: string | undefined =
        provenance[field as "source" | "license" | "termsCheckedAt"];
      return (
        value !== undefined &&
        (typeof value !== "string" ||
          autoMovieExternalLocatorRefusal(value) === "credential-bearing")
      );
    }) ||
    productionRepaintIdentityIsNonBlank(provenance.cost) === false ||
    productionRepaintIdentityHasExactKeys(provenance.consumer, ["kind", "reason"]) === false ||
    provenance.consumer.kind !== "repaint" ||
    productionRepaintIdentityIsNonBlank(provenance.consumer.reason) === false
  )
    throw new Error(
      "Repaint generator context requires a cost basis and reasoned repaint consumer; supplied descriptive metadata must be strings without credentials.",
    );
  return canonicalizeAutoMovieJson(provenance);
};
