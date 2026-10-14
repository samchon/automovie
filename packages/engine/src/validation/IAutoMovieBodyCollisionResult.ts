import { IAutoMovieInteractionEvent, IAutoMovieValidation } from "@automovie/interface";
import { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";
/**
 * Return sampled inter-body validation, contact events and an optional suggested response.
 *
 * @evidence contracts/common.md#principled-implementation Capsule distances below summed radii create sampled penetration events; malformed sampling/topology/proxies return errors, while valid overlaps warn unless physicsIntent suppresses warnings.
 * @evidence contracts/common.md#clear-and-simple-design One result packages the check's observations and deepest-penetration suggestion without applying that suggestion to either actor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Events are sampled proxy contacts rather than continuous collision proof, and suppressed warnings do not remove contact events; response can be null when absent or explicitly suppressed.
 * @evidence contracts/common.md#meaningful-documentation Documents validation severity, shot-clock event population and optional response ownership rather than claiming a delivered reaction host.
 * @evidence contracts/performance.md#efficient-algorithms The result holds at most one event per overlapping capsule pair per sampled frame plus findings and one response; detection retains both actors' sampled maps and scans every capsule pair.
 * @evidence contracts/performance.md#reuse-equivalent-work Events and the response derive from the same penetration population, avoiding a second collision solve; the record has no independent cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns arrays and the optional suggestion until discarded; the result carries no live physics solver or renderer handle.
 * @author Samchon
 */
export interface IAutoMovieBodyCollisionResult {
  /** Sampled overlap warnings or admission errors; physicsIntent suppresses warnings. */
  validation: IAutoMovieValidation;

  /** Per-sample proxy contacts on the shot clock, including suppressed warnings. */
  events: IAutoMovieInteractionEvent[];

  /** Suggested response at the deepest contact, or `null` when none applies. */
  response: IAutoMovieCollisionResponse | null;
}
