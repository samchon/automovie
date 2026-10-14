/**
 * The compile generations whose human modules this realm has run, as the stamped modules recorded them.
 *
 * @evidence contracts/common.md#principled-implementation Executed stamped modules supply the realm's actual compile-label set and this accessor returns its current members.
 * @evidence contracts/common.md#clear-and-simple-design One copied array exposes the existing realm Set without implementing another source authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty set remains empty rather than inventing browser compilation identity or claiming modules that never ran.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies compile labels actually recorded by executed human modules.
 * @evidence contracts/performance.md#efficient-algorithms Snapshot copying is linear in recorded compile-label count with no module or filesystem traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical realm Set is shared by executed module stamps, while each accessor call copies its current observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The realm owns its label Set until teardown and this accessor retains no independent history or numerical model.
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
