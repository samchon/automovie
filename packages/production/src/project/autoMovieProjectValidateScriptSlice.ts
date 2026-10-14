import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { isRecord, pushViolation, validateArrayArtifact, validateBeatIdCaseCollisions, validateNonEmptyId, validateNonEmptyText, validateObjectArtifact, validateRange, validateUniqueBy } from "../validators/primitives";
import { autoMovieProjectValidateScriptTreeSlice } from "./autoMovieProjectValidateScriptTreeSlice";
import { autoMovieProjectAsArray } from "./autoMovieProjectAsArray";

/**
 * Append structural and contextual script findings to the caller's sink. Cast and beat text must be nonblank, beat durations are positive seconds, ids are unique under the existing portable filename policy, and an optional tree is checked against the supplied beats, logline and theme. This gate reads authored text without grading its quality or rewriting it.
 *
 * @evidence contracts/common.md#principled-implementation Raw cast/beat fields, unique ids and filename collisions precede tree shape and engine coherence admission.
 * @evidence contracts/common.md#clear-and-simple-design Owns stored script compatibility fields and delegates graph semantics with logline/theme unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stored file receives the same tree coherence context; malformed shape collects located refusals before unsafe dereference.
 * @evidence contracts/common.md#meaningful-documentation States cast/beat/text/time rules and tree context threading.
 * @evidence contracts/performance.md#efficient-algorithms Scans cast/beats/tree, includes uniqueness/case checks and full engine tree-validation cost; findings scale with refusals.
 * @evidence contracts/performance.md#reuse-equivalent-work One supplied violation collector joins shape and semantic findings; no mutable-script verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns findings and referenced offending values; temporary indices expire.
 */
export const autoMovieProjectValidateScriptSlice: (value: unknown, violations: IAutoMovieConstraintViolation[]) => void = (value: unknown, violations: IAutoMovieConstraintViolation[]): void => {
    if (!validateObjectArtifact(value, "$input", "script", violations))
        return;
    validateNonEmptyText(value.logline, "$input.logline", "logline", violations);
    validateNonEmptyText(value.theme, "$input.theme", "theme", violations);
    validateArrayArtifact(value.cast, "$input.cast", "script cast", violations);
    validateUniqueBy(autoMovieProjectAsArray(value.cast).map((member: unknown, index: number): {
        id: unknown;
        path: string;
    } => ({
        id: isRecord(member) ? member.node : undefined,
        path: `$input.cast[${index}].node`,
    })), "cast node", violations);
    autoMovieProjectAsArray(value.cast).forEach((member: unknown, index: number): void => {
        const path: string = `$input.cast[${index}]`;
        if (!validateObjectArtifact(member, path, "cast member", violations))
            return;
        validateNonEmptyId(member.node, `${path}.node`, "cast node", violations);
        validateNonEmptyText(member.character, `${path}.character`, "cast character", violations);
        if (member.modelRef !== null && member.modelRef !== undefined)
            validateNonEmptyText(member.modelRef, `${path}.modelRef`, "cast modelRef", violations);
    });
    validateArrayArtifact(value.beats, "$input.beats", "script beats", violations);
    validateUniqueBy(autoMovieProjectAsArray(value.beats).map((beat: unknown, index: number): {
        id: unknown;
        path: string;
    } => ({
        id: isRecord(beat) ? beat.id : undefined,
        path: `$input.beats[${index}].id`,
    })), "beat id", violations);
    validateBeatIdCaseCollisions(value.beats, "$input.beats", violations);
    if (Array.isArray(value.beats) && value.beats.length === 0)
        pushViolation(violations, "type", "$input.beats", "script must contain at least one beat", value.beats);
    autoMovieProjectAsArray(value.beats).forEach((beat: unknown, index: number): void => {
        const path: string = `$input.beats[${index}]`;
        if (!validateObjectArtifact(beat, path, "script beat", violations))
            return;
        validateNonEmptyId(beat.id, `${path}.id`, "beat id", violations);
        validateNonEmptyText(beat.name, `${path}.name`, "beat name", violations);
        validateNonEmptyText(beat.summary, `${path}.summary`, "beat summary", violations);
        validateRange(beat.durationHint, `${path}.durationHint`, 0, Infinity, "beat durationHint", violations, false);
    });
    autoMovieProjectValidateScriptTreeSlice(value.tree, value.beats, value.logline, value.theme, violations);
};
