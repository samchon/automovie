import { Quaternion, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrossAnkleOverKnee,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMount } from "../lexicon/HumanMount";
import { fitSeatedAnkleCross } from "./fitSeatedAnkleCross";

/** Provisional seconds for lifting or returning the leg. */
const TRAVEL: number = 0.85;

/** Fitted ankle tolerance, metres, for accepting the staged contact. */
const FIT_GAP: number = 0.01;

/**
 * Make a full-length contact window from the support already under the
 * performer.
 */
const continueContact = (
  contact: IAutoMovieMotionHumanEntryState.ISupport,
): IAutoMovieMotionHumanContactWindow => ({ ...contact, from: 0, to: 1 });
/** The alternatives of `PlanCrossAnkleOverKneeKnee`'s site. */
type PlanCrossAnkleOverKneeKnee = "leftLowerLeg" | "rightLowerLeg";

/** The alternatives of `PlanCrossAnkleOverKneeSwing`'s site. */
type PlanCrossAnkleOverKneeSwing = "leftLeg" | "rightLeg";

/** The alternatives of `PlanCrossAnkleOverKneeSupporting`'s site. */
type PlanCrossAnkleOverKneeSupporting = "leftFoot" | "rightFoot";

/** The alternatives of `PlanCrossAnkleOverKneeLifted`'s site. */
type PlanCrossAnkleOverKneeLifted = "leftFoot" | "rightFoot";

/**
 * Cross one ankle over the other knee while seated, hold, and put the foot
 * back. Register under `crossAnkleOverKnee` and perform after a completed chair
 * `sit`. The same seat, carrying leg and other active supports continue through
 * the action.
 *
 * Jeong et al. (2008), Leg Crossing-Induced Asymmetrical Trunk Muscle Activity
 * During Seated Computer Work, distinguish ankle-on-knee from upper-leg
 * crossing
 * (https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001291962).
 * Yu and An (2015), https://pmc.ncbi.nlm.nih.gov/articles/PMC4483391/, studied
 * the latter. Turley et al. (2013),
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC3589629/, identify coupled hip range
 * limits during activities such as chair leg crossing. Ganokroj et al. (2021),
 * https://doi.org/10.1186/s12891-021-04487-z, distinguish the chair figure-four
 * by its hip flexion, abduction and external rotation. The moving hip needs a
 * calibrated thigh-axis rotation order. The planner fits the seated leg's
 * actual bearing surface and checks the sweep outside and above the carrying
 * leg before settling the ankle. The return retraces that fit.
 */
function planCrossAnkleOverKnee(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrossAnkleOverKnee>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry } = context;
  const side: AutoMovieHumanSide = context.params.side ?? "right";

  const carried: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const lifted: PlanCrossAnkleOverKneeLifted = `${side}Foot`;
  const supporting: PlanCrossAnkleOverKneeSupporting = `${carried}Foot`;
  const swing: PlanCrossAnkleOverKneeSwing = `${side}Leg`;
  const knee: PlanCrossAnkleOverKneeKnee = `${carried}LowerLeg`;
  const seat: IAutoMovieMotionHumanEntryState.ISupport | undefined =
    entry.supports.find((item) => item.part === "seat" && item.kind === "seat");
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
    context.params.hold ?? 1,
    0,
    "s",
  );
  const travel: number = TRAVEL * (context.tempo ?? 1);
  const release: number = travel + hold;
  const duration: number = release + travel;
  if (!(travel > 0 && release < duration))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "hold",
      value: hold,
      feasible: null,
      reason: "the hold and travel must yield distinct finite times",
      fix: "specify a finite hold that leaves time to return the foot",
    });
  const posture: IAutoMovieMotionHumanPosture = entry.posture;
  const outward: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, posture.yaw),
    { x: side === "left" ? 1 : -1, y: 0, z: 0 },
  );
  const path = fitSeatedAnkleCross(body, entry, side, outward, FIT_GAP);
  if (path === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "side",
      value: side,
      feasible: null,
      reason:
        "the raised leg needs a calibrated hip and must clear the carrying leg before resting on its knee",
      fix: "use a seated stance and calibrated hip range that reach the other knee, or choose the other raised leg",
    });
  const limbs = { ...posture.limbs };
  delete limbs[swing];
  const joints = { ...posture.joints };
  for (const joint of entry.pose.joints)
    if (joint.bone === lifted || joint.bone === `${side}Toes`)
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];

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
      const share = Math.max(0, Math.min(seconds, duration - seconds) / travel);
      if (share === 0) return posture;
      const phase = Math.min(
        path.length - 2,
        Math.floor(share * (path.length - 1)),
      );
      const amount = minimumJerk.share(share * (path.length - 1) - phase);
      const posed = fitSeatedAnkleCross.interpolate(
        path[phase]!,
        path[phase + 1]!,
        amount,
      );
      return {
        ...posture,
        limbs,
        joints: {
          ...joints,
          [posed.hip.bone]: [
            posed.hip.flexion ?? 0,
            posed.hip.abduction ?? 0,
            posed.hip.twist ?? 0,
          ],
          [posed.knee.bone]: [
            posed.knee.flexion ?? 0,
            posed.knee.abduction ?? 0,
            posed.knee.twist ?? 0,
          ],
        },
      };
    },
  };
}

/**
 * Cross one ankle over the other knee while seated, hold, and put the foot
 * back. Register under `crossAnkleOverKnee` and perform after a completed chair
 * `sit`. The same seat, carrying leg and other active supports continue through
 * the action.
 *
 * Jeong et al. (2008), Leg Crossing-Induced Asymmetrical Trunk Muscle Activity
 * During Seated Computer Work, distinguish ankle-on-knee from upper-leg
 * crossing
 * (https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001291962).
 * Yu and An (2015), https://pmc.ncbi.nlm.nih.gov/articles/PMC4483391/, studied
 * the latter. Turley et al. (2013),
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC3589629/, identify coupled hip range
 * limits during activities such as chair leg crossing. Ganokroj et al. (2021),
 * https://doi.org/10.1186/s12891-021-04487-z, distinguish the chair figure-four
 * by its hip flexion, abduction and external rotation. The moving hip needs a
 * calibrated thigh-axis rotation order. The planner fits the seated leg's
 * actual bearing surface and checks the sweep outside and above the carrying
 * leg before settling the ankle. The return retraces that fit.
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
    plan: planCrossAnkleOverKnee,
  };
