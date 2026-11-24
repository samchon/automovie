import {
  Quaternion,
  Vector3,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditContact } from "../audit/AutoMovieMotionHumanAuditContact";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";
import type { walkReach } from "./walkReach";

/**
 * How far under the floor, metres, a swinging foot's lowest point may stay once
 * its lift is settled, and the width the lift's bisection stops at: a
 * micrometre, a numeric tolerance far under the toe's 15 mm clearance
 * (`walkFoot.CLEARANCE`).
 */
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
/** The record of `IPrepareWalkReachSwingRead`'s site. */
type IPrepareWalkReachSwingRead = {
  ankle: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  low: number;
};

/** The record of `IPrepareWalkReachSwingPlacedResult`'s site. */
type IPrepareWalkReachSwingPlacedResult = {
  ankle: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  low: number;
};

/** The record of `IPrepareWalkReachSwingPlaced`'s site. */
type IPrepareWalkReachSwingPlaced = {
  ankle: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  low: number;
};

/**
 * Prepare one body's swing reach bounds and heel socket for changing feet.
 *
 * @param body The fixed body and leg lengths.
 * @param side The swinging foot.
 * @param bounds The walking reach owner's fixed joint/phase bounds.
 * @returns The swing constraint reader over a settled pelvis and foot: given a
 *   lift solved in preparation, it places the foot there and only raises it by
 *   what still sinks under the clearance, with no search.
 */
export function prepareWalkReachSwing(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  bounds: IBounds,
): (
  settled: walkReach.IGround,
  foot: IAutoMovieMotionHumanWalkFoot.IFoot,
  share?: number,
  leaving?: IAutoMovieVector3,
  given?: number,
) => prepareWalkReachSwing.IReached {
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
    given?: number,
  ): prepareWalkReachSwing.IReached => {
    const h: IAutoMovieVector3 = settled.hips[side];

    // A trunk tilt counts because extension is measured in the settled pelvis.
    const frame: IAutoMovieQuaternion =
      settled.pelvis ??
      humanPostureHeading({ yaw: settled.yaw, pitch: 0, roll: 0 });
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
    const placed: (lift: number) => IPrepareWalkReachSwingPlaced = (
      lift: number,
    ): IPrepareWalkReachSwingPlacedResult => {
      const at: IAutoMovieVector3 =
        lift === 0 ? ankle : { ...ankle, y: ankle.y + lift };
      const turned: IAutoMovieQuaternion = ankleRange(h, at, own);
      return {
        ankle: at,
        rotation: turned,
        low: lowest({ ankle: at, rotation: turned }),
      };
    };

    // The lift that puts the ranged foot's lowest point on its target
    // (search), or the lift prepared for this instant raised by what still
    // sinks (`raise`).
    const read: IPrepareWalkReachSwingRead =
      given === undefined
        ? search(placed, target, h.y - ankle.y)
        : raise(placed(given), target);
    const raised: number = read.ankle.y - ankle.y;
    ankle = read.ankle;
    rotation = read.rotation;
    if (share === undefined)
      return { ankle, rotation, toes: foot.toes, lift: raised };

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
    // foot where the ankle stands. The range is read at that ankle whether or
    // not the reach moved it: near the leg's full extension the shank's lean
    // turns steeply with the ankle, so a range read at the ankle before the
    // anchor's shift differs from the one at the ankle the leg is given (a
    // sprint's trailing foot read 5.8 degrees apart there), and choosing
    // between the two by whether the reach moved the ankle at all flipped
    // the foot on a rounding.
    if (leaving !== undefined && share < 0.5) {
      joined = Vector3.subtract(
        reachOf(joined),
        Vector3.scale(leaving, 1 - held),
      );
      turned = ankleRange(h, joined, asked);
      const under: number = lowest({ ankle: joined, rotation: turned });
      if (under < target) joined = { ...joined, y: joined.y + target - under };
    }
    return { ankle: joined, rotation: turned, toes: foot.toes, lift: raised };
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

/** A ranged foot at a lift: its ankle, rotation and lowest point's height. */
type IPlacedFoot = IPrepareWalkReachSwingRead;

/**
 * The lift that puts a ranged foot's lowest point on its target: lift by each
 * pass's penetration while a pass at least halves it, as fast as a bisection
 * step; a slower pass (a gain over a half, nearing one at a straight leg) hands
 * over to a bisection on the lift, between the last lift and the lift to hip
 * height, where the foot hangs clear of any floor.
 *
 * @param placed The foot at a lift.
 * @param target The lowest point's target height, metres.
 * @param ceiling The lift to hip height, metres.
 * @returns The foot at the lift found.
 */
function search(
  placed: (lift: number) => IPlacedFoot,
  target: number,
  ceiling: number,
): IPlacedFoot {
  let lift: number = 0;
  let read: IPlacedFoot = placed(0);
  while (read.low < target - SETTLED) {
    const next: IPlacedFoot = placed(lift + target - read.low);
    if (
      next.low >= target - SETTLED ||
      target - next.low <= (target - read.low) / 2
    ) {
      lift += target - read.low;
      read = next;
      continue;
    }
    let low: number = lift + target - read.low;
    let high: number = Math.max(low, ceiling);
    let above: IPlacedFoot = placed(high);
    while (high - low > SETTLED) {
      const middle: number = (low + high) / 2;
      const probe: IPlacedFoot = placed(middle);
      if (probe.low >= target) {
        high = middle;
        above = probe;
      } else if (probe.low >= target - SETTLED) {
        above = probe;
        break;
      } else low = middle;
    }
    return raise(above, target);
  }
  return read;
}

/**
 * A ranged foot raised by what its lowest point still sinks under its target,
 * the closed-form last step of search.
 *
 * @param read The foot at a lift.
 * @param target The lowest point's target height, metres.
 * @returns The foot, its lowest point no lower than the target.
 */
function raise(read: IPlacedFoot, target: number): IPlacedFoot {
  return read.low >= target - SETTLED
    ? read
    : {
        ...read,
        ankle: { ...read.ankle, y: read.ankle.y + target - read.low },
        low: target,
      };
}

/** The reader's result. */
export namespace prepareWalkReachSwing {
  /** A foot as reached, with the lift its search found or was given. */
  export interface IReached extends walkFoot.IEnd {
    /** How far the ankle was lifted to clear the floor, metres. */
    lift: number;
  }
}
