import type { IAutoMovieProductionEvidence, IAutoMovieProductionEvidenceDesignBranch, IAutoMovieProductionEvidenceDesignOwner, IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import { AUTOMOVIE_LIBRARY_AUTHORING_SNAPSHOT_PROTOCOL } from "./AUTOMOVIE_LIBRARY_AUTHORING_SNAPSHOT_PROTOCOL";
import type { IAutoMovieLibraryAuthoringSourceSnapshot } from "./IAutoMovieLibraryAuthoringSourceSnapshot";

/**
 * Resident graph and source identity acquired by one sequential capture attempt.
 *
 * @evidence contracts/common.md#principled-implementation Version/protocol, resident root, complete selected graph/configuration populations and source identities define the resident digest domain.
 * @evidence contracts/common.md#clear-and-simple-design Capture serves publication identity; the separate portable projection excludes root, location and resident digest for result hashing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readonly arrays are compile-time views, copied source edges contain scalar declared fields, and path equality does not pin physical roots.
 * @evidence contracts/common.md#meaningful-documentation Documents resident versus portable identity, canonical populations and non-frozen ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased resident identity selects no acquisition strategy; captureAutoMovieLibraryAuthoringSnapshot owns source reads, selected graph copies, ordering and canonical hashing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The snapshot coordinates no cross-attempt cache; publication compares independently acquired resident digests and portable result hashing is separately projected.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no graph lifetime; capture transfers its copied records/arrays and cloned configuration/manifest to the attempt caller without runtime freezing.
 * @author Samchon
 */
export interface IAutoMovieLibraryAuthoringSnapshot {

    /**
     * Snapshot schema version.
     */
    version: 1;

    /**
     * Protocol that gives the snapshot identity its meaning.
     */
    protocol: typeof AUTOMOVIE_LIBRARY_AUTHORING_SNAPSHOT_PROTOCOL;

    /**
     * Absolute normalized builder project root. The publication guard compares it; result identity never includes it.
     */
    root: string;

    /**
     * Package identity observed with the authoring graph.
     */
    packageName: string;

    /**
     * Graph-selected production kind.
     */
    kind: "library";

    /**
     * Complete graph configuration in effect for the attempt.
     */
    configuration: IAutoMovieProductionEvidence["configuration"];

    /**
     * Selected production manifest.
     */
    manifest: IAutoMovieProductionEvidence["manifest"];

    /**
     * Complete canonical design-branch population.
     */
    designBranches: readonly IAutoMovieProductionEvidenceDesignBranch[];

    /**
     * Complete canonical design-owner population.
     */
    designOwners: readonly IAutoMovieProductionEvidenceDesignOwner[];

    /**
     * Complete canonical population of enforced source-owner edges selected for this attempt.
     */
    sourceOwners: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[];

    /**
     * Normalized bytes identity of every selected source member.
     */
    sources: readonly IAutoMovieLibraryAuthoringSourceSnapshot[];

    /**
     * Canonical digest of the complete resident snapshot, including `root` and the absolute `configuration.location`. Only the publication guard compares it; result identity binds the portable projection that omits both.
     */
    digest: string;
}
