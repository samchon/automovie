/**
 * The compile generations whose human modules this realm has run, as the
 * stamped modules recorded them.
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
