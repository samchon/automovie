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

import { AutoMovieMotionHumanAuditContact } from "../audit/AutoMovieMotionHumanAuditContact";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { walkFoot } from "./walkFoot";
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
 * @evidence contracts/development/implementation.md#principled-implementation Holds the foot inside the leg-length sphere, the thigh-extension cone, the hip-twist clamp (keeping the foot's pitch and roll) and the ankle's side and bending ranges, with the optional boundary fade. A foot the ankle's range turns is raised to its scheduled low point but no higher than the least toe clearance of walking (`walkFoot.CLEARANCE`), never back to a higher scheduled clearance: raising the ankle bends the knee, leans the shank and turns the foot further, a loop whose gain nears one at a straight leg, so the target stays the few millimetres every swing keeps over the floor's contact height. While the reach ranges fade in, the scheduled foot's lowest sole socket keeps its horizontal place, so the ankle range's turn about the ankle does not slide the anchor `walkFoot` holds at the departure.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed reach/range/socket terms precede the one swing reader; walkReach owns the bounds and the entry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ankle range is applied to the foot's own rotation at every trial lift, so the floor reading is one function of the lift and the fixed-point and bisection stages agree, and the foot ends within `SETTLED` of its target height. Fixed-point lifts by the penetration run while each at least halves it; a slower one hands over to a bisection on the lift, bracketed by the last lift and a lift to hip height, which converges while the lowest point rises with the lift (a lift-to-turn gain under one). Should the hip-height lift still leave the foot under the floor, which no reachable pose does, the foot is lifted onto it and keeps that trial's turn.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and bounded constant work per foot; time queries skip body-only reach, range trigonometry and socket lookup. One toe-angle offset serves all trial lifts, and the ankle range is prepared once for the foot's initial heading. Each fixed-point lift at least halves the penetration and the bisection halves its bracket, so a foot costs at most about twenty trials per stage at a micrometre against centimetres of penetration and a metre of bracket.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side and the reach owner's bounds fix this reader. Each foot correction binds its own toe offset and initial heading; every pelvis, ankle, rotation, toe angle and queried share is evaluated for its own query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds fixed body/bound/socket geometry; each correction releases its toe-offset and ankle-range readers on return or throw; no queried foot, hip, rotation or time history is kept.
 */
