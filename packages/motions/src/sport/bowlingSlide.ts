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
import { HumanFrame } from "../posture/HumanFrame";

/** The authored final glide of a one-handed bowling approach. */
type Parameters = IAutoMovieMotionHumanBowlingSlide.IParams;

/** How a foot meets the lane in one window: a fixed plant or a bearing slide. */
type FootSupport = "plant" | "bear";

/**
 * Carry the body on the sliding foot opposite the delivery hand.
 *
 * Seiferheld et al. (2023), section 1 and Figure 2, place the final slide
 * after the dominant foot's push and the ball release after its braking.
 * The authored interval controls that glide. A throw can overlay the base
 * without changing the foot clock. The lowering, short trailing step and
 * clip-length reach bound are provisional animation parameters.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the measured phase order, authored times, stance geometry and use as a delivery carrier.
 * @evidence contracts/development/design.md#principled-representation A supported travelling base writes only the root and two leg goals. A sliding sole bears before becoming a fixed plant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law is registered in the sport throw lexicon so the existing delivery can own the concurrent arms and object.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Motion uses the actual entry ankles and authored horizontal distance. The layout never replaces a forefoot plant with an airborne contact.
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
 * @throws {HumanRefusal} When the timing or the body-scaled distance cannot be used.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<Parameters>,
): IAutoMovieMotionHumanActionPlan {
  const { body, params } = context;
  const { distance, seconds, from, to } = params;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const leg: number = body.measure.thigh + body.measure.shank;
  const lead: AutoMovieHumanSide = params.hand === "left" ? "right" : "left";
  const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  if (!(from > 0 && to > from && seconds > to && Number.isFinite(seconds)))
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
      const trailingAnkle: IAutoMovieVector3 = Vector3.add(
        feet[trail].ankle,
        Vector3.scale(shift, 0.35 * recovery),
      );
      trailingAnkle.y += 0.07 * leg * Math.sin(Math.PI * trailing) ** 2;
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
            { ...feet[trail], ankle: trailingAnkle },
            time >= settle,
          ),
        },
      };
    },
  };
}
