import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBowlingSlide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";

/** The authored final glide of a one-handed bowling approach. */
type Parameters = IAutoMovieMotionHumanBowlingSlide.IParams;

/** How a foot meets the lane in one window: a fixed plant or a bearing slide. */
type FootSupport = "plant" | "bear";

/**
 * The swinging toe's least clearance over the floor, metres: the minimum toe
 * clearance of gait, 12.9 mm (Winter 1992).
 */
const TOE_CLEARANCE: number = 0.0129;

/**
 * The share of the recovery step in which the trailing foot only comes down:
 * terminal swing, the last third of a swing (Perry and Burnfield, Gait
 * Analysis, 2nd ed.).
 */
const TERMINAL: number = 1 / 3;

/**
 * The share of the leg's length the trailing leg reaches behind, its knee just
 * short of straight (provisional, the stroke address's leg reach).
 */
const REACH: number = 0.98;

/**
 * Carry the body on the sliding foot opposite the delivery hand.
 *
 * Seiferheld et al. (2023), section 1 and Figure 2, place the final slide after
 * the dominant foot's push and the ball release after its braking. The authored
 * interval controls that glide. A throw can overlay the base without changing
 * the foot clock. The trailing leg sweeps behind as the body glides and lowers
 * over it, nearly straight, its toe dragging on the approach (a declared
 * bearing contact) and the foot pitched with the leg's lean so its ankle keeps
 * the angle it stood with, then steps up clear of the floor in the recovery and
 * comes down flat over its landing place. The lowering, short trailing step and
 * clip-length reach bound are provisional animation parameters.
 */
