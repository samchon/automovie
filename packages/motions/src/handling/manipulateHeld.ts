import { AffordanceArticulation, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME, Transform, Vector3, indexSkeletonTopology, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieBone,
  IAutoMovieFitDigitToTarget,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanManipulate,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieSkeletonTopology,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionInterval } from "../compose/AutoMovieMotionInterval";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanSegment } from "../perform/HumanSegment";
import { HumanDigitFit } from "../posture/HumanDigitFit";
import { HumanHand } from "../posture/HumanHand";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { HumanSkill } from "../skill/HumanSkill";

/**
 * Midpoint of the outward and inward tap means, seconds. Trudeau et al. (2012),
 * doi:10.1177/0018720811423660, measured 0.28 s and 0.30 s.
 */
const TAP_INTERVAL: number = (0.28 + 0.3) / 2;

/** Maximum fingertip error, metres, from the keyed-contact specification. */
const CONTACT_BOUND: number = 0.002;

/** One sampled configuration of the three thumb joints. */
interface IKnot {
  /** Time from the overlay's start, seconds. */
  time: number;

  /** Clinical angles in the same joint order as the isolated thumb rig. */
  angles: readonly (readonly [number, number, number])[];
}
/** The record of `IManipulateHeldResult`'s site. */
type IManipulateHeldResult = { name: string; share: number };

/**
 * Plan keyed presses by the free thumb of the hand that holds a prop.
 *
 * The carrier keeps the existing rigid hold and finger joints. Each press is
 * fitted once in the holding hand's frame, so the contact moves with the prop
 * as the carrier moves. The thumb returns through its entrance configuration
 * between contacts. This release path assumes the grip leaves the thumb free
 * and its entrance configuration clear of the pressing sites. A site without
 * authored or mechanical travel is pressed on its surface. Omitted times use
 * the average thumb-tap interval of Trudeau et al. (2012), varied by the
 * action's seeded proficiency. Authored times are seconds from the overlay's
 * start. The first press must follow the overlay's entrance fade.
 *
 * @param context The overlay's entry, held prop and ordered contact sites.
 * @returns A thumb-only plan with one press event per site.
 * @throws {HumanRefusal} When the hand is empty, a site or thumb is absent, the
 *   sequence is invalid, or a site is outside the thumb's usable reach.
 */
