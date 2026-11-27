import { Vector3, AutoMovieEngineMath, AutoMovieEngineCompositionPose } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieVector3,
} from "@automovie/interface";

import { handshakeOffer } from "./handshakeOffer";
import type { handshakeReach } from "./handshakeReach";

/**
 * The meeting, or the bound it missed: `point` without the refusal, which the
 * refusal reads again to find the band of gaps that would plan.
 *
 * @param a One partner's body and acting shoulder joint in world metres.
 * @param b The other's.
 * @param side The shaking hand of both.
 * @param pump How far the hands travel below the point after meeting, metres.
 * @returns The meeting, or the bound it missed with its measured value.
 */
export function handshakeOfferAttempt(
  a: handshakeOffer.ISide,
  b: handshakeOffer.ISide,
  side: AutoMovieHumanSide,
  pump: number,
): handshakeReach.IAttempt {
  const span: IAutoMovieVector3 = Vector3.subtract(b.shoulder, a.shoulder);
  const gap: number = Math.hypot(span.x, span.z);
  const missed = (miss: handshakeReach.IMiss): handshakeReach.IAttempt => ({
    kind: "missed",
    miss,
  });
  if (!(gap > 1e-9)) return missed({ bound: "apart", gap });
  // The chests touch when the acting shoulders, each half its chest's
  // depth behind it, stand the two half depths apart.
  const chests: number =
    (a.body.measure.chestDepth + b.body.measure.chestDepth) / 2;
  if (gap < chests) return missed({ bound: "chests", gap, chests });
  const lower: [number, number] = [
    handshakeOffer.forearm(a.body, side),
    handshakeOffer.forearm(b.body, side),
  ];
  const elbow = (
    one: handshakeOffer.ISide,
    ahead: number,
    degrees: number,
  ): IAutoMovieVector3 => {
    const flexion: number = (degrees * Math.PI) / 180;
    const forward: number =
      (ahead * one.body.measure.upperArm * Math.sin(flexion)) / gap;
    return {
      x: one.shoulder.x + forward * span.x,
      y: one.shoulder.y - one.body.measure.upperArm * Math.cos(flexion),
      z: one.shoulder.z + forward * span.z,
    };
  };
  const forearms: number = lower[0] + lower[1];
  const apart = (elbows: [IAutoMovieVector3, IAutoMovieVector3]): number =>
    Vector3.length(Vector3.subtract(elbows[1], elbows[0]));
  const far = (
    elbows: [IAutoMovieVector3, IAutoMovieVector3],
  ): handshakeReach.IMiss => ({
    bound: "far",
    gap,
    elbows: apart(elbows),
    forearms,
  });
  const meet = (
    elbows: [IAutoMovieVector3, IAutoMovieVector3],
  ): IAutoMovieVector3 =>
    AutoMovieEngineCompositionPose.mutualGoal({
      a: {
        shoulder: elbows[0],
        reach: lower[0],
        limit: lower[0] * (1 + 1e-9),
      },
      b: {
        shoulder: elbows[1],
        reach: lower[1],
        limit: lower[1] * (1 + 1e-9),
      },
    }).point;
  // How far the pump's lowest point lies from one partner's shoulder, and
  // how far that arm reaches with its elbow flexed EXTENDED.
  const bottom = (
    met: IAutoMovieVector3,
    i: AttemptBottomI,
  ): IAttemptBottomResult => ({
    distance: Vector3.length(
      Vector3.subtract(
        { ...met, y: met.y - pump },
        i === 0 ? a.shoulder : b.shoulder,
      ),
    ),
    reach: handshakeOffer.reach(
      (i === 0 ? a : b).body.measure.upperArm,
      lower[i],
    ),
  });
  const within = (met: IAutoMovieVector3, i: AttemptWithinI): boolean => {
    const read: IAttemptWithinRead = bottom(met, i);
    return read.distance <= read.reach;
  };
  // The pump's miss of the partner who overreaches it most.
  const deep = (
    elbows: [IAutoMovieVector3, IAutoMovieVector3],
  ): handshakeReach.IMiss => {
    const met: IAutoMovieVector3 = meet(elbows);
    const reads: [IAttemptDeepReads, IAttemptDeepReads2] = [
      bottom(met, 0),
      bottom(met, 1),
    ];
    const i: AttemptDeepI =
      reads[0].distance - reads[0].reach >= reads[1].distance - reads[1].reach
        ? 0
        : 1;
    return {
      bound: "pump",
      gap,
      partner: i,
      flexed: handshakeOffer.EXTENDED,
      ...reads[i],
    };
  };

  const offered: [IAutoMovieVector3, IAutoMovieVector3] = [
    elbow(a, 1, handshakeOffer.SHOULDER),
    elbow(b, -1, handshakeOffer.SHOULDER),
  ];
  let elbows: [IAutoMovieVector3, IAutoMovieVector3] = offered;
  // Each upper arm's flexion from hanging, degrees, as the rules below set it.
  let angles: [number, number] = [
    handshakeOffer.SHOULDER,
    handshakeOffer.SHOULDER,
  ];
  if (apart(offered) > forearms) {
    // Too far for the offering arms: both upper arms come forward.
    const raised = (
      degrees: number,
    ): [IAutoMovieVector3, IAutoMovieVector3] => [
      elbow(a, 1, degrees),
      elbow(b, -1, degrees),
    ];
    if (apart(raised(90)) > forearms) return missed(far(raised(90)));
    const high: number = AutoMovieEngineMath.bracketedBisection(
      (degrees: number): boolean => apart(raised(degrees)) > forearms,
      handshakeOffer.SHOULDER,
      90,
      (90 - handshakeOffer.SHOULDER) / 2 ** 40,
    );
    elbows = raised(high);
    angles = [high, high];
  } else {
    // The higher elbow's upper arm lowers while its palm would overreach.
    const top: AttemptTop = offered[0].y >= offered[1].y ? 0 : 1;
    const lowered = (
      degrees: number,
    ): [IAutoMovieVector3, IAutoMovieVector3] =>
      top === 0
        ? [elbow(a, 1, handshakeOffer.SHOULDER - degrees), offered[1]]
        : [offered[0], elbow(b, -1, handshakeOffer.SHOULDER - degrees)];
    const short = (degrees: number): boolean => {
      const tried: [IAutoMovieVector3, IAutoMovieVector3] = lowered(degrees);
      return apart(tried) <= forearms && !within(meet(tried), top);
    };
    // A height difference is the higher arm's to take. Elbows at one height
    // have no higher arm: when both pump bottoms overreach there, the
    // partners stand near and the near rule below brings both arms back
    // together, so the meeting is the same for either order.
    const other: AttemptOther = top === 0 ? 1 : 0;
    if (
      short(0) &&
      (offered[0].y !== offered[1].y || within(meet(offered), other))
    ) {
      // Lowered to hanging and still overreaching, the arm is left hanging
      // and the near rule below brings both arms back together.
      const high: number = short(handshakeOffer.SHOULDER)
        ? handshakeOffer.SHOULDER
        : AutoMovieEngineMath.bracketedBisection(
            short,
            0,
            handshakeOffer.SHOULDER,
            handshakeOffer.SHOULDER / 2 ** 40,
          );
      elbows = lowered(high);
      angles =
        top === 0
          ? [handshakeOffer.SHOULDER - high, handshakeOffer.SHOULDER]
          : [handshakeOffer.SHOULDER, handshakeOffer.SHOULDER - high];
      if (apart(elbows) > forearms) return missed(far(elbows));
    }
  }
  let met: IAutoMovieVector3 = meet(elbows);
  if (!within(met, 0) || !within(met, 1)) {
    // The elbows stand so near that the forearms meet steeper than the
    // offering slope and straighten an arm past EXTENDED at the bottom of
    // the pump: both upper arms come back together, by the least common
    // angle at which both pump bottoms lie within reach.
    const back = (degrees: number): [IAutoMovieVector3, IAutoMovieVector3] => [
      elbow(a, 1, Math.max(0, angles[0] - degrees)),
      elbow(b, -1, Math.max(0, angles[1] - degrees)),
    ];
    const holds = (degrees: number): boolean => {
      const tried: [IAutoMovieVector3, IAutoMovieVector3] = back(degrees);
      if (apart(tried) > forearms) return true;
      const at: IAutoMovieVector3 = meet(tried);
      return within(at, 0) && within(at, 1);
    };
    if (!holds(handshakeOffer.RETRACT))
      return missed(deep(back(handshakeOffer.RETRACT)));
    const step: number = handshakeOffer.RETRACT / 2 ** 40;
    const high: number = AutoMovieEngineMath.bracketedBisection(
      (degrees: number): boolean => !holds(degrees),
      0,
      handshakeOffer.RETRACT,
      step,
    );
    elbows = back(high);
    // Brought back until they part beyond the forearms before both pump
    // bottoms reach: the pump is missed where the elbows still met, one
    // bisection step short of the bound.
    if (apart(elbows) > forearms)
      return missed(deep(back(Math.max(0, high - step))));
    met = meet(elbows);
    if (!within(met, 0) || !within(met, 1)) return missed(deep(elbows));
  }

  // Partners so near that the arms pass each other have no meeting: each
  // elbow stays on its own partner's side, and the hands meet between the
  // two shoulders.
  const ahead = (p: IAutoMovieVector3): number =>
    ((p.x - a.shoulder.x) * span.x + (p.z - a.shoulder.z) * span.z) / gap;
  if (
    ahead(elbows[1]) <= ahead(elbows[0]) ||
    ahead(met) <= 0 ||
    ahead(met) >= gap
  )
    return missed({ bound: "cross", gap });
  // The hands lie along the bisector of the two forearms: level between
  // equal partners, tilted down from the higher elbow's side otherwise.
  const slopes: [number, number] = [
    Math.asin(Math.max(-1, Math.min(1, (elbows[0].y - met.y) / lower[0]))),
    Math.asin(Math.max(-1, Math.min(1, (elbows[1].y - met.y) / lower[1]))),
  ];
  const tilt: number = (slopes[0] - slopes[1]) / 2;
  return {
    kind: "met",
    meeting: {
      point: met,
      fingers: {
        x: (Math.cos(tilt) * span.x) / gap,
        y: -Math.sin(tilt),
        z: (Math.cos(tilt) * span.z) / gap,
      },
    },
  };
}

/** The alternatives of `AttemptOther`'s site. */
type AttemptOther = 0 | 1;

/** The alternatives of `AttemptTop`'s site. */
type AttemptTop = 0 | 1;

/** The alternatives of `AttemptDeepI`'s site. */
type AttemptDeepI = 0 | 1;

/** The record of `IAttemptDeepReads2`'s site. */
type IAttemptDeepReads2 = { distance: number; reach: number };

/** The record of `IAttemptDeepReads`'s site. */
type IAttemptDeepReads = { distance: number; reach: number };

/** The record of `IAttemptWithinRead`'s site. */
type IAttemptWithinRead = { distance: number; reach: number };

/** The alternatives of `AttemptWithinI`'s site. */
type AttemptWithinI = 0 | 1;

/** The record of `IAttemptBottomResult`'s site. */
type IAttemptBottomResult = { distance: number; reach: number };

/** The alternatives of `AttemptBottomI`'s site. */
type AttemptBottomI = 0 | 1;
