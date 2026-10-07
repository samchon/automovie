/**
 * The shape of an owner's parameter table row as the input catalogue reads
 * it: the lash owners publish their profile parameters in this form. Every
 * member is the owner's statement; the catalogue copies it.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Reads a face owner's published parameter with its unit, envelope and meaning.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Lets the catalogue list an owner's parameter table without a hand-kept copy of it.
 * @author Samchon
 */
export interface IConnectedPersonParameterSource {
  /** Member name of the parameter in its document record. */
  id: string;

  /** The owner's lower bound. */
  minimum: number;

  /** The owner's upper bound. */
  maximum: number;

  /** The owner's editing step. */
  step: number;

  /** The owner's unit. */
  unit: string;

  /** What the parameter is, in the owner's words. */
  meaning: string;

  /** What increasing it does, in the owner's words. */
  effect: string;
}
