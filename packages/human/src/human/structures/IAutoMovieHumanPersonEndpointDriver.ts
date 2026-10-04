/**
 * A driver-only channel of the head partition view that applies a body
 * endpoint's rows on the head with the body's own gain.
 *
 * A source generation that defines a quantity once over the one skin stores
 * that body endpoint's rows on head vertices, carried parts and face
 * landmarks in the face view, keyed by the body endpoint name and relative to
 * the face frame's anchor. The face view declares a channel `channel` whose
 * positive endpoint is `endpoint`; the evaluator sets that channel's weight to
 * the gain the body document gives `endpoint` (a channel side's weight or a
 * corrective's activation, from the body's own endpoint state), so the face
 * producer applies those rows before its expression and articulation exactly
 * as the body applies its own. A person document's face subtree may not state
 * a driver channel.
 *
 * @evidence contracts/common.md#principled-implementation The body owns the gain (its corrective activation rule included) and the face producer owns where its rows land; the driver hands one to the other instead of re-implementing either.
 * @evidence contracts/common.md#clear-and-simple-design Two names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No gain is invented; a missing body gain is zero, as the body evaluates it.
 * @evidence contracts/common.md#meaningful-documentation States the row convention, the gain source, the order and the document rule.
 * @evidence contracts/modeling.md#parameter-channels Binds a face-view driver to the single owning body endpoint; no new user control is added.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The driver defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The driver emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Names carry no frame; the rows' frame is stated by the generation.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The driver builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The driver is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The driver carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The body channel's owner admits the value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The driver adds no input; its weight is derived.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonEndpointDriver {
  /** The face view's driver channel id. */
  channel: string;

  /** The body endpoint (channel side or corrective target) whose gain drives it. */
  endpoint: string;
}
