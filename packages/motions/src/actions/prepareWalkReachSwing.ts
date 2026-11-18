import {
  Quaternion,
  Vector3,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";
import type { walkReach } from "./walkReach";

/** How far under the floor, metres, a swinging foot's lowest point may stay once its lift is settled, and the width the lift's bisection stops at: a micrometre, a numeric tolerance far under the toe's 15 mm clearance (`walkFoot.CLEARANCE`). */
const SETTLED: number = 1e-6;

/** Fixed physical bounds supplied by the walking reach rule's owner. */
interface IBounds {
  /** Minimum knee flexion, degrees. */
  knee: number;

  /** Maximum thigh extension, degrees. */
  extension: number;

  /** Maximum ankle side lean, degrees. */
  side: number;

  /** Maximum hip twist, degrees. */
  twist: number;

  /** Swing share over which the ranges enter or leave. */
  fade: number;
}

/**
 * Prepare one body's swing reach bounds and heel socket for changing feet.
 *
 * @param body The fixed body and leg lengths.
 * @param side The swinging foot.
 * @param bounds The walking reach owner's fixed joint/phase bounds.
 * @returns The swing constraint reader over a settled pelvis and foot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/side/bounds, the varying settled frame and the optional share semantics inherited from walkReach.swing.
 * @evidence contracts/development/implementation.md#principled-implementation Holds the foot inside the leg-length sphere, the thigh-extension cone, the hip-twist clamp (keeping the foot's pitch and roll) and the ankle's side and bending ranges, with the optional boundary fade. A foot the ankle's range turns is raised only where it would otherwise pass into the floor, never back to its scheduled clearance: raising the ankle bends the knee, leans the shank and turns the foot further, a loop whose gain nears one at a straight leg, where a turn of under a degree held the foot centimetres up and released it at a square root's slope.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed reach/range/socket terms precede the one swing reader; walkReach owns the bounds and the entry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ankle range is applied to the foot's own rotation at every trial lift, so the floor reading is one function of the lift and the fixed-point and bisection stages agree, and the foot ends within `SETTLED` of the floor. Fixed-point lifts by the penetration run while each at least halves it; a slower one hands over to a bisection on the lift, bracketed by the last lift and a lift to hip height, which converges while the lowest point rises with the lift (a lift-to-turn gain under one). Should the hip-height lift still leave the foot under the floor, which no reachable pose does, the foot is lifted onto it and keeps that trial's turn.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and bounded constant work per foot; time queries skip body-only reach, range trigonometry and socket lookup. One toe-angle offset serves all trial lifts, and the ankle range is prepared once for the foot's initial heading. Each fixed-point lift at least halves the penetration and the bisection halves its bracket, so a foot costs at most about twenty trials per stage at a micrometre against centimetres of penetration and a metre of bracket.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side and the reach owner's bounds fix this reader. Each foot correction binds its own toe offset and initial heading; every pelvis, ankle, rotation, toe angle and queried share is evaluated for its own query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds fixed body/bound/socket geometry; each correction releases its toe-offset and ankle-range readers on return or throw; no queried foot, hip, rotation or time history is kept.
 */
export function prepareWalkReachSwing(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  bounds: IBounds,
): (settled: walkReach.IGround, foot: IAutoMovieMotionHumanWalkFoot.IFoot, share?: number) => walkFoot.IEnd {
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const limit: number = Math.sqrt(
    m.thigh ** 2 + m.shank ** 2 +
      2 * m.thigh * m.shank * Math.cos((bounds.knee * Math.PI) / 180),
  );
  const extensionAt: number = (bounds.extension * Math.PI) / 180;
  const sideAt: number = Math.tan((bounds.side * Math.PI) / 180);
  const behind: ReturnType<typeof walkLeg.prepareBehind> = walkLeg.prepareBehind(body);
  const heel: ReturnType<typeof HumanFoot.prepareHeight> = HumanFoot.prepareHeight(body, side, "heel");
  const toeAt: ReturnType<typeof HumanFoot.prepareHeight.articulated> = HumanFoot.prepareHeight.articulated(body, side, "toe");
  return (settled: walkReach.IGround, foot: IAutoMovieMotionHumanWalkFoot.IFoot, share?: number): walkFoot.IEnd => {
    const h: IAutoMovieVector3 = settled.hips[side];

    // A trunk tilt counts because extension is measured in the settled pelvis.
    const frame: IAutoMovieQuaternion = settled.pelvis ??
      resolveHumanPosture.heading({ yaw: settled.yaw, pitch: 0, roll: 0 });
    let v: IAutoMovieVector3 = Vector3.subtract(foot.placement.ankle, h);
    const d: number = Vector3.length(v);
    if (d > limit) v = Vector3.scale(v, limit / d);
    const local: IAutoMovieVector3 = Quaternion.rotateVector(Quaternion.inverse(frame), v);

    // The leg's own plane includes its abduction; projecting on the same
    // reach sphere preserves the knee angle at the extension boundary.
    const down: number = Math.hypot(local.x, local.y);
    const beta: number = Math.atan2(local.x, -local.y);
    const extension: number = extensionAt + behind(Vector3.length(v));
    if (local.y < 0 && Math.atan2(-local.z, down) > extension) {
      const reach: number = Math.hypot(local.z, down);
      const y: number = -reach * Math.cos(extension);
      v = Quaternion.rotateVector(frame, {
        x: -y * Math.sin(beta), y: y * Math.cos(beta), z: -reach * Math.sin(extension),
      });
    }
    let ankle: IAutoMovieVector3 = Vector3.add(h, v);
    let rotation: IAutoMovieQuaternion = foot.placement.rotation;
    const off: number = wrapDegrees(HumanFoot.heading(rotation) - settled.yaw);
    if (Math.abs(off) > bounds.twist)
      rotation = HumanFoot.rotation(
        settled.yaw + Math.sign(off) * bounds.twist,
        HumanFoot.pitch(rotation),
        HumanFoot.roll(rotation),
      );

    // A foot held inside the ankle's side range moves under its own hip.
    const across: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: HumanFoot.heading(rotation) },
      { x: 1, y: 0, z: 0 },
    );
    const aside: number = (ankle.x - h.x) * across.x + (ankle.z - h.z) * across.z;
    const most: number = sideAt * Math.max(0, h.y - ankle.y);
    if (Math.abs(aside) > most) {
      const shift: number = aside - Math.sign(aside) * most;
      ankle = { x: ankle.x - shift * across.x, y: ankle.y, z: ankle.z - shift * across.z };
    }

    // Toe articulation is fixed across this foot's ankle/floor search; every
    // trial lift fits the ankle's range again. The lift is only off the
    // floor: restoring the scheduled clearance would feed the turn it
    // answers (a raised ankle leans the shank further).
    const toe: ReturnType<typeof HumanFoot.prepareHeight> = toeAt(foot.toes);
    const lowest: (placement: IAutoMovieMotionHumanFoot.IPlacement) => number = (placement: IAutoMovieMotionHumanFoot.IPlacement): number =>
      Math.min(toe(placement), heel(placement));
    const ankleRange: ReturnType<typeof walkLeg.prepareAnkleRange> = walkLeg.prepareAnkleRange(body, HumanFoot.heading(rotation));

    // The lowest point after the ankle's range, with the ankle lifted by `lift`
    // and the range always applied to the foot's own rotation, so the reading
    // is one function of the lift whatever the trials before it: it rises
    // with the lift at one less the lift-to-turn gain, so while that gain
    // stays under one it is increasing and the lift that puts the foot on the
    // floor is its root.
    const own: IAutoMovieQuaternion = rotation;
    const placed: (lift: number) => { ankle: IAutoMovieVector3; rotation: IAutoMovieQuaternion; low: number } = (lift: number): { ankle: IAutoMovieVector3; rotation: IAutoMovieQuaternion; low: number } => {
      const at: IAutoMovieVector3 = lift === 0 ? ankle : { ...ankle, y: ankle.y + lift };
      const turned: IAutoMovieQuaternion = ankleRange(h, at, own);
      return { ankle: at, rotation: turned, low: lowest({ ankle: at, rotation: turned }) };
    };

    // Lift by each pass's penetration while a pass at least halves it, as fast
    // as a bisection step; a slower pass (a gain over a half, nearing one at a
    // straight leg) hands over to a bisection on the lift, between the last
    // lift and the lift to hip height, where the foot hangs clear of any floor.
    let lift: number = 0;
    let read: { ankle: IAutoMovieVector3; rotation: IAutoMovieQuaternion; low: number } = placed(0);
    while (read.low < -SETTLED) {
      const next: { ankle: IAutoMovieVector3; rotation: IAutoMovieQuaternion; low: number } = placed(lift - read.low);
      if (next.low >= -SETTLED || -next.low <= -read.low / 2) {
        lift -= read.low;
        read = next;
        continue;
      }
      let low: number = lift - read.low;
      let high: number = Math.max(low, h.y - ankle.y);
      let above: { ankle: IAutoMovieVector3; rotation: IAutoMovieQuaternion; low: number } = placed(high);
      while (high - low > SETTLED) {
        const middle: number = (low + high) / 2;
        const probe: { ankle: IAutoMovieVector3; rotation: IAutoMovieQuaternion; low: number } = placed(middle);
        if (probe.low >= 0) {
          high = middle;
          above = probe;
        } else if (probe.low >= -SETTLED) {
          above = probe;
          break;
        } else low = middle;
      }
      read = above.low >= -SETTLED ? above : { ...above, ankle: { ...above.ankle, y: above.ankle.y - above.low }, low: 0 };
      break;
    }
    ankle = read.ankle;
    rotation = read.rotation;
    if (share === undefined) return { ankle, rotation, toes: foot.toes };

    // The caller's nonstandard stance endpoints retain the same range fade.
    const held: number = Math.min(
      minimumJerk.share(Math.min(1, Math.max(0, share) / bounds.fade)),
      minimumJerk.share(Math.min(1, Math.max(0, 1 - share) / bounds.fade)),
    );
    let joined: IAutoMovieVector3 = Vector3.lerp(foot.placement.ankle, ankle, held);
    const turned: IAutoMovieQuaternion = Quaternion.slerp(foot.placement.rotation, rotation, held);
    const low: number = lowest({ ankle: joined, rotation: turned });
    if (low < 0) joined = { ...joined, y: joined.y - low };
    return { ankle: joined, rotation: turned, toes: foot.toes };
  };
}
