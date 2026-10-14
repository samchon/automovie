import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { AutoMoviePopulationScope } from "./AutoMoviePopulationScope";
import type { AutoMovieProductionContractLayer } from "./AutoMovieProductionContractLayer";
import type { AutoMovieProductionContractPass } from "./AutoMovieProductionContractPass";
import type { ITtscEvidenceGraphClaim } from "@ttsc/evidence";

/**
 * Additive graph claim retaining its project-specific binding identity.
 *
 * @evidence contracts/common.md#principled-implementation A native Markdown claim carries layer, pass, scope, stage and optional aggregate account identity for local admission.
 * @evidence contracts/common.md#clear-and-simple-design The additive metadata is validated and removed before native evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Binding metadata cannot replace the shared graph or establish evidence validity by itself.
 * @evidence contracts/common.md#meaningful-documentation Disposition distinguishes binding from explicitly inapplicable pilot audit entries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; local claim constructors allocate records and validateAutoMovieLocalContractClaims reconstructs their bindings, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; local claim constructors allocate records and validateAutoMovieLocalContractClaims reconstructs their bindings, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; local claim constructors allocate records and validateAutoMovieLocalContractClaims reconstructs their bindings, while the caller or module owns the lifetime of its values.
 *
 * @author Samchon
 */
export type AutoMovieProductionContractClaim = Extract<ITtscEvidenceGraphClaim, { type: "markdown" }> & {
  /** AutoMovie identity validated and removed before native graph evaluation. */
  autoMovieBinding: {
    /** Authored layer that owns the host population. */
    layer: AutoMovieProductionContractLayer;

    /** Construction hosts or audience-language final screenplay hosts. */
    pass: AutoMovieProductionContractPass;

    /** Exact population in which this declaration was made. */
    populationScope: AutoMoviePopulationScope;

    /** Exact owning layer stage in which this declaration was made. */
    stage: AutoMovieEvidenceStage;

    /** Positive binding or explicit pilot-only negative audit entry. */
    disposition: "binding" | "inapplicable";

    /** Reserved aggregate host for an authored obligation, relative to docs. */
    account?: string;
  };
};
