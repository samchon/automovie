/**
 * One numerical build the server saw, kept by document so a saving can be measured.
 *
 * @author Samchon
 */
export interface IHumanViewerBuildRecord {
  /** Worker milliseconds of the build. */
  ms: number;

  /** Whether ambient occlusion was baked. */
  ao: boolean;

  /** ISO time of the build. */
  at: string;
}
