import type { AutoMovieContractDomain } from "./AutoMovieContractDomain";
import type { AutoMovieContractFamily } from "./AutoMovieContractFamily";
import type { AutoMovieContractRelationship } from "./AutoMovieContractRelationship";
import type { AutoMovieEvidenceBranch } from "./AutoMovieEvidenceBranch";
import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { AutoMoviePopulationScope } from "./AutoMoviePopulationScope";
import type { AutoMovieProductionKind } from "./AutoMovieProductionKind";
import type { AutoMovieProductionLanguage } from "./AutoMovieProductionLanguage";
import type { IAutoMovieEvidenceTopologyBranch } from "./IAutoMovieEvidenceTopologyBranch";
import type { IAutoMovieEvidenceTopologyDeclaration } from "./IAutoMovieEvidenceTopologyDeclaration";
import type { IAutoMovieEvidenceTopologyDiagnostic } from "./IAutoMovieEvidenceTopologyDiagnostic";
import type { IAutoMovieEvidenceTopologyEdge } from "./IAutoMovieEvidenceTopologyEdge";
import type { IAutoMovieLocalContractProjection } from "./IAutoMovieLocalContractProjection";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";

/**
 * The common-contract routes selected by one production declaration.
 *
 * Every active branch is present even while it is still in draft. `enforced` distinguishes relationships that lint already checks from the complete set the branch will owe at evidence and review. Contract paths are logical domain paths, independent of the package's current physical layout.
 *
 * @evidence contracts/common.md#principled-implementation A manifest represents admitted active branch stages, shared or population routes, local audits and dependency topology.
 * @evidence contracts/common.md#clear-and-simple-design Native claims remain the enforcement surface while this record exposes their selected relationships to inspection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Read-only array types do not promise deep runtime freezing or receipt-backed review approval.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish logical contract paths, population selectors, current enforcement and optional native reference overrides.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; createAutoMovieContractBindingManifest allocates branch and route arrays for its inspection caller, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; createAutoMovieContractBindingManifest allocates branch and route arrays for its inspection caller, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; createAutoMovieContractBindingManifest allocates branch and route arrays for its inspection caller, while the caller or module owns the lifetime of its values.
 */
export interface IAutoMovieContractBindingManifest {
  /** Selected production shape, or null before any branch can be active. */
  kind: AutoMovieProductionKind | null;

  /** Exact project-local language module shipped with this production. */
  language: AutoMovieProductionLanguage;

  /** Exact authored population selected by the project declaration. */
  populationScope: AutoMoviePopulationScope;

  /** Active authored and source branches in deterministic factory order. */
  branches: readonly {
    /** Current graph branch identity. */
    name: AutoMovieEvidenceBranch;
    /** Declared lifecycle stage of the owning branch. */
    stage: AutoMovieEvidenceStage;
  }[];

  /** Every relationship selected for those branches. */
  bindings: readonly {
    /** Authored or source branch that owns this relationship. */
    branch: AutoMovieEvidenceBranch;
    /** Declared lifecycle stage of the owning branch. */
    stage: AutoMovieEvidenceStage;

    /** Whether the current lifecycle stage already enables this claim. */
    enforced: boolean;

    /** Stable graph diagnostic that owns the host population. */
    claim: string;
    /** Manifest classification of native host-to-target cardinality. */
    relationship: AutoMovieContractRelationship;

    /** Native reference override; absence inherits the graph's error level. */
    severity?: ITtscEvidenceGraphReference["severity"];

    /** Whether this reference currently asks for native review freshness. */
    requireReview?: boolean;
    /** The branch-owned native declaration population. */
    host: {
      /** Native population kind, or the manifest's contract-versus-population target discriminator. */
      type: "markdown" | "typescript";
      /** Configuration-relative population root used by native evaluation. */
      root: string;
      /** Ordered population selectors copied into this manifest. */
      files: readonly string[];
      /** Selected native address levels copied as an array. */
      symbols: readonly string[];
    };
    /** Logical bundled contract route or independently addressed population. */
    target:
      | {
          /** Native population kind, or the manifest's contract-versus-population target discriminator. */
          type: "contract";
          /** Duty family used to resolve the bundled route. */
          family: AutoMovieContractFamily;
          /** Semantic domain associated with the contract inventory entry. */
          domain: AutoMovieContractDomain;

          /** Logical family/domain path, not a legacy flat package address. */
          path: string;
          /** Contract H2 target identities in canonical order. */
          anchors: readonly string[];
        }
      | {
          /** Native population kind, or the manifest's contract-versus-population target discriminator. */
          type: "population";
          /** Configuration-relative population root used by native evaluation. */
          root: string;
          /** Ordered population selectors copied into this manifest. */
          files: readonly string[];
          /** Selected native address levels copied as an array. */
          symbols: readonly string[];
        };
  }[];

  /** Positive production-local contract bindings retained with their layer. */
  localBindings: readonly IAutoMovieLocalContractProjection[];

  /** Explicit inapplicable local-contract declarations retained for audit only. */
  localAudits: readonly IAutoMovieLocalContractProjection[];

  /** Canonical provider-consumer matrix and its deterministic audit. */
  topology: {
    /** Current active provider and consumer identities used by the topology audit. */
    branches: readonly IAutoMovieEvidenceTopologyBranch[];
    /** Canonical provider-consumer dependencies, including simultaneous pairs. */
    expected: readonly IAutoMovieEvidenceTopologyEdge[];
    /** Factory-derived uses or inapplicable decisions for the selected branches. */
    declarations: readonly IAutoMovieEvidenceTopologyDeclaration[];
    /** Deterministic dependency audit results for this selected topology. */
    diagnostics: readonly IAutoMovieEvidenceTopologyDiagnostic[];
  };
}
