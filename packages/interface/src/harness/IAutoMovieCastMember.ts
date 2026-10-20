/**
 * A character the film needs, mapped to the scene node that will play it.
 *
 * `node` must be non-blank, unique across the cast, and placed by staging. A
 * `null` `modelRef` makes the member a generated stand-in that `forgeCast` must
 * forge under the node's own id. A non-null one must be non-blank, is never
 * forged, and becomes the staged scene node's model id, so several members may
 * share one imported model; the scene's model check then requires that id to
 * name an available model.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` lowers each placed member to a scene node whose model is `modelRef ?? node`, and `forgeCast` requires exactly one generated entry for every member whose `modelRef` is `null`, so each node resolves to one model by a single id lookup.
 * @evidence contracts/common.md#clear-and-simple-design Three fields join a character description to a node and a model choice; placement belongs to staging and the forged geometry to the forge plan, so the cast record holds neither.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A member with a model reference offered a forged stand-in is refused rather than silently overridden, and a stand-in member without a forge entry is refused rather than drawn with a default figure.
 * @evidence contracts/common.md#meaningful-documentation States the node rules, both meanings of `modelRef` with the forging rule and the model id it yields, that references may be shared, and where the reference is checked; members give each field's reader and non-empty rule.
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
