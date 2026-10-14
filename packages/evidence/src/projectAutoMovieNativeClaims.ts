import type { ITtscEvidenceGraphClaim } from "@ttsc/evidence";
import type { AutoMovieProductionContractClaim } from "./AutoMovieProductionContractClaim";
import { projectAutoMovieNativeReferences } from "./projectAutoMovieNativeReferences";
import { projectAutoMovieNativeReference } from "./projectAutoMovieNativeReference";


/**
 * Project admitted local claims into the native evaluator's input schema.
 *
 * The factory validates ownership first. Manifest readers retain the original declaration. Projection removes AutoMovie binding metadata and disables native companion-review requirements on every reference. All populations, activation, severity, exclusion rules and cardinality remain unchanged.
 *
 *
 * @evidence contracts/common.md#principled-implementation Each admitted claim is shallow-copied, AutoMovie binding metadata is removed and every native reference receives requireReview:false.
 * @evidence contracts/common.md#clear-and-simple-design Manifest ownership retains the original declaration while this boundary supplies only native evaluator schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Host populations, activation, severity, cardinality and exclusion policy remain unchanged; companion review removal is the explicit product policy.
 * @evidence contracts/common.md#meaningful-documentation The comment states ownership validation precedes projection and lists the fields whose semantics are preserved.
 * @evidence contracts/performance.md#efficient-algorithms For C claims and R references with K total enumerable own fields, shallow copying takes O(C+R+K) field operations and added slots. Each claim is copied twice; nested selector arrays remain shared unchanged and caller extensions contribute to K.
 * @evidence contracts/performance.md#reuse-equivalent-work One scalar or array projection helper defines the reference policy for all claim shapes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New claim/reference records transfer to the native graph owner; original declarations and their selector arrays stay caller-owned.
 */
export const projectAutoMovieNativeClaims: (claims: readonly (ITtscEvidenceGraphClaim | AutoMovieProductionContractClaim)[]) => ITtscEvidenceGraphClaim[] = (
  claims: readonly (
    | ITtscEvidenceGraphClaim
    | AutoMovieProductionContractClaim
  )[],
): ITtscEvidenceGraphClaim[] =>
  claims.map((claim: ITtscEvidenceGraphClaim | AutoMovieProductionContractClaim) : ITtscEvidenceGraphClaim => {
    const native: ITtscEvidenceGraphClaim | AutoMovieProductionContractClaim = { ...claim };
    Reflect.deleteProperty(native, "autoMovieBinding");
    return {
      ...native,
      reference: Array.isArray(claim.reference)
        ? projectAutoMovieNativeReferences(claim.reference)
        : projectAutoMovieNativeReference(claim.reference),
    };
  });
