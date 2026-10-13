/**
 * A character the film needs, mapped to the scene node that will play it.
 *
 * `node` must be non-blank, unique across the cast, and placed by staging. A
 * `null` `modelRef`
 * makes the member a generated stand-in that `forgeCast` must forge; a non-null
 * one must resolve to a registered runtime model and is never forged.
 *
 * @evidence contracts/common.md#principled-implementation Joins a dramatic character to a scene node id, and the staged scene resolves the node's model as `modelRef ?? node`, so imported and generated bodies go through one lookup rule.
 * @evidence contracts/common.md#clear-and-simple-design Three fields: the node join, the character text for the model, and an optional model reference whose `null` selects generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No character is special-cased; `modelRef: null` is the contract spelling of a generated stand-in, a blank reference is refused, and forging a member that already has a reference is refused.
 * @evidence contracts/common.md#meaningful-documentation States node uniqueness, what `character` is for, both meanings of `modelRef`, and which pass forges or resolves each.
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
