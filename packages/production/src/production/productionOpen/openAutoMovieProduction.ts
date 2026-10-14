import type { IAutoMovieProductionServices } from "../IAutoMovieProductionServices";
import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import { AutoMovieProductionFrameCapture } from "@automovie/interface";
import { AutoMovieProductionBuilder } from "../AutoMovieProductionBuilder";
import { AutoMovieProductionOracleService } from "../AutoMovieProductionOracleService";
import { AutoMovieProductionProject } from "../AutoMovieProductionProject";
import { createAutoMovieProductionSourceStatus } from "../createAutoMovieProductionSourceStatus";
import type { AutoMovieModelArchetypeRegistry } from "../productionArchetypes";
import { resolveAutoMovieTimedAuthoringKind } from "../resolveAutoMovieTimedAuthoringKind";
import { findAutoMovieProjectRoot } from "./findAutoMovieProjectRoot";

/**
 * Open project, build and oracle services under one selected namespace.
 *
 * @evidence contracts/common.md#principled-implementation Timed-authoring kind admission precedes root discovery/project opening; two builder instances share the admitted project and the status closure is constructed before the oracle receives it.
 * @evidence contracts/common.md#clear-and-simple-design AutoMovieProductionContext reuses this service factory; project admission, source status and actual capture stay with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted capture creates no capture host, and service identity alone does not prove a current successful build. The two builder instances are preserved rather than merging their execution roles.
 * @evidence contracts/common.md#meaningful-documentation Defines root/id/archetype/evidence/capture dependencies, initialization order and caller-owned service lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Includes root discovery and project admission/registry reads plus fixed service construction; later status requests own snapshot/gate costs rather than this factory hiding them.
 * @evidence contracts/performance.md#reuse-equivalent-work Both builders/oracle share one project and authoring dependencies, and one retained-status closure supplies freshness checks for that bundle.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned bundle retains project, two builders, status closure and capture reference; callers/context own its lifetime, and the host owns disposal of any supplied capture instrument.
 */
export const openAutoMovieProduction: (props: {
    /** Host-owned path at or below the project root. */
    projectRoot?: string;
    /** Exact production namespace, required when the project has several. */
    productionId?: string;
    /** Optional host-owned actual frame capture. */
    capture?: AutoMovieProductionFrameCapture;
    /**
     * Archetype catalogue this production registers.
     *
     * Omitted leaves the primitive catalogue the server ships with. A production
     * that supplies its own builders registers them here, and every recipe naming
     * something outside the registry is refused with a design diagnostic.
     */
    archetypes?: AutoMovieModelArchetypeRegistry;
    /** Exact graph-derived authoring identity for review and final gates. */
    authoringEvidence?: IAutoMovieProductionEvidence;
    /** Fresh graph reader used by every atomic currentness confirmation. */
    currentAuthoringEvidence?: () => IAutoMovieProductionEvidence;
}) => IAutoMovieProductionServices = (props: {
    /** Host-owned path at or below the project root. */
    projectRoot?: string;
    /** Exact production namespace, required when the project has several. */
    productionId?: string;
    /** Optional host-owned actual frame capture. */
    capture?: AutoMovieProductionFrameCapture;
    /**
     * Archetype catalogue this production registers.
     *
     * Omitted leaves the primitive catalogue the server ships with. A production
     * that supplies its own builders registers them here, and every recipe naming
     * something outside the registry is refused with a design diagnostic.
     */
    archetypes?: AutoMovieModelArchetypeRegistry;
    /** Exact graph-derived authoring identity for review and final gates. */
    authoringEvidence?: IAutoMovieProductionEvidence;
    /** Fresh graph reader used by every atomic currentness confirmation. */
    currentAuthoringEvidence?: () => IAutoMovieProductionEvidence;
}): IAutoMovieProductionServices => {
    resolveAutoMovieTimedAuthoringKind(props.authoringEvidence);
    const project: AutoMovieProductionProject = AutoMovieProductionProject.open(findAutoMovieProjectRoot(props.projectRoot), props.productionId, props.archetypes);
    const statusBuilder: AutoMovieProductionBuilder = new AutoMovieProductionBuilder(project, props.authoringEvidence, props.currentAuthoringEvidence);
    const builder: AutoMovieProductionBuilder = new AutoMovieProductionBuilder(project, props.authoringEvidence, props.currentAuthoringEvidence);
    const buildStatus: ReturnType<typeof createAutoMovieProductionSourceStatus> = createAutoMovieProductionSourceStatus({
        project,
        builder: statusBuilder,
        authoringEvidence: props.authoringEvidence,
        currentAuthoringEvidence: props.currentAuthoringEvidence,
    });
    return {
        project,
        builder,
        buildStatus,
        oracle: new AutoMovieProductionOracleService(project, props.capture, buildStatus),
    };
};