export const bowlingSlide: IAutoMovieMotionHumanActionLaw<Parameters> = {
  name: "bowlingSlide",
  interrupts: {
    stand: [
      {
        window: ["recoveryPlant", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.smooth,
      },
    ],
  },
  yields: ["leftArm", "leftHand", "rightArm", "rightHand", "trunk", "head"],
  plan,
};

/**
 * Prepare the slide and the distinct recovery step without changing entry
 * posture or fixed foot ownership outside the moving intervals.
 *
 * @param context The actual entry feet, body and authored film-local times.
 * @returns Timed leg targets and the supporting foot windows.
 * @throws {HumanRefusal} When the timing or the body-scaled distance cannot be
 *   used.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<Parameters>,
): IAutoMovieMotionHumanActionPlan {
  const { body, params } = context;
  const { distance, duration: seconds, from, to } = params;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const leg: number = body.measure.thigh + body.measure.shank;
  const lead: AutoMovieHumanSide = params.hand === "left" ? "right" : "left";
  const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  if (!(from > 0 && to > from && seconds > to))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "to",
      value: to,
      feasible: null,
      reason:
        "the final slide needs an ordered preparation, glide and recovery",
      fix: "give finite action-local times with 0 < from < to < seconds",
    });
  if (!(distance > 0 && distance <= 0.4 * leg))
    throw new HumanRefusal({
      kind: "reach",
      axis: "distance",
      value: distance,
      feasible: { kind: "range", minimum: 0, maximum: 0.4 * leg, unit: "m" },
      reason: "the final glide must fit one walking-length lower-body step",
      fix: "move the performer closer before the delivery or shorten the glide",
    });

  const feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> =
    AutoMovieMotionHumanTrunk.footing(body, entry);
  const direction: IAutoMovieVector3 = HumanFrame.point(
    { yaw: entry.yaw, origin: { x: 0, y: 0, z: 0 } },
    { x: 0, y: 0, z: 1 },
  );
  const shift: IAutoMovieVector3 = Vector3.scale(direction, distance);
  const settle: number = (to + seconds) / 2;
  // The shank's tilt forward of the line from the hip down to an ankle as the
  // knee bends to fit the leg to it, degrees (law of cosines).
  const tilt = (top: IAutoMovieVector3, ankle: IAutoMovieVector3): number => {
    const d: number = Vector3.length(Vector3.subtract(top, ankle));
    const thigh: number = body.measure.thigh;
    const shank: number = body.measure.shank;
    return (
      (Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (d * d + shank * shank - thigh * thigh) / (2 * d * shank),
          ),
        ),
      ) *
        180) /
      Math.PI
    );
  };
  // The trailing ankle's height where the slide stops.
  const stoppedHeight: number =
    feet[trail].ankle.y +
    0.07 * leg * Math.sin((Math.PI * (to - from)) / (settle - from)) ** 2;
  // The trailing hip where the slide stops it.
  const stopped: IAutoMovieVector3 = hipJoints(
    body,
    {
      ...Vector3.add(entry.root, Vector3.scale(shift, 0.65)),
      y: entry.root.y - 0.11 * leg,
    },
    HumanFrame.turn(entry.yaw),
  )[trail];
  const rest: IAutoMovieVector3 = hipJoints(
    body,
    entry.root,
    HumanFrame.turn(entry.yaw),
  )[trail];
  // How far the line from an ankle up to the root leans forward along the
  // delivery, degrees.
  const lean = (top: IAutoMovieVector3, ankle: IAutoMovieVector3): number =>
    (Math.atan2(
      Vector3.dot(Vector3.subtract(top, ankle), direction),
      top.y - ankle.y,
    ) *
      180) /
    Math.PI;
  // The lowest point of the trailing sole.
  const lowest = (foot: IAutoMovieMotionHumanFoot.IPlacement): number =>
    Math.min(
      ...HumanFoot.SOCKETS.map(
        (point: IAutoMovieMotionHumanFoot.Socket): number =>
          HumanFoot.point(body, trail, point, foot).y,
      ),
    );
  const footSupport = (
    side: AutoMovieHumanSide,
    kind: FootSupport,
    begin: number,
    end: number,
  ): IAutoMovieMotionHumanContactWindow => ({
    part: `${side}Foot`,
    kind,
    from: begin / seconds,
    to: end / seconds,
    support: { kind: "ground" },
  });

  return {
    duration: seconds,
    events: [
      { name: "slideStarted", share: from / seconds },
      { name: "slideStopped", share: to / seconds },
      { name: "recoveryPlant", share: settle / seconds },
    ],
    contacts: [
      footSupport(lead, "plant", 0, from),
      footSupport(trail, "plant", 0, from),
      footSupport(lead, "bear", from, to),
      // The trailing toe drags on the approach until the recovery lifts it.
      footSupport(trail, "bear", from, to + (settle - to) * TERMINAL),
      footSupport(lead, "plant", to, seconds),
      footSupport(trail, "plant", settle, seconds),
    ],
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      if (time <= from) return entry;
      const travel: number = minimumJerk.share(
        Math.min(1, (time - from) / (to - from)),
      );
      const recovery: number = minimumJerk.share(
        Math.min(1, Math.max(0, (time - to) / (settle - to))),
      );
      const trailing: number = Math.min(1, (time - from) / (settle - from));
      const root: IAutoMovieVector3 = Vector3.add(
        entry.root,
        Vector3.scale(shift, 0.65 * travel),
      );
      root.y -= 0.11 * leg * travel * (1 - recovery);
      const posture: IAutoMovieMotionHumanPosture = { ...entry, root };
      const slidingAnkle: IAutoMovieVector3 = Vector3.add(
        feet[lead].ankle,
        Vector3.scale(shift, travel),
      );
      // The step lifts the foot off in the first third of the recovery,
      // travels in the middle third and only sets it down in the last.
      const step: number = minimumJerk.share(
        Math.min(
          1,
          Math.max(
            0,
            ((time - to) / (settle - to) - TERMINAL) / (1 - 2 * TERMINAL),
          ),
        ),
      );
      const swing: number = Math.sin(Math.PI * Math.min(1, trailing)) ** 2;
      const stepped: IAutoMovieVector3 = Vector3.add(
        feet[trail].ankle,
        Vector3.scale(shift, 0.35 * step),
      );
      // As the body glides and lowers the trailing leg sweeps out behind,
      // nearly straight (`REACH`), rather than folding over a foot left in
      // place; the recovery brings it back to its step.
      const hip: IAutoMovieVector3 = hipJoints(
        body,
        root,
        HumanFrame.turn(entry.yaw),
      )[trail];
      const height: number = feet[trail].ankle.y + 0.07 * leg * swing;
      // Once the slide stops the leg's place behind is the one it reached
      // there, at the slide's last height, so the foot leaves the floor
      // before it travels.
      const reached: IAutoMovieVector3 = time <= to ? hip : stopped;
      const back: number = Math.sqrt(
        Math.max(
          0,
          (REACH * leg) ** 2 -
            (reached.y - (time <= to ? height : stoppedHeight)) ** 2,
        ),
      );
      const behind: IAutoMovieVector3 = {
        ...Vector3.subtract(reached, Vector3.scale(direction, back)),
        y: height,
      };
      const sweep: number = travel * (1 - step);
      const trailingAnkle: IAutoMovieVector3 = {
        ...Vector3.add(
          stepped,
          Vector3.scale(Vector3.subtract(behind, stepped), sweep),
        ),
        y: height,
      };
      // The foot pitches toes down by its shank's forward lean over it, the
      // line from the hip leaning and the bent knee tilting the shank on
      // from that line (law of cosines over the thigh and the shank), so the
      // unloaded ankle keeps the angle it stood with until the step has
      // travelled; as it sets down in the last third the pitch fades about
      // its toe, which stays where it is over the floor while the heel comes
      // down, and the foot is raised until its toe clears the floor while it
      // swings.
      const turn = (share: number): IAutoMovieMotionHumanFoot.IPlacement => ({
        ankle: trailingAnkle,
        rotation: HumanFoot.rotation(
          HumanFoot.heading(feet[trail].rotation),
          HumanFoot.pitch(feet[trail].rotation) -
            (lean(reached, trailingAnkle) +
              tilt(reached, trailingAnkle) -
              lean(rest, feet[trail].ankle) -
              tilt(rest, feet[trail].ankle)) *
              share,
        ),
      });
      const landing: number = minimumJerk.share(
        Math.min(
          1,
          Math.max(
            0,
            ((time - to) / (settle - to) - (1 - TERMINAL)) / TERMINAL,
          ),
        ),
      );
      // The toe is placed where the flat foot's toe lands, so the foot turns
      // about it and stands flat on its step at the end.
      const flat: IAutoMovieMotionHumanFoot.IPlacement = turn(0);
      const flattened: IAutoMovieMotionHumanFoot.IPlacement = turn(1 - landing);
      const toe: IAutoMovieVector3 = Vector3.subtract(
        HumanFoot.point(body, trail, "toe", flat),
        HumanFoot.point(body, trail, "toe", flattened),
      );
      const pitched: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: Vector3.add(trailingAnkle, { x: toe.x, y: 0, z: toe.z }),
        rotation: flattened.rotation,
      }; // In the slide the toe drags on the approach (its declared bearing
      // contact) and is only kept out of the floor; in the recovery step it
      // swings clear of it.
      const lifted: number =
        Math.sin(
          Math.PI * Math.min(1, Math.max(0, (time - to) / (settle - to))),
        ) ** 2;
      const under: number =
        lowest(feet[trail]) + TOE_CLEARANCE * lifted - lowest(pitched);
      const trailingFoot: IAutoMovieMotionHumanFoot.IPlacement =
        under <= 0
          ? pitched
          : {
              ankle: { ...pitched.ankle, y: pitched.ankle.y + under },
              rotation: pitched.rotation,
            };
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          [`${lead}Leg`]: AutoMovieMotionHumanLeg.goal(
            body,
            posture,
            lead,
            { ...feet[lead], ankle: slidingAnkle },
            time >= to,
          ),
          [`${trail}Leg`]: AutoMovieMotionHumanLeg.goal(
            body,
            posture,
            trail,
            trailingFoot,
            time >= settle,
          ),
        },
      };
    },
  };
}
