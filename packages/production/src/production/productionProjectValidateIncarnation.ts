import { productionProjectIsUuid } from "./productionProjectIsUuid";

/**
 * Admit a version-one UUIDv4 incarnation record for namespace replacement fencing.
 *
 * @evidence contracts/common.md#principled-implementation Reads version/id from unknown data and requires literal version 1 plus the shared lowercase UUIDv4 spelling predicate, returning the exact admitted id without coercion.
 * @evidence contracts/common.md#clear-and-simple-design Owns record-field admission while UUID spelling is shared with repaint and registration identity checks; physical read/currentness remains with the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a minimal field validator rather than exact-object admission, so additional properties are accepted; no UUID entropy, uniqueness or author trust is inferred from spelling alone.
 * @evidence contracts/common.md#meaningful-documentation The file argument attributes corrective refusal, while the returned id is an observed generation token requiring comparison with opening expectations.
 * @evidence contracts/performance.md#efficient-algorithms Checks two fields and a fixed-format UUID predicate, with string input length driving regex refusal work; it performs no JSON parse or filesystem acquisition itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One already acquired mutable record is admitted per call and no cached admission can establish a later resident incarnation unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the original id string and retains neither the record nor file path; no descriptor, lock or running task is acquired.
 */
export function productionProjectValidateIncarnation(value: unknown, file: string): string {
    const version: unknown = (value as {
        version?: unknown;
        id?: unknown;
    } | null | undefined)?.version;
    const id: unknown = (value as {
        version?: unknown;
        id?: unknown;
    } | null | undefined)
        ?.id;
    if (version !== 1 || productionProjectIsUuid(id) === false)
        throw new Error(`Invalid production state incarnation "${file}". Reopen a complete, physical AutoMovie project state.`);
    return id;
}
