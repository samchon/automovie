import { IAutoMovieLegacyActorSpec } from "./legacyRecords";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Read fresh filename-ordered actor records after resident refresh and decoded filename/node correspondence. Parsed-null members are skipped and no deep actor-context validator is supplied here; callers own the returned records without a semantic performance certificate.
 *
 * @evidence contracts/common.md#principled-implementation Fenced refresh and filename/internal-node agreement return ordered actor records without deep context admission.
 * @evidence contracts/common.md#clear-and-simple-design Preserves historical actor storage while later semantic validation remains outside this reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parsed contexts are not validity certificates; null records are skipped and key mismatch refuses.
 * @evidence contracts/common.md#meaningful-documentation States identity-only admission and remaining deep-validation gap.
 * @evidence contracts/performance.md#efficient-algorithms Reads B bytes across F files and sorts names, retaining the full parsed population.
 * @evidence contracts/performance.md#reuse-equivalent-work One current parse serves identity checks without an actor verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted, with possible retained fences after native failure; returned records have no local byte cap.
 */
export function autoMovieProjectStoredActors(_project: IAutoMovieProjectState): IAutoMovieLegacyActorSpec[] {
    return _project.withRootNamespace((): IAutoMovieLegacyActorSpec[] => {
        _project.synchronizeResidentState();
        return _project.readKeyedSlices<IAutoMovieLegacyActorSpec>("actors", {
            label: "actor node",
            expected: (node: string): string => node,
            actual: (spec: IAutoMovieLegacyActorSpec): string => spec.node,
        });
    });
}
