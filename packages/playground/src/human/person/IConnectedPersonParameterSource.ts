/**
 * The shape of an owner's parameter table row as the input catalogue reads
 * it: the lash owners publish their profile parameters in this form. Every
 * member is the owner's statement; the catalogue copies it.
 *
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
