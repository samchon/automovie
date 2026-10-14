import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Admit the original runtime segmentation identity shape, nonblank algorithm/version and grapheme literal before locale-neutral or requested-resolved locale handling.
 *
 * @evidence contracts/common.md#principled-implementation Runtime object and member-kind checks precede nonblank algorithm/version and the grapheme literal, then a closed locale-kind dispatch requires requested/resolved text only for that branch. The production gate supplies each profile's metadata; these labels do not prove runtime segmentation equivalence or exact-key admission.
 * @evidence contracts/common.md#clear-and-simple-design This profile-local structural/label gate delegates nonblank text to the shared owner while actual caption segmentation remains outside design admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation Documents early object/locale refusals, the locale-neutral branch and metadata limits; profileId supplies field attribution and all findings append without modifying the supplied identity.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of object fields and text lengths determine work and temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One profile field address is reused across identity/locale checks; no earlier metadata verdict or segmentation runtime is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed-field findings and constructed profile addresses remain in the caller's diagnostic array; object casts borrow the input without cloning or retaining a segmentation engine, handle or task.
 */
export const validateProductionDesignCaptionGraphemeSegmentationIdentity: (diagnostics: IAutoMovieDiagnostic[], value: unknown, profileId: string, target: string, file: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: unknown,
  profileId: string,
  target: string,
  file: string,
): void => {
  const field: string = `captionReadabilityProfiles.${profileId}.segmentation`;
  if (typeof value !== "object" || value === null) {
    validateProductionDesignInvalid(
      diagnostics,
      "design-reference-invalid",
      target,
      file,
      `${field} must carry a complete grapheme segmentation identity. Copy a supported package identity or declare another complete runtime identity.`,
    );
    return;
  }
  const identity: Record<string, unknown> = value as Record<string, unknown>;
  if (typeof identity.algorithm === "string")
    validateProductionDesignText(diagnostics, identity.algorithm, target, file, `${field}.algorithm`);
  else
    validateProductionDesignInvalid(
      diagnostics,
      "design-reference-invalid",
      target,
      file,
      `${field}.algorithm must be non-blank text.`,
    );
  if (typeof identity.version === "string")
    validateProductionDesignText(diagnostics, identity.version, target, file, `${field}.version`);
  else
    validateProductionDesignInvalid(
      diagnostics,
      "design-reference-invalid",
      target,
      file,
      `${field}.version must be non-blank text.`,
    );
  if (identity.granularity !== "grapheme")
    validateProductionDesignInvalid(
      diagnostics,
      "design-reference-invalid",
      target,
      file,
      `${field}.granularity must be "grapheme".`,
    );
  if (typeof identity.locale !== "object" || identity.locale === null) {
    validateProductionDesignInvalid(
      diagnostics,
      "design-reference-invalid",
      target,
      file,
      `${field}.locale must declare requested-resolved or locale-neutral execution.`,
    );
    return;
  }
  const locale: Record<string, unknown> = identity.locale as Record<string, unknown>;
  if (locale.kind === "locale-neutral") return;
  if (locale.kind !== "requested-resolved") {
    validateProductionDesignInvalid(
      diagnostics,
      "design-reference-invalid",
      target,
      file,
      `${field}.locale.kind must be "requested-resolved" or "locale-neutral".`,
    );
    return;
  }
  if (typeof locale.requested === "string")
    validateProductionDesignText(
      diagnostics,
      locale.requested,
      target,
      file,
      `${field}.locale.requested`,
    );
  else
    validateProductionDesignInvalid(
      diagnostics,
      "design-reference-invalid",
      target,
      file,
      `${field}.locale.requested must be non-blank text.`,
    );
  if (typeof locale.resolved === "string")
    validateProductionDesignText(
      diagnostics,
      locale.resolved,
      target,
      file,
      `${field}.locale.resolved`,
    );
  else
    validateProductionDesignInvalid(
      diagnostics,
      "design-reference-invalid",
      target,
      file,
      `${field}.locale.resolved must be non-blank text.`,
    );
};
