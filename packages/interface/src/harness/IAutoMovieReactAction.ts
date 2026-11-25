import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import type { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Flinch away from a blow.
 *
 * Usually the engine emits it from an {@link IAutoMovieLaunchAction}'s `onHit`
 * at the computed impact; author it directly for a melee blow whose timing you
 * control. `performShot` refuses a force outside `[0, 1]` and a source that
 * does not resolve to one point, which includes the relative kinds and a group
 * naming a formation.
 *
 * The reference synthesizer requires an actor rig. It resolves the source at
 * start, projects the horizontal away direction into staged facing/right axes
 * and scales degree deflection by 32 times force, multiplied by 1.5 for
 * unbalance. reactMotion propagates it through head, neck, chest and spine,
 * clamping configured bones, with rest, peak at min(0.16, 0.4 times duration),
 * then rest. A horizontally coincident source uses forward as the away vector
 * and therefore positive flexion. Auto lasts 0.5 seconds; the default region is
 * fullBody.
 */
export interface IAutoMovieReactAction extends IAutoMovieActionBase {
  /** Selects an impact reaction as the action family. */
  verb: "react";

  /**
   * Where the blow comes from; it must resolve to one point, and the body
   * recoils horizontally away from it.
   */
  from: IAutoMovieActionTarget;

  /**
   * Blow strength within `[0, 1]`, refused outside it; the peak flinch is `32 *
   * force` degrees before the range clamp.
   */
  force: number;

  /**
   * Whether the blow is meant to floor or unseat the actor. The reference
   * synthesizer flinches 1.5 times harder; no fall or dismount motion is
   * produced.
   */
  unbalance?: boolean;
}
