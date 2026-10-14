import { randomUUID } from "node:crypto";

/**
 * Choose an attempt-local sibling path for atomic replacement or delete quarantine.
 *
 * @evidence contracts/common.md#principled-implementation Appends operation, process id and native random UUID to the target path, keeping temporary publication/quarantine in the same directory for the existing atomic filesystem steps.
 * @evidence contracts/common.md#clear-and-simple-design One formatter supplies both replacement and deletion helpers; those helpers own actual creation, namespace guards and cleanup rather than the path formatter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The generated name reduces collision likelihood but does not itself acquire ownership or prove absence; actual exclusive creation/rename and cleanup policy remains with the consuming atomic operation.
 * @evidence contracts/common.md#meaningful-documentation Names the sibling layout and operation tag, distinguishing a proposed unique attempt address from a successfully acquired temporary file.
 * @evidence contracts/performance.md#efficient-algorithms Generates one UUID and concatenates the target/constant-size suffix, with target path length driving string allocation and no directory scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every attempt needs its own temporary address; sharing it across effects would couple independent atomic ownership and cleanup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a string without creating a file, acquiring a handle or launching a task; the atomic helper retains/releases any actual temporary resource.
 */
export function productionProjectTemporaryPath(file: string, operation: "tmp" | "delete"): string {
    return `${file}.${operation}.${process.pid}.${randomUUID()}`;
}
