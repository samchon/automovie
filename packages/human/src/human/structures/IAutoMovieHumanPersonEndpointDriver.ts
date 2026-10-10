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
 * @author Samchon
 */
export interface IAutoMovieHumanPersonEndpointDriver {
  /** The face view's driver channel id. */
  channel: string;

  /** The body endpoint (channel side or corrective target) whose gain drives it. */
  endpoint: string;
}
