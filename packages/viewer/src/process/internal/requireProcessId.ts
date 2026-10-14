/**
 * Admit an actual process selector before any host effect. A fractional, nonpositive or unsafe integer cannot identify an owned operating-system process and must never reach discovery or termination.
 *
 * @evidence contracts/common.md#principled-implementation Requires a positive safe integer pid before public discovery or stop reaches native effects.
 * @evidence contracts/common.md#clear-and-simple-design One shared selector-admission predicate serves the controller and snapshot selector rather than repeating permissive coercion in each transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fractional, nonpositive, nonfinite and beyond-safe-integer selectors refuse; validity of a numeric selector neither proves a live process nor grants ownership.
 * @evidence contracts/common.md#meaningful-documentation Documents the pre-effect boundary and why invalid numbers cannot represent the intended native selector.
 * @evidence contracts/performance.md#efficient-algorithms Number.isSafeInteger and a positive comparison are fixed work and allocate nothing on the admitted path.
 * @evidence contracts/performance.md#reuse-equivalent-work There is no cached selector permission; each requested input is checked because earlier numeric admission does not establish later process identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function retains no value, native resource or closure; only a refused call creates its error object.
 */
export function requireProcessId(pid: number): void {
  if (!Number.isSafeInteger(pid) || pid <= 0)
    throw new Error("A positive integer process ID is required");
}
