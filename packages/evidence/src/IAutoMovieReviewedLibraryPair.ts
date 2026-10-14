


/**
 * One completed design/source pair carried by a library pilot receipt.
 *
 * The type name preserves the version-1 receipt API; completion occurs at evidence, with review retained as a compatible declaration.
 *
 * @evidence contracts/common.md#principled-implementation Closed design and source unions describe one recorded library pair; runtime reset validation checks that the two selected names are the recognized matching pair.
 * @evidence contracts/common.md#clear-and-simple-design The pair record isolates library branch correspondence from film ladder and delivery-group semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type name and reviewed protocol field preserve version-one compatibility even though completion is admitted at evidence stage.
 * @evidence contracts/common.md#meaningful-documentation The comment explains completion-stage meaning and compatibility, and members distinguish the authored design branch from its TypeScript source branch.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The library-pair schema performs no correspondence lookup or population walk.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A library-pair identity describes branch selection and owns no shared build or review task.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased provider-consumer pair acquires no state; the library transition receipt caller retains its branch-name strings and the transition validator reads them without opening a resource.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieReviewedLibraryPair {
  /** Authored design branch. */
  design:
    | "instances"
    | "maps"
    | "materials"
    | "models"
    | "motions"
    | "spaces"
    | "systems";

  /** Matching TypeScript source branch. */
  source:
    | "instanceSources"
    | "mapSources"
    | "materialSources"
    | "modelSources"
    | "motionSources"
    | "spaceSources"
    | "systemSources";
}
