import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { pushViolation, validateArrayArtifact, validateNonEmptyId, validateNonEmptyText, validateObjectArtifact } from "../validators/primitives";

/**
 *
 * @evidence contracts/common.md#principled-implementation Array/object shape precedes beat id, closed tier, issue and suggestion admission.
 * @evidence contracts/common.md#clear-and-simple-design Owns persisted review-note structural semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Beat membership is not cross-checked against script here; invalid rows remain located refusals.
 * @evidence contracts/common.md#meaningful-documentation States closed tiers and unmodified note values.
 * @evidence contracts/performance.md#efficient-algorithms Visits N notes and their text with findings proportional to refusals.
 * @evidence contracts/performance.md#reuse-equivalent-work The current array uses one collector; no review-note verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only supplied findings persist; no file or task is acquired.
 */
export const autoMovieProjectValidateNotesSlice: (value: unknown, violations: IAutoMovieConstraintViolation[]) => void = (value: unknown, violations: IAutoMovieConstraintViolation[]): void => {
    if (!validateArrayArtifact(value, "$input", "review notes", violations))
        return;
    value.forEach((note: unknown, index: number): void => {
        const path: string = `$input[${index}]`;
        if (!validateObjectArtifact(note, path, "review note", violations))
            return;
        validateNonEmptyId(note.beat, `${path}.beat`, "note beat", violations);
        if (note.tier !== "structural" &&
            note.tier !== "physical" &&
            note.tier !== "visual")
            pushViolation(violations, "type", `${path}.tier`, 'note tier must be one of "structural", "physical", or "visual"', note.tier);
        validateNonEmptyText(note.issue, `${path}.issue`, "note issue", violations);
        validateNonEmptyText(note.suggestion, `${path}.suggestion`, "note suggestion", violations);
    });
};
