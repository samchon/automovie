import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Flinch away from a blow.
 *
 * Usually the engine emits it from an {@link IAutoMovieLaunchAction}'s `onHit`
 * at the computed impact; author it directly for a melee blow whose timing
 * you control. `performShot` refuses a force outside `[0, 1]` and a source
 * that does not resolve to one point, which includes the relative kinds and a
 * group naming a formation.
 *
 * The reference synthesizer (`makeActorSynthesizer`) needs the actor's rig and
 * produces nothing without one. It resolves the source at `start`, takes the
 * horizontal direction from the source to the actor, and splits a peak
 * deflection of `32 * force` degrees, times 1.5 when `unbalance` is set, into
 * spine extension for a blow from the front and a sideways lean for one from
 * the side. `reactMotion` sends that push down the head, neck, chest and spine
 * through `impactRecoil`, clamping each joint to its declared range, and plays
 * rest, flinch at `min(0.16, 0.4 * duration)` seconds, then rest. A source on
 * the actor's own position is treated as a blow from the front. An `"auto"`
 * reaction lasts 0.5 s, and with no `region` it drives the full body.
 *
 * @evidence contracts/common.md#principled-implementation The blow direction is projected onto the actor's facing and right axes, so a frontal blow becomes extension and a lateral one abduction away from it, and `impactRecoil` bounds every joint by the same range-of-motion table the shot's pose gate applies.
 * @evidence contracts/common.md#clear-and-simple-design A source, a scalar force and an unbalance flag are the whole verb; the chain, peak gain and clip shape are engine constants, and a launch's recoil is this same verb rather than a second record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A source that names no point is refused at the gate instead of being read as a frontal blow, and the flinch is clamped to declared ranges instead of an invented limit; `unbalance` scales the flinch and does not pretend to perform a fall.
 * @evidence contracts/common.md#meaningful-documentation States who emits it and when to author it, each refusal, the rig requirement, how direction and magnitude become the flinch, the bone chain and range clamp, the clip timing, the coincident-source rule, the `"auto"` length and the default region; members give the source requirement, the force range and units, and what `unbalance` changes.
 * @author Samchon
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
   * Blow strength within `[0, 1]`, refused outside it; the peak flinch is
   * `32 * force` degrees before the range clamp.
   */
  force: number;

  /**
   * Whether the blow is meant to floor or unseat the actor. The reference
   * synthesizer flinches 1.5 times harder; no fall or dismount motion is
   * produced.
   */
  unbalance?: boolean;
}
