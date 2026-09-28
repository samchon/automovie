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
 *
 * @evidence requirements/production-evidence/native-input.md#agent-production-evidence-native-boundary Preserves the authored declaration and structural relationships while preventing extensions from reinstating companion-review requirements.
 * @evidence specifications/production-evidence/native-input.md#spec-authoring-production-evidence-native-boundary Copies admitted claims, removes AutoMovie ownership metadata and emits every reference without a native review requirement.
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
 *
 * @evidence requirements/production-evidence/native-input.md#agent-production-evidence-native-boundary Prevents any admitted reference from imposing evidenceReview or fingerprint authoring while preserving its selectors and cardinality.
 * @evidence specifications/production-evidence/native-input.md#spec-authoring-production-evidence-native-boundary Copies one native reference and sets only requireReview to false.
 */
export const projectAutoMovieNativeReference = (
  reference: ITtscEvidenceGraphReference,
): ITtscEvidenceGraphReference => ({ ...reference, requireReview: false });

/**
 * Apply the native companion policy in the declared reference order.
 *
 * @evidence requirements/production-evidence/native-input.md#agent-production-evidence-native-boundary Keeps every additive relationship in its original order without companion-review requirements.
 * @evidence specifications/production-evidence/native-input.md#spec-authoring-production-evidence-native-boundary Projects every reference independently and preserves an empty reference inventory.
 */
export const projectAutoMovieNativeReferences = (
  references: readonly ITtscEvidenceGraphReference[],
): ITtscEvidenceGraphReference[] =>
  references.map(projectAutoMovieNativeReference);
