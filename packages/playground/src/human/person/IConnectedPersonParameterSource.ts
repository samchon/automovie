/**
 * The shape of an owner's parameter table row as the input catalogue reads it: the lash owners publish their profile parameters in this form. Every member is the owner's statement; the catalogue copies it. These ranges are owner authoring envelopes, not observed population anatomy or a substitute for numerical admission. Upper and lower lash rows use their respective tables and units.
 *
 * @evidence contracts/common.md#principled-implementation Parameter identity, units, bounds, step and meaning/effect come from the actual upper or lower lash owner rather than a catalogue-local anatomical rule.
 * @evidence contracts/common.md#clear-and-simple-design This narrow table-row view transports metadata while the catalogue formats it and the numerical producer validates geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authoring envelopes are not presented as clinical or population measurements and one lash row's table is not substituted for the other.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies owner-table provenance, separate upper/lower units and the metadata-versus-admission boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The row interface implements no parameter traversal, range validation or geometry algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Metadata fields define no cached numerical result equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar metadata and strings acquire no external resource or independently running task.
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
