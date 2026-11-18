import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrossAnkleOverKnee,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMount } from "../lexicon/HumanMount";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Provisional seconds for lifting or returning the leg. */
const TRAVEL: number = 0.85;

/** Fitted ankle tolerance, metres, for accepting the staged contact. */
const FIT_GAP: number = 0.01;

/** Make a full-length contact window from the support already under the performer. */
const continueContact = (
  contact: IAutoMovieMotionHumanEntryState.ISupport,
): IAutoMovieMotionHumanContactWindow => ({ ...contact, from: 0, to: 1 });

/**
 * Cross one ankle over the other knee while seated, hold, and put the foot
 * back. Register under `crossAnkleOverKnee` and perform after a completed
 * chair `sit`. The same seat, carrying leg and other active supports
 * continue through the action.
 *
 * Jeong et al. (2008), Leg Crossing-Induced Asymmetrical Trunk Muscle
 * Activity During Seated Computer Work, distinguish ankle-on-knee from
 * upper-leg crossing (https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001291962).
 * Yu and An (2015), https://pmc.ncbi.nlm.nih.gov/articles/PMC4483391/,
 * studied the latter. Turley et al. (2013),
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC3589629/, identify coupled hip
 * range limits during activities such as chair leg crossing. The held ankle
 * target uses the fitted carrying knee and the performer's lower-leg
 * dimensions. The pose is a rigid, first-draft approximation of that contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the entry, staged contact, source, provisional timing and return.
 * @evidence contracts/development/design.md#principled-representation A reversible ankle placement on a seated base with authored hold and explicit support windows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registered action consumes the existing seat and grounds the other foot.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads knee and ankle geometry from the posed skeleton and fits through the shared posture solver.
 */
