import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { createAutoMovieContractBindingManifest } from "./createAutoMovieContractBindingManifest";
import { type IAutoMovieContractRule } from "./IAutoMovieContractRule";
import type { IAutoMovieProductionEvidenceDesignBranch } from "./IAutoMovieProductionEvidenceDesignBranch";
import type { IAutoMovieProductionEvidenceDesignOwner } from "./IAutoMovieProductionEvidenceDesignOwner";
import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "./IAutoMovieProductionEvidenceSourceOwnerBinding";
import type { IAutoMovieProductionEvidenceContract } from "./IAutoMovieProductionEvidenceContract";


/**
 * The project-owned authoring identity derived from one evidence declaration.
 *
 * @evidence contracts/common.md#principled-implementation Tracked configuration and its derived manifest define complete package, design, source-owner and local contract observation.
 * @evidence contracts/common.md#clear-and-simple-design One graph-backed DTO retains actual authoring identity without a prose alarm or lexical measurement subsystem.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source digests and contract identity do not certify semantic review or runtime success.
 * @evidence contracts/common.md#meaningful-documentation Members state root, package description fallback, graph authority and selected inventories.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased aggregate type neither opens the project nor retains an observation; readAutoMovieProductionEvidence creates manifests and inventories, shares the supplied configuration, and transfers the resulting arrays and strings to its caller.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionEvidence {

  /** Absolute generated-project root inspected by the reader. */
  root: string;

  /** Package identity from the tracked manifest. */
  packageName: string;

  /** Trimmed package description, or an empty string when absent. */
  description: string;

  /** The exact tracked declaration supplied to lint and this reader. */
  configuration: IAutoMovieEvidenceConfigProps;

  /** Shape-aware binding manifest derived by the evidence factory. */
  manifest: ReturnType<typeof createAutoMovieContractBindingManifest>;

  /** Active design branches, including an exact empty owner population. */
  designBranches: readonly IAutoMovieProductionEvidenceDesignBranch[];

  /** Exact active design owner denominator and its source lineage. */
  designOwners: readonly IAutoMovieProductionEvidenceDesignOwner[];

  /** Exact graph-selected export-to-owner edges available to compilation. */
  sourceOwners: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[];

  /** Exact flat project-local contract inventory. */
  contracts: readonly IAutoMovieProductionEvidenceContract[];

  /** Complete structured local rule inventory, including held and rejected rules. */
  contractRules: readonly IAutoMovieContractRule[];
}
