import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import { IAutoMovieBuildProjectInput, IAutoMovieBuildProjectOutput } from "@automovie/interface";
import type { AutoMovieModelArchetypeRegistry } from "../productionArchetypes";
import { openAutoMovieProduction } from "./openAutoMovieProduction";

/**
 * Open services and execute the selected mutable build gate.
 *
 * @evidence contracts/common.md#principled-implementation Delegates to the existing service factory then its builder.build with only the requested scope; root, namespace, archetype and authoring dependencies retain the original threading.
 * @evidence contracts/common.md#clear-and-simple-design This exported convenience entry creates no alternate compiler or transaction authority; no maintained internal application caller has been identified.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No configured capture host or deterministic sandbox is synthesized; admitted authoring and ordinary source execution remain existing builder/host contracts.
 * @evidence contracts/common.md#meaningful-documentation Defines selected gate, default factory dependencies and direct return/refusal without certifying current product-host execution.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes full service opening and the selected build pipeline, including authored Node evaluation, domain validation and publication when that scope performs them.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the same project/builder pipeline, but each call opens a fresh bundle rather than caching mutable build results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary service references expire after the build returns unless retained by downstream closures; project readers/transactions own their per-operation handles and authored code owns its effects.
 */
export const buildAutoMovieProduction: (props: {
    /** Host-owned path at or below the project root. */
    projectRoot?: string;
    /** Exact production namespace. */
    productionId?: string;
    /** Highest atomic builder gate. */
    scope: IAutoMovieBuildProjectInput["scope"];
    /** Archetype catalogue this production registers. */
    archetypes?: AutoMovieModelArchetypeRegistry;
    /**
     * Exact graph-derived authoring identity, required to compile a library.
     *
     * The builder chooses its shape from this declaration, so a library
     * compiled without it takes the film path and is refused for a design tree
     * it was never going to have. A film or brief may omit it, which is why it
     * stays optional on this exported convenience entry. No maintained internal
     * application caller is currently identified.
     */
    authoringEvidence?: IAutoMovieProductionEvidence;
    /** Fresh graph reader used by every atomic currentness confirmation. */
    currentAuthoringEvidence?: () => IAutoMovieProductionEvidence;
}) => IAutoMovieBuildProjectOutput = (props: {
    /** Host-owned path at or below the project root. */
    projectRoot?: string;
    /** Exact production namespace. */
    productionId?: string;
    /** Highest atomic builder gate. */
    scope: IAutoMovieBuildProjectInput["scope"];
    /** Archetype catalogue this production registers. */
    archetypes?: AutoMovieModelArchetypeRegistry;
    /**
     * Exact graph-derived authoring identity, required to compile a library.
     *
     * The builder chooses its shape from this declaration, so a library
     * compiled without it takes the film path and is refused for a design tree
     * it was never going to have. A film or brief may omit it, which is why it
     * stays optional on this exported convenience entry. No maintained internal
     * application caller is currently identified.
     */
    authoringEvidence?: IAutoMovieProductionEvidence;
    /** Fresh graph reader used by every atomic currentness confirmation. */
    currentAuthoringEvidence?: () => IAutoMovieProductionEvidence;
}): IAutoMovieBuildProjectOutput => openAutoMovieProduction(props).builder.build({ scope: props.scope });