export const crossAnkleOverKnee: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCrossAnkleOverKnee> =
  {
    name: "crossAnkleOverKnee",
    interrupts: {
      rise: [{ window: ["footDown", 1], kind: "inertialize", entry: 0 }],
      crossAnkleOverKnee: [
        { window: ["footDown", 1], kind: "inertialize", entry: 0 },
      ],
    },
    accepts: {
      sit: [{ window: ["seated", 1], kind: "inertialize", entry: 0 }],
    },
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrossAnkleOverKnee>,
    ): IAutoMovieMotionHumanActionPlan => {
      const { body, entry } = context;
      const side: AutoMovieHumanSide = context.params.side ?? "right";
      if (side !== "left" && side !== "right")
        throw new HumanRefusal({
          kind: "parameter",
          axis: "side",
          value: side,
          feasible: { kind: "alternatives", values: ["left", "right"] },
          reason: "the raised ankle must be on one side",
          fix: "choose left or right",
        });

      const carried: AutoMovieHumanSide = side === "left" ? "right" : "left";
      const lifted: "leftFoot" | "rightFoot" = `${side}Foot`;
      const supporting: "leftFoot" | "rightFoot" = `${carried}Foot`;
      const swing: "leftLeg" | "rightLeg" = `${side}Leg`;
      const knee: "leftLowerLeg" | "rightLowerLeg" = `${carried}LowerLeg`;
      const seat: IAutoMovieMotionHumanEntryState.ISupport | undefined =
        entry.supports.find(
          (item) => item.part === "seat" && item.kind === "seat",
        );
      const ground: readonly IAutoMovieMotionHumanEntryState.ISupport[] =
        entry.supports.filter(
          (item) =>
            (item.part === lifted || item.part === supporting) &&
            item.kind === "plant" &&
            item.support.kind === "ground",
        );
      if (
        context.carrier !== undefined ||
        entry.base.kind !== "seated" ||
        entry.base.seat === undefined ||
        entry.base.seat.astride === true ||
        seat === undefined ||
        seat.support.kind === "person" ||
        (seat.support.kind === "prop" &&
          context.prop(seat.support.subject).prop.motion !== undefined) ||
        !ground.some((item) => item.part === lifted) ||
        !ground.some((item) => item.part === supporting) ||
        !HumanMount.grounded(body, entry.feet[side]) ||
        !HumanMount.grounded(body, entry.feet[carried]) ||
        entry.posture.limbs[swing]?.planted !== true
      )
        throw new HumanRefusal({
          kind: "base",
          axis: "base",
          value: entry.base.kind,
          feasible: { kind: "alternatives", values: ["sit"] },
          reason:
            "crossing an ankle over a knee needs a stationary chair and two grounded feet at entry",
          fix: "finish sitting with both feet on the ground before crossing",
        });

      const hold: number = HumanBound.least(
        "seconds",
        context.params.seconds ?? 1,
        0,
        "s",
      );
      const travel: number = TRAVEL * (context.tempo ?? 1);
      const release: number = travel + hold;
      const duration: number = release + travel;
      if (!(Number.isFinite(duration) && travel > 0 && release < duration))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "seconds",
          value: hold,
          feasible: null,
          reason: "the hold and travel must yield distinct finite times",
          fix: "specify a finite hold that leaves time to return the foot",
        });
      const posture: IAutoMovieMotionHumanPosture = entry.posture;
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, entry.pose);
      const bearingKnee: IAutoMovieVector3 = bones.get(knee)!.worldPosition;
      const start: IAutoMovieMotionHumanFoot.IPlacement = entry.feet[side];
      const footGoal: IAutoMovieHumanLimbGoal = posture.limbs[swing]!;
      const kneeAtStart: IAutoMovieVector3 = bones.get(
        `${side}LowerLeg`,
      )!.worldPosition;
      const outward: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, posture.yaw),
        { x: side === "left" ? 1 : -1, y: 0, z: 0 },
      );

      // Keep the knees on opposite sides while turning the raised shin in.
      // The knee region supplies the carrying knee's radius. The standing
      // ankle height bounds the raised ankle's outer radius at the contact.
      const region =
        body.surfaces.regions[carried === "left" ? "kneeLeft" : "kneeRight"];
      const kneeRadius: number = Vector3.length(region.point);
      const ankleRadius: number = Math.min(
        body.measure.shankRadius,
        body.measure.ankleHeight,
      );
      const target: IAutoMovieVector3 = {
        ...bearingKnee,
        y: bearingKnee.y + kneeRadius + ankleRadius,
      };
      const pole: IAutoMovieVector3 = Vector3.add(
        kneeAtStart,
        Vector3.scale(outward, body.measure.thigh),
      );
      const fit: IAutoMoviePose = resolveHumanPosture.limb(
        body,
        entry.pose,
        swing,
        {
          point: target,
          bend: pole,
        },
      );
      const end: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: target,
        rotation: poseBones(body, fit).get(lifted)!.worldRotation,
      };

      // Raise the ankle early on the arc so that it is above the shank as
      // it moves inward. A quarter-rise arc makes height level at contact.
      const clearance: number = (target.y - start.ankle.y) / 4;
      const goalAt = (share: number): IAutoMovieHumanLimbGoal => ({
        ...AutoMovieMotionHumanLeg.goal(
          body,
          posture,
          side,
          AutoMovieMotionHumanLeg.arc(start, end, clearance, share),
          false,
        ),
        bend: Vector3.lerp(kneeAtStart, pole, share),
      });
      for (const share of [0.25, 0.5, 0.75, 1]) {
        const goal: IAutoMovieHumanLimbGoal = goalAt(share);
        const sample: ReadonlyMap<
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone
        > = poseBones(
          body,
          resolveHumanPosture.limb(body, entry.pose, swing, goal),
        );
        const gap: number = Vector3.length(
          Vector3.subtract(sample.get(lifted)!.worldPosition, goal.point),
        );
        const kneeOrder: number = Vector3.dot(
          Vector3.subtract(
            sample.get(`${side}LowerLeg`)!.worldPosition,
            bearingKnee,
          ),
          outward,
        );
        if (gap > FIT_GAP || kneeOrder <= 0)
          throw new HumanRefusal({
            kind: "reach",
            axis: "side",
            value: side,
            feasible: null,
            reason: `the raised leg cannot reach across with its knee outside the carrying knee (ankle gap ${gap.toFixed(3)} m, lateral knee separation ${kneeOrder.toFixed(3)} m)`,
            fix: "sit with the knees in a different position, or choose the other raised leg",
          });
      }

      const contacts: IAutoMovieMotionHumanContactWindow[] = entry.supports
        .filter((item) => item.part !== lifted)
        .map(continueContact);
      const foot: IAutoMovieMotionHumanEntryState.ISupport = ground.find(
        (item) => item.part === lifted,
      )!;
      contacts.push(
        { ...foot, from: 0, to: 0 },
        {
          part: lifted,
          kind: "bear",
          load: 0,
          from: travel / duration,
          to: release / duration,
          support: { kind: "person", subject: context.subject, bone: knee },
        },
        { ...foot, from: 1, to: 1 },
      );
      return {
        base: entry.base,
        duration,
        events: [
          { name: "ankleContact", share: travel / duration },
          { name: "ankleRelease", share: release / duration },
          { name: "footDown", share: 1 },
        ],
        contacts,
        posture: (seconds: number): IAutoMovieMotionHumanPosture => {
          const share: number = minimumJerk(
            Math.min(seconds, duration - seconds) / travel,
          ).s;
          return {
            ...posture,
            limbs: {
              ...posture.limbs,
              [swing]: share === 0 ? footGoal : goalAt(share),
            },
          };
        },
      };
    },
  };
