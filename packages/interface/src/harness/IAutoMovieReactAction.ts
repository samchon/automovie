import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Flinch away from a blow.
 *
 * Usually the engine emits it from an {@link IAutoMovieLaunchAction}'s `onHit` at the computed impact; author it directly for a melee blow whose timing you control. `performShot` refuses a force outside `[0, 1]` and a source that does not resolve to one point, which includes the relative kinds and a group naming a formation.
 *
 * The reference synthesizer requires an actor rig. It resolves the source at start, projects the horizontal away direction into staged facing/right axes and scales degree deflection by 32 times force, multiplied by 1.5 for unbalance. reactMotion propagates it through head, neck, chest and spine, clamping configured bones, with rest, peak at min(0.16, 0.4 times duration), then rest. A horizontally coincident source uses forward as the away vector and therefore positive flexion. Auto lasts 0.5 seconds; the default region is fullBody.
 *
 * @evidence contracts/common.md#principled-implementation Reference synthesis projects the horizontal away vector onto staged facing/right axes and propagates degree deflections down head, neck, chest and spine with 0.6 per-link falloff. Configured bones use shared ROM clamping; missing chain bones remain authored for downstream refusal. This is a choreographed pose heuristic, not impulse or body-fall dynamics.
 * @evidence contracts/common.md#clear-and-simple-design A source, a scalar force and an unbalance flag are the whole verb; the chain, peak gain and clip shape are engine constants, and a launch's recoil is this same verb rather than a second record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shot admission refuses an unresolved source, but direct reference synthesis still has a backwards-flinch fallback for null. A horizontal separation below 1e-6 uses the actor's forward vector as the away direction, producing positive flexion; unbalance scales the flinch and produces no fall or dismount. Missing rig/context can yield null synthesis.
 * @evidence contracts/common.md#meaningful-documentation States who emits it and when to author it, each refusal, the rig requirement, how direction and magnitude become the flinch, the bone chain and range clamp, the clip timing, the coincident-source rule, the `"auto"` length and the default region; members give the source requirement, the force range and units, and what `unbalance` changes.
 * @author Samchon
 */
export interface IAutoMovieReactAction extends IAutoMovieActionBase {
  /** Selects an impact reaction as the action family. */
  verb: "react";

  /**
   * Where the blow comes from; it must resolve to one point, and the body recoils horizontally away from it.
   */
  from: IAutoMovieActionTarget;

  /**
   * Blow strength within `[0, 1]`, refused outside it; the peak flinch is `32 * force` degrees before the range clamp.
   */
  force: number;

  /**
   * Whether the blow is meant to floor or unseat the actor. The reference synthesizer flinches 1.5 times harder; no fall or dismount motion is produced.
   */
  unbalance?: boolean;
}
