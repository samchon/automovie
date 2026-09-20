import { IAutoMovieActionCall, IAutoMovieBeatEndState, IAutoMovieMotion } from "@automovie/interface";

/**
 * The **content seam** of the action builder. Given one action call (and the
 * actor performing it), synthesise the _base_ clip for **one cycle** of that
 * action: local time starting at 0, the clip's own natural duration. Return
 * `null` to skip (the action produces no motion for this actor).
 *
 * This is where rig-specific content enters: a "strike" clip, a "walk" gait, an
 * IK reach are all authored against a particular skeleton, so the host supplies
 * them. The builder stays generic: it owns the **timeline assembly** (which
 * actor, when, repeated how often, held across gaps, layered by region), never
 * the keyframes. This is "thin verb in, dense motion out" made concrete: a
 * coding agent authors {@link IAutoMovieActionCall}s, this seam fattens each
 * into a clip, and {@link compilePerformance} composes them into the shot.
 *
 * @evidence requirements/actors/performance-and-story-binding.md#actor-performance-capability-plan Exposes the capability-specific seam that turns one authored action into actor motion.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state Implements the action-to-performance binding while leaving clip content to the adopted capability.
 * @author Samchon
 */
export type IAutoMovieActionSynthesizer = (
  action: IAutoMovieActionCall,
  actor: string,
  /**
   * Prior verified beat state; custom synthesizers may resume its simulation
   * facts.
   */
  previous?: IAutoMovieBeatEndState | null,
) => IAutoMovieMotion | null;
