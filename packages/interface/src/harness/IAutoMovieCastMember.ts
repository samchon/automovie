/**
 * A character the film needs, mapped to the scene node that will play it.
 *
 * `node` must be non-blank, unique across the cast, and placed by staging. A
 * `null` `modelRef`
 * makes the member a generated stand-in that `forgeCast` must forge; a non-null
 * one must resolve to a registered runtime model and is never forged.
 *
 * @author Samchon
 */
export interface IAutoMovieCastMember {
  /** Id of the scene node (set in staging) that embodies this character. */
  node: string;

  /** Who they are, read by the model when blocking their action; non-empty. */
  character: string;

  /**
   * Optional reference to an existing/importable model (a VRM, a built rig), or
   * null to use a generated stand-in.
   */
  modelRef: string | null;
}
