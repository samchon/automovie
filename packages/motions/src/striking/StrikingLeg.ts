import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { StrikingBody } from "./StrikingBody";
import { StrikingContact } from "./StrikingContact";
import { StrikingReach } from "./StrikingReach";

/**
 * Leg facts the kicking and kneeing laws share: where the knee is for a hip,
 * an ankle goal and a bend hint (the same two-bone triangle the engine's limb
 * fit solves, so the weapon sweep sees the leg the display will show), and
 * the gap between a lower leg and a struck body.
 */
export namespace StrikingLeg {
  /**
   * The knee of a leg whose ankle is at a goal, bending toward a hint: the
   * triangle of the thigh and the shank in the plane through the hip and the
   * ankle that contains the hint.
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle goal, world metres.
   * @param hint The bend hint, world metres.
   * @returns The knee, world metres.
   */
  export function knee(body: IHumanBody, hip: IAutoMovieVector3, ankle: IAutoMovieVector3, hint: IAutoMovieVector3): IAutoMovieVector3 {
    const m = body.measure;
    const bend: IAutoMovieVector3 = Vector3.subtract(hint, hip);
    const reach: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    const side: IAutoMovieVector3 = Vector3.subtract(bend, Vector3.scale(reach, Vector3.dot(bend, reach) / Math.max(1e-12, Vector3.dot(reach, reach))));
    const safe: IAutoMovieVector3 = Vector3.length(side) > 1e-9 ? bend : Vector3.add(bend, { x: 0, y: 0.1, z: 0 });
    return StrikingReach.chain({ root: hip, point: ankle, upper: m.thigh, along: m.shank, lower: m.shank, bend: safe, flexion: [0, 170], slide: false }).middle;
  }

  /**
   * The signed gap between a lower leg and a struck body: the nearest
   * distance from points along the shank (from a fifth of the way below the
   * knee to the ankle, and the foot's top beyond it) to the body's collision
   * shapes, less the shank's radius. Any part of the shin or the instep that
   * reaches the body is a contact, as a kick lands with whichever part arrives
   * first.
   *
   * @param body The kicking body.
   * @param struck The struck performer.
   * @param knee The knee at the second, world metres.
   * @param ankle The ankle at the second, world metres.
   * @param seconds Film seconds.
   * @returns Metres; non-positive in contact.
   */
  export function gap(
    body: IHumanBody,
    struck: IHumanActionContext.IPerformer,
    knee: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    seconds: number,
  ): number {
    const shapes: StrikingContact.ICollider[] = StrikingBody.colliders(struck.body, struck.bones(seconds));
    let best: number = Infinity;
    for (const share of [0.2, 0.4, 0.6, 0.8, 1]) {
      const p: IAutoMovieVector3 = Vector3.lerp(knee, ankle, share);
      best = Math.min(best, (StrikingContact.nearest(p, shapes)?.distance ?? Infinity) - body.measure.shankRadius);
    }
    return best;
  }
}