export function manipulateHeld(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const side: AutoMovieHumanSide =
    context.entry.holds.left === context.params.prop ? "left" : "right";
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    side,
    context.params.prop,
  );
  const prop: IAutoMovieMotionHumanProp = context.prop(held.prop).prop;
  if (
    prop.fixed === true ||
    prop.motion !== undefined ||
    context.entry.from?.plan.contacts.some(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === `${side}Hand` &&
        window.kind === "grip" &&
        window.support.kind === "prop" &&
        window.support.subject === held.prop &&
        window.inHand !== undefined,
    ) === true
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: held.prop,
      reason: "the thumb overlay requires a rigid prop offset in the hand",
      fix: "end the prop's independent or in-hand movement before the overlay",
    });
  const contacts: readonly IAutoMovieMotionHumanManipulate.IContact[] =
    context.params.contacts ?? [];
  if (contacts.length === 0 || context.params.text !== undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "contacts",
      value: contacts.length,
      reason: "a held-prop thumb overlay needs named contact sites",
      fix: "supply the prop's affordance ids as contacts",
    });
  const timed: boolean = contacts[0]!.at !== undefined;
  if (
    contacts.some(
      (contact: IAutoMovieMotionHumanManipulate.IContact): boolean =>
        (contact.at !== undefined) !== timed,
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "contacts.at",
      value: timed,
      reason: "explicit press times must be supplied for every contact",
      fix: "give every contact a time or omit every time",
    });

  // The wrist is the local origin. Its three descendants keep the original
  // bind offsets and constraints, so their fit never evaluates another limb.
  const hand: AutoMovieHumanoidBone = `${side}Hand`;
  const bones: AutoMovieHumanoidBone[] = HumanDigitFit.bones(side, "Thumb");
  const chain: IAutoMovieBone[] = context.body.skeleton.bones.filter(
    (bone: IAutoMovieBone): boolean =>
      bone.bone === hand || bones.includes(bone.bone),
  );
  const tip: IAutoMovieHumanoidSurfaces.IFrame =
    context.body.surfaces.regions[
      side === "left" ? "thumbTipLeft" : "thumbTipRight"
    ];
  if (chain.length !== bones.length + 1 || tip === undefined)
    throw new HumanRefusal({
      kind: "participant",
      axis: "thumb",
      value: side,
      reason: "the holding thumb needs its joints and fingertip surface",
      fix: "use a rig with a complete thumb on the holding hand",
    });
  const skeleton: IAutoMovieSkeleton = {
    id: context.body.skeleton.id,
    bones: chain.map(
      (bone: IAutoMovieBone): IAutoMovieBone =>
        bone.bone === hand
          ? { ...bone, parent: null, rest: Transform.identity() }
          : bone,
    ),
  };
  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton);
  const grip: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    side,
    "grip",
  ).point;
  const entry: IAutoMovieJointPose[] = context.entry.pose.joints.filter(
    (joint: IAutoMovieJointPose): boolean => bones.includes(joint.bone),
  );
  const rest: IKnot["angles"] = anglesOf(bones, entry);
  const pressTimes: number[] = [];
  const knots: IKnot[] = [{ time: 0, angles: rest }];
  let seed: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: entry,
  };
  let next: number = HumanSegment.FADE + TAP_INTERVAL;

  for (const [index, contact] of contacts.entries()) {
    const time: number = contact.at ?? next;
    const previous: number | undefined = pressTimes.at(-1);
    if (
      !(time >= HumanSegment.FADE) ||
      (previous !== undefined && time <= previous)
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "contacts.at",
        value: time,
        reason:
          "press times must follow the entrance fade and increase strictly",
        fix: "use increasing times or use the seeded tap interval",
      });
    if (
      (contact.hand !== undefined && contact.hand !== side) ||
      (contact.digit !== undefined && contact.digit !== "thumb")
    )
      throw new HumanRefusal({
        kind: "channel",
        axis: "contacts",
        value: contact.site,
        reason: "the overlay claims only the holding thumb",
        fix: "use the thumb of the hand holding the prop",
      });
    const site: IAutoMovieMotionHumanHeld.IPointResult =
      AutoMovieMotionHumanHeld.point(held, contact.site);
    const affordance: IAutoMovieAffordance = held.affordances.find(
      (candidate: IAutoMovieAffordance): boolean =>
        candidate.id === contact.site,
    )!;
    if (
      prop.point !== undefined ||
      (prop.articulate !== undefined &&
        (affordance.rides !== undefined ||
          AffordanceArticulation.KINDS.has(affordance.kind)))
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: "contacts.site",
        value: contact.site,
        reason: "the held thumb needs a site fixed to the prop frame",
        fix: "target a rigid site or drive the articulation with an operation",
      });
    const depth: number = contact.depth ?? affordance.travel ?? 0;
    if (!(depth >= 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "contacts.depth",
        value: depth,
        reason: "the site's travel must be finite and nonnegative",
        fix: "give the site's measured travel in metres",
      });
    const target: IAutoMovieVector3 = Vector3.add(
      grip,
      Vector3.add(site.point, Vector3.scale(site.direction, -depth)),
    );
    const fit: IAutoMovieFitDigitToTarget.IResult = AutoMovieEngineKinematics.fitDigitToTarget({
      skeleton,
      topology,
      pose: seed,
      bones,
      effector: tip,
      target,
      normal: Vector3.scale(site.direction, -1),
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
    });
    if (!(fit.residual <= CONTACT_BOUND))
      throw new HumanRefusal({
        kind: "reach",
        axis: "contacts.site",
        value: contact.site,
        reason: `the holding thumb misses ${contact.site} by ${(fit.residual * 1000).toFixed(1)} mm`,
        fix: "choose a reachable site or change the prop's grip",
      });

    if (previous !== undefined)
      knots.push({ time: (previous + time) / 2, angles: rest });
    knots.push({ time, angles: anglesOf(bones, fit.joints) });
    pressTimes.push(time);
    seed = { ...seed, joints: fit.joints };
    if (!timed)
      next =
        time +
        HumanSkill.jitter(
          context.skill,
          context.random(`press${index}`),
          TAP_INTERVAL,
        );
  }
  const duration: number =
    pressTimes.at(-1)! + TAP_INTERVAL + HumanSegment.FADE;
  knots.push({ time: duration, angles: rest });
  const body: IAutoMovieMotionHumanBody = { ...context.body, skeleton };
  const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
  return {
    duration,
    events: pressTimes.map(
      (time: number, index: number): IManipulateHeldResult => ({
        name: `press${index + 1}`,
        share: time / duration,
      }),
    ),
    contacts: [],
    channels: [`${side}Thumb`],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const [before, after]: readonly [IKnot, IKnot] = bracket(knots, seconds);
      const share: number = AutoMovieMotionInterval.progress(
        before.time,
        after.time,
        seconds,
      );
      const joints: IAutoMovieMotionHumanPosture["joints"] = {};
      bones.forEach((bone: AutoMovieHumanoidBone, index: number): void => {
        joints[bone] = blendHumanJoint(
          body,
          bone,
          before.angles[index]!,
          after.angles[index]!,
          share,
        );
      });
      return { ...posture, joints, digits: {} };
    },
  };
}

/**
 * Read the samples in rig order, with absent joints using their rest
 * articulation.
 */
function anglesOf(
  bones: readonly AutoMovieHumanoidBone[],
  joints: readonly IAutoMovieJointPose[],
): IKnot["angles"] {
  return bones.map(
    (bone: AutoMovieHumanoidBone): readonly [number, number, number] => {
      const angle: IAutoMovieJointPose | undefined = joints.find(
        (joint: IAutoMovieJointPose): boolean => joint.bone === bone,
      );
      return [angle?.flexion ?? 0, angle?.abduction ?? 0, angle?.twist ?? 0];
    },
  );
}

/** The adjacent knots surrounding a second, using the end pair beyond the path. */
function bracket(
  knots: readonly IKnot[],
  time: number,
): readonly [IKnot, IKnot] {
  let first: number = 0;
  let last: number = knots.length - 1;
  while (last - first > 1) {
    const middle: number = Math.floor((first + last) / 2);
    if (knots[middle]!.time <= time) first = middle;
    else last = middle;
  }
  return [knots[first]!, knots[last]!];
}
