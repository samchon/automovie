import { Vector3 } from "@automovie/engine";

import type { IBoutPosture } from "./IBoutPosture";

/**
 * Blend two postures: every channel and goal moves linearly from `from`
 * toward `to` by the weight. A foot lifted in only one of them is lifted in
 * the blend toward or from its planted ankle point `rest`, so a kick leaves
 * and returns to the actual stance placement without a jump.
 *
 * ```ts
 * blendPosture(guard, chamber, envelope, rest);
 * ```
 *
 * @param from The posture at weight 0.
 * @param to The posture at weight 1.
 * @param weight Share of `to`, in [0, 1].
 * @param rest Body-frame ankle points of the planted feet at this instant.
 * @returns The blended posture.
 * @evidence docs/research/kickboxing/techniques.md#laws Shapes connect their keys continuously; a technique leaves and returns to the stance.
 * @evidence contracts/development/common.md#meaningful-documentation States the blend and the lifted-foot rule.
 * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation of channels and points; the weight is clamped so callers can pass raw envelopes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function every layer uses.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No channel is special-cased.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record.
 * @evidence contracts/development/behaviors.md#studied-laws Continuity between studied keys.
 * @evidence contracts/development/behaviors.md#relational-goals Goals stay in the body frame.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
 */
export function blendPosture(
  from: IBoutPosture,
  to: IBoutPosture,
  weight: number,
  rest: Record<"left" | "right", { x: number; y: number; z: number }>,
): IBoutPosture {
  const w: number = Math.max(0, Math.min(1, weight));
  const n = (a: number, b: number): number => a + (b - a) * w;
  const v = Vector3.lerp;
  const record = <T extends Record<string, number>>(a: T, b: T): T =>
    Object.fromEntries(
      Object.keys(a).map((key: string): [string, number] => [
        key,
        n(a[key]!, b[key]!),
      ]),
    ) as T;
  const foot = (side: "left" | "right"): IBoutPosture["feet"]["left"] => {
    const a: IBoutPosture["feet"]["left"] = from.feet[side];
    const b: IBoutPosture["feet"]["left"] = to.feet[side];
    if (a === null && b === null) return null;
    const pa = a ?? { point: rest[side] };
    const pb = b ?? { point: rest[side] };
    if ((a === null && w === 0) || (b === null && w === 1)) return null;
    const knee =
      pa.knee && pb.knee ? v(pa.knee, pb.knee, w) : w < 0.5 ? pa.knee : pb.knee;
    return { point: v(pa.point, pb.point, w), ...(knee ? { knee } : {}) };
  };
  const hand = (side: "left" | "right"): IBoutPosture["hands"]["left"] => {
    const a = from.hands[side];
    const b = to.hands[side];
    const elbow =
      a.elbow && b.elbow ? v(a.elbow, b.elbow, w) : w < 0.5 ? a.elbow : b.elbow;
    return { point: v(a.point, b.point, w), ...(elbow ? { elbow } : {}) };
  };
  return {
    drop: n(from.drop, to.drop),
    shift: record(from.shift, to.shift),
    yaw: n(from.yaw, to.yaw),
    pitch: n(from.pitch, to.pitch),
    roll: n(from.roll, to.roll),
    pelvis: record(from.pelvis, to.pelvis),
    thoracic: record(from.thoracic, to.thoracic),
    lumbar: record(from.lumbar, to.lumbar),
    cervical: record(from.cervical, to.cervical),
    hands: { left: hand("left"), right: hand("right") },
    feet: { left: foot("left"), right: foot("right") },
    pivot: n(from.pivot, to.pivot),
    jaw: n(from.jaw, to.jaw),
    wince: n(from.wince, to.wince),
  };
}
