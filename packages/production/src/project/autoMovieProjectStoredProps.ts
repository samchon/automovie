import { IAutoMovieLegacyPropSpec } from "./legacyRecords";
import { autoMovieProjectValidatePropSlice } from "./autoMovieProjectValidatePropSlice";
import { autoMovieProjectValidateProjectValue } from "./autoMovieProjectValidateProjectValue";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation Fenced refresh precedes keyed correspondence and engine-backed validation of every stored prop.
 * @evidence contracts/common.md#clear-and-simple-design The directory reader owns identity while conversion/forge admission own nested semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bad keys or model/articulation semantics refuse instead of dropping or repairing props.
 * @evidence contracts/common.md#meaningful-documentation States filename order, fresh collection and validation refusal.
 * @evidence contracts/performance.md#efficient-algorithms Includes B bytes, F-name sorting and each prop gate's preliminary model check; admitted preliminary shapes add a second model check, driver/profile/part/mapping work and potentially O(J^2) joint parent walks, with no forge imported-appearance branch because lowering omits modelRef.
 * @evidence contracts/performance.md#reuse-equivalent-work Each parsed record serves all checks; prior prop verdicts are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted; native cleanup can retain fences and returned records have no local population cap.
 */
export function autoMovieProjectStoredProps(_project: IAutoMovieProjectState): IAutoMovieLegacyPropSpec[] {
    return _project.withRootNamespace((): IAutoMovieLegacyPropSpec[] => {
        _project.synchronizeResidentState();
        return _project.readKeyedSlices<IAutoMovieLegacyPropSpec>("props", {
            label: "prop node",
            expected: (node: string): string => node,
            actual: (spec: IAutoMovieLegacyPropSpec): string => spec.node,
        }, (file: string, spec: IAutoMovieLegacyPropSpec): void => autoMovieProjectValidateProjectValue(file, spec, autoMovieProjectValidatePropSlice));
    });
}
