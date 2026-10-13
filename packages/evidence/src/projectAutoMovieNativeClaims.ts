import type {
  ITtscEvidenceGraphClaim,
  ITtscEvidenceGraphReference,
} from "@ttsc/evidence";

import type { AutoMovieProductionContractClaim } from "./createAutoMovieProductionContractClaim";

/**
 * Project admitted local claims into the native evaluator's input schema.
 *
 * The factory validates ownership first. Manifest readers retain the original
 * declaration. Projection removes AutoMovie binding metadata and disables
 * native companion-review requirements on every reference. All populations,
 * activation, severity, exclusion rules and cardinality remain unchanged.
 */
export const projectAutoMovieNativeClaims = (
  claims: readonly (
    | ITtscEvidenceGraphClaim
    | AutoMovieProductionContractClaim
  )[],
): ITtscEvidenceGraphClaim[] =>
  claims.map((claim) => {
    const native = { ...claim };
    Reflect.deleteProperty(native, "autoMovieBinding");
    return {
      ...native,
      reference: Array.isArray(claim.reference)
        ? projectAutoMovieNativeReferences(claim.reference)
        : projectAutoMovieNativeReference(claim.reference),
    };
  });

/**
 * Preserve a native reference's structural policy without companion rows.
 *
 * File-parentage and native claim projection share this boundary, including
 * caller-authored extensions. A new record protects the original declaration.
 */
export const projectAutoMovieNativeReference = (
  reference: ITtscEvidenceGraphReference,
): ITtscEvidenceGraphReference => ({ ...reference, requireReview: false });

/** Apply the native companion policy in the declared reference order. */
export const projectAutoMovieNativeReferences = (
  references: readonly ITtscEvidenceGraphReference[],
): ITtscEvidenceGraphReference[] =>
  references.map(projectAutoMovieNativeReference);
