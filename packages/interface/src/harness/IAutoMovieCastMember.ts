/**
 * A character the film needs, mapped to the scene node that will play it.
 *
 * `node` must be unique across the cast and placed by staging. A `null`
 * `modelRef` makes the member a generated stand-in that `forgeCast` must forge
 * under the node's own id. A non-null one is never forged and becomes the
 * staged scene node's model id, so several members may share one imported
 * model; the scene's model check then requires that id to name an available
 * model.
 */
export interface IAutoMovieCastMember {
  /** Id of the scene node, placed in staging, that embodies this character. */
  node: string;

  /** Who they are, read by the model when blocking their action; non-empty. */
  character: string;

  /**
   * Id of an existing model, such as an imported VRM or a built rig, used as
   * the scene node's model, or `null` to forge a generated stand-in.
   */
  modelRef: string | null;
}
