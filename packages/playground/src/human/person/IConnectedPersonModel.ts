/**
 * The part of a built person preview the person panel reads: how many
 * material regions the committed model has. The viewport owns the prepared
 * frame behind it.
 *
 * @author Samchon
 */
export interface IConnectedPersonModel {
  /** Material regions of the built person. */
  parts: number;
}
