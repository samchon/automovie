import { DESIGN_LAYERS } from "./DESIGN_LAYERS";

/**
 * The design layer union is derived from the canonical seven-item design inventory.
 *
 * @evidence contracts/common.md#principled-implementation The design layer union is derived from the canonical seven-item design inventory.
 * @evidence contracts/common.md#clear-and-simple-design Dependency matrices and source correspondence share the inventory instead of another manually synchronized list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type excludes narrative and settings branches rather than casting them into design.
 * @evidence contracts/common.md#meaningful-documentation Layer names correspond to project-owned authored design directories.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; validateAutoMovieProductionStages and selectAutoMovieCompletedDesignFoundations traverse DESIGN_FOUNDATIONS, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; validateAutoMovieProductionStages and selectAutoMovieCompletedDesignFoundations traverse DESIGN_FOUNDATIONS, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; validateAutoMovieProductionStages and selectAutoMovieCompletedDesignFoundations traverse DESIGN_FOUNDATIONS, while the caller or module owns the lifetime of its values.
 */
export type AutoMovieDesignDocumentLayer = (typeof DESIGN_LAYERS)[number];
