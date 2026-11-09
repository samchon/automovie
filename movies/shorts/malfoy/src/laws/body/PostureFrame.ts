import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBodyPosture } from "./IBodyPosture";

/**
 * The posture arithmetic every shape law shares: a body frame from heading,
 * pitch and roll; the trunk frame a posture's lean bends forward; points
 * placed in that trunk frame; and blends between postures. Postures are
 * figure-independent goals (pelvis, angles, hand and foot points) that any
 * limb fitter turns into a figure.
 *
 * ```ts
 * PostureFrame.onTrunk(posture, 0.3, 0.16, 0.4); // a point in front of the chest
 * PostureFrame.blend(a, b, 0.5);
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frames, their axes and units.
 */
export namespace PostureFrame {
  /** Three unit axes. */
  export interface IFrame {
    /** Forward. */
    forward: IAutoMovieVector3;

    /** Up. */
    up: IAutoMovieVector3;

    /** The own left. */
    left: IAutoMovieVector3;
  }

  /**
   * The body frame of a heading (radians from +Z toward +X), pitched
   * front-up and rolled left-side-down.
   *
   * @param heading Radians.
   * @param pitch Radians, front up.
   * @param roll Radians, left side down.
   * @returns The frame.
   */
  export function frame(heading: number, pitch: number = 0, roll: number = 0): IFrame {
    const f0: IAutoMovieVector3 = { x: Math.sin(heading), y: 0, z: Math.cos(heading) };
    const l0: IAutoMovieVector3 = { x: Math.cos(heading), y: 0, z: -Math.sin(heading) };
    const u0: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const f1: IAutoMovieVector3 = add(scale(f0, Math.cos(pitch)), scale(u0, Math.sin(pitch)));
    const u1: IAutoMovieVector3 = add(scale(u0, Math.cos(pitch)), scale(f0, -Math.sin(pitch)));
    return {
      forward: f1,
      up: add(scale(u1, Math.cos(roll)), scale(l0, Math.sin(roll))),
      left: add(scale(l0, Math.cos(roll)), scale(u1, -Math.sin(roll))),
    };
  }

  /**
   * The trunk frame of a posture: its body frame with the lean bending the
   * up axis forward.
   *
   * @param p The posture.
   * @returns The trunk frame.
   */
  export function trunk(p: IBodyPosture): IFrame {
    const f: IFrame = frame(p.heading, p.pitch, p.roll);
    const c: number = Math.cos(p.lean);
    const s: number = Math.sin(p.lean);
    return { up: add(scale(f.up, c), scale(f.forward, s)), forward: add(scale(f.forward, c), scale(f.up, -s)), left: f.left };
  }

  /**
   * A point in the trunk frame: forward, to the own left and up from the pelvis.
   *
   * @param p The posture.
   * @param forward Metres.
   * @param left Metres.
   * @param up Metres.
   * @returns World metres.
   */
  export function onTrunk(p: IBodyPosture, forward: number, left: number, up: number): IAutoMovieVector3 {
    const t: IFrame = trunk(p);
    return add(p.pelvis, add(add(scale(t.forward, forward), scale(t.left, left)), scale(t.up, up)));
  }

  /**
   * A blend of two postures: points and angles interpolated, headings along
   * the shorter turn.
   *
   * @param a From.
   * @param b To.
   * @param k Share of `b`.
   * @returns A new posture.
   */
  export function blend(a: IBodyPosture, b: IBodyPosture, k: number): IBodyPosture {
    const turn: number = Math.atan2(Math.sin(b.heading - a.heading), Math.cos(b.heading - a.heading));
    const foot = (x: IBodyPosture.IFoot, y: IBodyPosture.IFoot): IBodyPosture.IFoot => ({ point: lerp(x.point, y.point, k), toes: lerp(x.toes, y.toes, k), knee: lerp(x.knee, y.knee, k) });

    // Hands ride the body: their points blend in each posture's own pelvis
    // and heading frame, so a turn carries the arms round instead of
    // swinging them along the chord between two world points.
    const pelvis: IAutoMovieVector3 = lerp(a.pelvis, b.pelvis, k);
    const heading: number = a.heading + turn * k;
    const local = (p: IAutoMovieVector3, from: IBodyPosture): IAutoMovieVector3 => {
      const f: IFrame = frame(from.heading);
      const v: IAutoMovieVector3 = { x: p.x - from.pelvis.x, y: p.y - from.pelvis.y, z: p.z - from.pelvis.z };
      return { x: v.x * f.forward.x + v.z * f.forward.z, y: v.y, z: v.x * f.left.x + v.z * f.left.z };
    };
    const blended: IFrame = frame(heading);
    const world = (q: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: pelvis.x + blended.forward.x * q.x + blended.left.x * q.z,
      y: pelvis.y + q.y,
      z: pelvis.z + blended.forward.z * q.x + blended.left.z * q.z,
    });
    const carried = (x: IAutoMovieVector3, y: IAutoMovieVector3): IAutoMovieVector3 => world(lerp(local(x, a), local(y, b), k));
    const hand = (x: IBodyPosture.IHand, y: IBodyPosture.IHand): IBodyPosture.IHand => ({
      point: carried(x.point, y.point),
      elbow: carried(x.elbow, y.elbow),
      palm: lerp(x.palm, y.palm, k),
    });
    return {
      pelvis,
      heading,
      pitch: a.pitch + (b.pitch - a.pitch) * k,
      roll: a.roll + (b.roll - a.roll) * k,
      lean: a.lean + (b.lean - a.lean) * k,
      twist: a.twist + (b.twist - a.twist) * k,
      headYaw: a.headYaw + (b.headYaw - a.headYaw) * k,
      headPitch: a.headPitch + (b.headPitch - a.headPitch) * k,
      feet: { left: foot(a.feet.left, b.feet.left), right: foot(a.feet.right, b.feet.right) },
      hands: { left: hand(a.hands.left, b.hands.left), right: hand(a.hands.right, b.hands.right) },
    };
  }

  /**
   * Smoothstep of a share clamped to [0, 1].
   *
   * @param u Share.
   * @returns Eased share.
   */
  export function smooth(u: number): number {
    const k: number = Math.max(0, Math.min(1, u));
    return k * k * (3 - 2 * k);
  }

  /**
   * A point between two points.
   *
   * @param a From.
   * @param b To.
   * @param k Share of `b`.
   * @returns The point.
   */
  export function lerp(a: IAutoMovieVector3, b: IAutoMovieVector3, k: number): IAutoMovieVector3 {
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
  }

  function add(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  function scale(a: IAutoMovieVector3, s: number): IAutoMovieVector3 {
    return { x: a.x * s, y: a.y * s, z: a.z * s };
  }
}
