import { IAutoMovieRenderBundleManifest } from "@automovie/interface";
import type { IAutoMovieProductionDesignGraph } from "../validateProductionDesign";

/**
 * Answer continued current-design membership of a verified render target.
 *
 * @evidence contracts/common.md#principled-implementation Null targets conservatively retain true; exact shot/model/sequence ids and production id resolve membership against the acquired graph and screenplay sequence set.
 * @evidence contracts/common.md#clear-and-simple-design Inspection keeps target membership separate from target fingerprint freshness and performs no garbage collection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreadable manifests cannot become unowned from failed acquisition; the exhaustive typed target union is a caller premise rather than unknown-runtime-kind admission.
 * @evidence contracts/common.md#meaningful-documentation Defines conservative null behavior and exact target-family membership without deriving ids from path names.
 * @evidence contracts/performance.md#efficient-algorithms Uses direct map/set membership or one string comparison, excluding the caller's graph/sequence acquisition cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the report's already acquired graph and sequence index rather than reloading them for each render.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes; all supplied graph/target data remains borrowed and no cleanup authority or resource is acquired.
 */
export const productionOpenRenderTargetOwned: (graph: IAutoMovieProductionDesignGraph, sequenceIds: ReadonlySet<string>, target: IAutoMovieRenderBundleManifest["target"] | null) => boolean = (graph: IAutoMovieProductionDesignGraph, sequenceIds: ReadonlySet<string>, target: IAutoMovieRenderBundleManifest["target"] | null): boolean => {
    if (target === null)
        return true;
    switch (target.kind) {
        case "shot":
            return graph.shots.has(target.id);
        case "asset":
            return graph.models.has(target.id);
        case "sequence":
            return sequenceIds.has(target.id);
        case "film":
            return graph.production?.id === target.id;
    }
};
