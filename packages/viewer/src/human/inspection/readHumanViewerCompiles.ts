/**
 * The compile generations whose human modules this realm has run, as the
 * stamped modules recorded them.
 *
 * @evidence contracts/common.md#meaningful-documentation States the source of the answer.
 * @evidence contracts/common.md#principled-implementation Reads the Set populated by the realm's actually served modules and returns a fresh array, preserving the distinction between an empty observation and a compile receipt.
 * @evidence contracts/common.md#clear-and-simple-design One read exposes compile observations without owning stamping or candidate admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the realm's recorded generation stamps only; it does not invent a loader provenance receipt, current revision or successful admission.
 */
export function readHumanViewerCompiles(): string[] {
  return [
    ...((globalThis as IHumanViewerCompileGlobals).__humanViewerCompiles ?? []),
  ];
}

/**
 * Named local transport for readHumanViewerCompiles; member meaning remains with its calculation owner.
 *
 * @author Samchon
 */
interface IHumanViewerCompileGlobals {
  __humanViewerCompiles?: Set<string>;
}
