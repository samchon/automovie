import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBodyMeasure } from "../body/IBodyMeasure";
import type { IBodyPosture } from "../body/IBodyPosture";
import { PostureFrame } from "../body/PostureFrame";
import { DuelLaw } from "./DuelLaw";

/**
 * The wand arm's shapes in a practice duel, each laid over the posture the
 * duellist otherwise holds: the cast's flick (a still aim, then the wand hand
 * up 7 cm and forward 5 cm and back over the gesture), the deflecting sweep
 * (the wand hand 0.25 m across to the own left and back, crossing the streak's
 * line at the contact), the shield (the wand hand raised forward to 0.5 m in
 * front at 0.12 m above the shoulder line within the gesture, held, lowered
 * over the fade), and the underarm turn (a full turn about the joined hands
 * held up above the head).
 *
 * ```ts
 * WandShape.cast(posture, heading, 0.35);
 * WandShape.shield(posture, measure, 0.1, 2.4);
 * ```
 *
 * @evidence docs/research/duelling/practice-duel.md Aim, gesture, sweep, shield formation and fade, the underarm turn.
 */
export namespace WandShape {
  /**
   * The cast's flick.
   *
   * @param p The posture.
   * @param heading The caster's facing.
   * @param own Seconds since the cast began.
   * @returns The posture with the wand hand flicked.
   */
  export function cast(p: IBodyPosture, heading: number, own: number): IBodyPosture {
    const flick: number = own < DuelLaw.AIM ? 0 : Math.sin(Math.PI * Math.min(1, (own - DuelLaw.AIM) / (DuelLaw.GESTURE + 0.15)));
    return move(p, "right", { x: Math.sin(heading) * 0.05 * flick, y: 0.07 * flick, z: Math.cos(heading) * 0.05 * flick });
  }

  /**
   * The deflecting sweep, centred on the contact.
   *
   * @param p The posture.
   * @param heading The defender's facing.
   * @param own Seconds since the deflection began.
   * @param contact Seconds from its start to the streak's arrival.
   * @returns The posture with the wand hand swept.
   */
  export function deflect(p: IBodyPosture, heading: number, own: number, contact: number): IBodyPosture {
    const begin: number = Math.max(0, contact - DuelLaw.SWEEP);
    const sweep: number = own < begin ? 0 : Math.sin(Math.PI * Math.min(1, (own - begin) / 0.35));
    return move(p, "right", { x: Math.cos(heading) * 0.25 * sweep, y: 0, z: -Math.sin(heading) * 0.25 * sweep });
  }

  /**
   * The shield: the wand hand raised forward and held.
   *
   * @param p The posture.
   * @param m The body.
   * @param own Seconds since the shield began.
   * @param natural The shield's seconds.
   * @returns The posture with the wand hand raised.
   */
  export function shield(p: IBodyPosture, m: IBodyMeasure, own: number, natural: number): IBodyPosture {
    const k: number = PostureFrame.smooth(Math.min(own / DuelLaw.GESTURE, (natural - own) / DuelLaw.SHIELD_FADE));
    const raised: IAutoMovieVector3 = PostureFrame.onTrunk(p, 0.5, -0.1, m.shoulder - m.hip + 0.12);
    return { ...p, hands: { ...p.hands, right: { ...p.hands.right, point: PostureFrame.lerp(p.hands.right.point, raised, k) } } };
  }

  /**
   * The underarm turn: a full turn under the joined hands held above the head.
   *
   * @param p The posture.
   * @param m The body.
   * @param heading The facing at the start.
   * @param share Share of the turn done.
   * @returns The posture.
   */
  export function turnUnder(p: IBodyPosture, m: IBodyMeasure, heading: number, share: number): IBodyPosture {
    return { ...p, heading: heading + 2 * Math.PI * share, hands: { ...p.hands, right: { ...p.hands.right, point: { x: p.pelvis.x, y: m.stature + 0.08, z: p.pelvis.z } } } };
  }

  function move(p: IBodyPosture, side: "left" | "right", d: IAutoMovieVector3): IBodyPosture {
    const at: IAutoMovieVector3 = p.hands[side].point;
    return { ...p, hands: { ...p.hands, [side]: { ...p.hands[side], point: { x: at.x + d.x, y: at.y + d.y, z: at.z + d.z } } } };
  }
}
