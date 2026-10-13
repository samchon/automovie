/**
 * The one filesystem question the resolver asks.
 *
 * @author Samchon
 */
export interface IHumanViewerResolveIo {
  /** Whether a regular file exists at this normalized forward-slash path. */
  exists(file: string): boolean;
}