export function prepareWalkReachSwing(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  bounds: IBounds,
): (
  settled: walkReach.IGround,
  foot: IAutoMovieMotionHumanWalkFoot.IFoot,
  share?: number,
  leaving?: IAutoMovieVector3,
) => walkFoot.IEnd {
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const limit: number = Math.sqrt(
    m.thigh ** 2 +
      m.shank ** 2 +
      2 * m.thigh * m.shank * Math.cos((bounds.knee * Math.PI) / 180),
  );
  const extensionAt: number = (bounds.extension * Math.PI) / 180;
  const sideAt: number = Math.tan((bounds.side * Math.PI) / 180);
  const behind: ReturnType<typeof walkLeg.prepareBehind> =
    walkLeg.prepareBehind(body);
  const heel: ReturnType<typeof HumanFoot.prepareHeight> =
    HumanFoot.prepareHeight(body, side, "heel");
  const toeAt: ReturnType<typeof HumanFoot.prepareHeight.articulated> =
    HumanFoot.prepareHeight.articulated(body, side, "toe");
  return (
    settled: walkReach.IGround,
    foot: IAutoMovieMotionHumanWalkFoot.IFoot,
    share?: number,
    leaving?: IAutoMovieVector3,
  ): walkFoot.IEnd => {
    const h: IAutoMovieVector3 = settled.hips[side];

    // A trunk tilt counts because extension is measured in the settled pelvis.
    const frame: IAutoMovieQuaternion =
      settled.pelvis ??
      resolveHumanPosture.heading({ yaw: settled.yaw, pitch: 0, roll: 0 });
    // The ankle the leg reaches nearest a point: within the leg's length,
    // and, past the thigh's extension and the knee's bend behind the hip,
    // the thigh stopped at its extension and the shank folded toward the
    // point, the early swing's heel recovery, the knee bending as the foot
    // trails (on the boundary itself it is the point).
    const reachOf = (point: IAutoMovieVector3): IAutoMovieVector3 => {
      let v: IAutoMovieVector3 = Vector3.subtract(point, h);
      const d: number = Vector3.length(v);
      if (d > limit) v = Vector3.scale(v, limit / d);
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(frame),
        v,
      );
      // The leg's own plane includes its abduction.
      const down: number = Math.hypot(local.x, local.y);
      const beta: number = Math.atan2(local.x, -local.y);
      const extension: number = extensionAt + behind(Vector3.length(v));
      // A walking leg keeps the hip-to-ankle distance and its knee angle at
      // the extension boundary; a running one (given its departure) folds.
      if (
        leaving === undefined &&
        local.y < 0 &&
        Math.atan2(-local.z, down) > extension
      ) {
        const reach: number = Math.hypot(local.z, down);
        const y: number = -reach * Math.cos(extension);
        v = Quaternion.rotateVector(frame, {
          x: -y * Math.sin(beta),
          y: y * Math.cos(beta),
          z: -reach * Math.sin(extension),
        });
      } else if (local.y < 0 && Math.atan2(-local.z, down) > extension) {
        const knee: IAutoMovieVector3 = {
          x: m.thigh * Math.cos(extensionAt) * Math.sin(beta),
          y: -m.thigh * Math.cos(extensionAt) * Math.cos(beta),
          z: -m.thigh * Math.sin(extensionAt),
        };
        const shank: IAutoMovieVector3 = Vector3.subtract(local, knee);
        const length: number = Vector3.length(shank);
        v = Quaternion.rotateVector(
          frame,
          length > 0
            ? Vector3.add(knee, Vector3.scale(shank, m.shank / length))
            : knee,
        );
      }
      return Vector3.add(h, v);
    };
    let ankle: IAutoMovieVector3 = reachOf(foot.placement.ankle);
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
    const aside: number =
      (ankle.x - h.x) * across.x + (ankle.z - h.z) * across.z;
    const most: number = sideAt * Math.max(0, h.y - ankle.y);
    if (Math.abs(aside) > most) {
      const shift: number = aside - Math.sign(aside) * most;
      ankle = {
        x: ankle.x - shift * across.x,
        y: ankle.y,
        z: ankle.z - shift * across.z,
      };
    }

    // Toe articulation is fixed across this foot's ankle/floor search; every
    // trial lift fits the ankle's range again. The lift reaches at most the
    // least toe clearance: restoring a higher scheduled clearance would feed
    // the turn it answers (a raised ankle leans the shank further).
    const toe: ReturnType<typeof HumanFoot.prepareHeight> = toeAt(foot.toes);
    const lowest: (
      placement: IAutoMovieMotionHumanFoot.IPlacement,
    ) => number = (placement: IAutoMovieMotionHumanFoot.IPlacement): number =>
      Math.min(toe(placement), heel(placement));
    const ankleRange: ReturnType<typeof walkLeg.prepareAnkleRange> =
      walkLeg.prepareAnkleRange(body, HumanFoot.heading(rotation));

    // The lowest point after the ankle's range, with the ankle lifted by `lift`
    // and the range always applied to the foot's own rotation, so the reading
    // is one function of the lift whatever the trials before it: it rises
    // with the lift at one less the lift-to-turn gain, so while that gain
    // stays under one it is increasing and the lift that puts the foot on the
    // floor is its root.
    const own: IAutoMovieQuaternion = rotation;

    // The height the ranged foot's lowest point is lifted to: where the
    // swing carried it, but no higher than the least toe clearance of
    // walking (`walkFoot.CLEARANCE`), which every walk's swing keeps
    // through its middle; so a foot the range turns toes-down still clears
    // the floor's contact height while it travels.
    const target: number = Math.min(
      Math.max(0, lowest(foot.placement)),
      walkFoot.CLEARANCE,
    );
    const placed: (lift: number) => {
      ankle: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
      low: number;
    } = (
      lift: number,
    ): {
      ankle: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
      low: number;
    } => {
      const at: IAutoMovieVector3 =
        lift === 0 ? ankle : { ...ankle, y: ankle.y + lift };
      const turned: IAutoMovieQuaternion = ankleRange(h, at, own);
      return {
        ankle: at,
        rotation: turned,
        low: lowest({ ankle: at, rotation: turned }),
      };
    };

    // Lift by each pass's penetration while a pass at least halves it, as fast
    // as a bisection step; a slower pass (a gain over a half, nearing one at a
    // straight leg) hands over to a bisection on the lift, between the last
    // lift and the lift to hip height, where the foot hangs clear of any floor.
    let lift: number = 0;
    let read: {
      ankle: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
      low: number;
    } = placed(0);
    while (read.low < target - SETTLED) {
      const next: {
        ankle: IAutoMovieVector3;
        rotation: IAutoMovieQuaternion;
        low: number;
      } = placed(lift + target - read.low);
      if (
        next.low >= target - SETTLED ||
        target - next.low <= (target - read.low) / 2
      ) {
        lift += target - read.low;
        read = next;
        continue;
      }
      let low: number = lift + target - read.low;
      let high: number = Math.max(low, h.y - ankle.y);
      let above: {
        ankle: IAutoMovieVector3;
        rotation: IAutoMovieQuaternion;
        low: number;
      } = placed(high);
      while (high - low > SETTLED) {
        const middle: number = (low + high) / 2;
        const probe: {
          ankle: IAutoMovieVector3;
          rotation: IAutoMovieQuaternion;
          low: number;
        } = placed(middle);
        if (probe.low >= target) {
          high = middle;
          above = probe;
        } else if (probe.low >= target - SETTLED) {
          above = probe;
          break;
        } else low = middle;
      }
      read =
        above.low >= target - SETTLED
          ? above
          : {
              ...above,
              ankle: { ...above.ankle, y: above.ankle.y + target - above.low },
              low: target,
            };
      break;
    }
    ankle = read.ankle;
    rotation = read.rotation;
    if (share === undefined) return { ankle, rotation, toes: foot.toes };

    // Stances outside the leg's reach are left and joined where they stand:
    // the reach ranges fade in from the departure and out into the landing.
    // The ankle's range does not fade in: a foot leaving the floor bears
    // nothing from that instant, and the stance it leaves already holds it
    // inside the unloaded limit (`walkReachStance`), so a quickly folding knee
    // cannot carry it past the limit while the reach ranges come in.
    const held: number = Math.min(
      minimumJerk.share(Math.min(1, Math.max(0, share) / bounds.fade)),
      minimumJerk.share(Math.min(1, Math.max(0, 1 - share) / bounds.fade)),
    );
    let joined: IAutoMovieVector3 = Vector3.lerp(
      foot.placement.ankle,
      ankle,
      held,
    );
    // A landing joins the stance it reaches, which turns its ankle by its
    // own rocker and may stand a little past this swing's clamp (within the
    // margin it keeps inside the limit, `walkLeg.ANKLE`): the range goes
    // with the reach ranges into a landing, so the swing lands on that
    // stance's foot. Only a turn in place fades into its landing.
    const asked: IAutoMovieQuaternion = Quaternion.slerp(
      foot.placement.rotation,
      rotation,
      held,
    );
    const ranged: IAutoMovieQuaternion = ankleRange(h, joined, asked);
    let turned: IAutoMovieQuaternion =
      share > 0.5 ? Quaternion.slerp(asked, ranged, held) : ranged;
    const low: number = lowest({ ankle: joined, rotation: turned });
    if (low < target) joined = { ...joined, y: joined.y + target - low };

    // The ankle's range turns the foot about the ankle, which moves the
    // sole point the swing holds at its departure (`walkFoot`'s anchor, its
    // lowest socket): while the reach ranges come in, and while that point
    // is still within the floor's contact height (released as it rises to
    // twice that height), it keeps the horizontal place the swing gave it,
    // so a foot the range turns still lifts before it travels.
    const contact: number = AutoMovieMotionHumanAuditContact.HEIGHT;
    const risen: number = minimumJerk.share(
      Math.min(
        1,
        Math.max(
          0,
          (lowest({ ankle: joined, rotation: turned }) - contact) / contact,
        ),
      ),
    );
    // Only the departure half holds it: a landing joins the stance the reach
    // settled, not the swing's scheduled sole.
    const anchored: number = Math.max(1 - held, share < 0.5 ? 1 - risen : 0);
    if (anchored > 0) {
      const anchor: IAutoMovieMotionHumanFoot.Socket = lowestSocket(
        foot.placement,
        foot.toes,
      );
      const scheduled: IAutoMovieVector3 = HumanFoot.point(
        body,
        side,
        anchor,
        foot.placement,
        foot.toes,
      );
      const reached: IAutoMovieVector3 = HumanFoot.point(
        body,
        side,
        anchor,
        { ankle: joined, rotation: turned },
        foot.toes,
      );
      joined = {
        x: joined.x + (scheduled.x - reached.x) * anchored,
        y: joined.y,
        z: joined.z + (scheduled.z - reached.z) * anchored,
      };
    }
    // Given the departing stance's own excess outside the reach (its reach
    // less its ankle), the departure half holds the reach from the toe-off
    // and fades out only that excess, an offset decaying from the departure
    // where the reach equals the stance it leaves: a stance left inside the
    // reach (a sprint's trailing foot at its thigh's extension) is never
    // left behind it while the hip runs on; the ankle's range then turns the
    // foot where the ankle stands.
    if (leaving !== undefined && share < 0.5) {
      const reached: IAutoMovieVector3 = Vector3.subtract(
        reachOf(joined),
        Vector3.scale(leaving, 1 - held),
      );
      if (Vector3.distance(reached, joined) > 0) {
        joined = reached;
        turned = ankleRange(h, joined, asked);
        const under: number = lowest({ ankle: joined, rotation: turned });
        if (under < target)
          joined = { ...joined, y: joined.y + target - under };
      }
    }
    return { ankle: joined, rotation: turned, toes: foot.toes };
  };

  /** The sole socket lowest in a placement, the heel winning a tie. */
  function lowestSocket(
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    toes: number,
  ): IAutoMovieMotionHumanFoot.Socket {
    let best: IAutoMovieMotionHumanFoot.Socket = "heel";
    let height: number = Infinity;
    for (const socket of HumanFoot.SOCKETS) {
      const y: number = HumanFoot.point(body, side, socket, placement, toes).y;
      if (y < height) {
        height = y;
        best = socket;
      }
    }
    return best;
  }
}
