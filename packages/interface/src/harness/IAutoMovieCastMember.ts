/** A character the film needs, mapped to the scene node that will play it. */
export interface IAutoMovieCastMember {
  /** Id of the scene node (set in staging) that embodies this character. */
  node: string;

  /** Who they are, read by the model when blocking their action. */
  character: string;

  /**
   * Optional reference to an existing/importable model (a VRM, a built rig), or
   * null to use a generated stand-in.
   */
  modelRef: string | null;
}
