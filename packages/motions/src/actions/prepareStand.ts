import { minimumJerk, seededSmoothNoise } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStand,
  IAutoMovieMotionHumanStandUpright,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieRandom,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanSkill } from "../skill/HumanSkill";
import { stand } from "./stand";
import { standFeet } from "./standFeet";
import { standUpright } from "./standUpright";

/**
 * Prepare a quiet standing entry once when its owning action discovers its
 * final duration after a probe. Body, entry, skill, side, sway and support
 * parameters remain unchanged; duration-specific timing and streams do not.
 *
 * @param context The fixed action context; params.seconds is supplied later.
 * @param side The acting side that signs lateral sway.
 * @returns A stand planner at a positive duration in seconds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the probe/final-duration use, fixed inputs, varying positive seconds and stream ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Retains stand's exact contact-preserving rocker course, midpoint/root alignment, minimum-jerk settle and seeded smooth sway with the same duration-specific normalization and moving-support carry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Entry geometry and support choice are prepared once, then each requested duration owns its settle, fresh random channels, events, contacts and joint map.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither a probe's trajectory nor an entry posture substitutes for the duration-specific stance; each query evaluates the original equations and actual support frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms A shared entry performs its socket FK and geometric preparation once; each duration prepares its two fixed four-term sway spectra lazily, while every posture still evaluates the original sines, window, rockers and carry.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed entry/body/alignment/support data serve both durations. Each child owns its pure indexed random channels and duration-specific spectra, whose exact coefficients are reused without sharing any time-dependent result with another child.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning action retains one finite two-foot preparation until release; each child plan owns two lazy four-term noise readers and its joint map. No FK reader, evaluated pose or query history is retained.
 */
export function prepareStand(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
  side: AutoMovieHumanSide,
): (duration: number) => IAutoMovieMotionHumanActionPlan {
  const yaw: number = context.entry.posture.yaw;
  const course: standFeet.ICourse = standFeet.of(
    context.body,
    context.entry,
    yaw,
  );
  const initial: IAutoMovieVector3 = course.offset(0);
  const upright: IAutoMovieMotionHumanStandUpright.IAlignment = standUpright.of(context.body);
  const middle: IAutoMovieVector3 = stand.root(context.body, course.flat, yaw);
  const aligned: IAutoMovieMotionHumanPosture["joints"] = {
    ...stand.relaxed(context.body),
    ...upright.joints,
  };
  const from: IAutoMovieVector3 = context.entry.posture.root;
  const sway: number =
    context.params.sway ?? 0.003 * HumanSkill.sway(context.skill);
  HumanBound.least("sway", sway, 0, "m");

  const left: IAutoMovieMotionHumanContactWindow.Support = HumanSupportFrame.contact(
    context,
    "leftFoot",
  );
  const right: IAutoMovieMotionHumanContactWindow.Support = HumanSupportFrame.contact(
    context,
    "rightFoot",
  );
  const inherited: string | undefined =
    context.entry.feet.left.planted &&
    context.entry.feet.right.planted &&
    left.kind === "prop" &&
    right.kind === "prop" &&
    left.subject === right.subject
      ? left.subject
      : undefined;
  const on: IAutoMovieMotionHumanStand.IParams["on"] =
    context.params.on ??
    (inherited === undefined ? undefined : { prop: inherited });
  const carried: (seconds: number) => IAutoMovieMotionHumanSupportCarry.ICarry | undefined = (
    seconds: number,
  ): IAutoMovieMotionHumanSupportCarry.ICarry | undefined =>
    on === undefined
      ? undefined
      : HumanSupportCarry.of(
          (t: number): IAutoMovieRigidTransform => context.prop(on.prop).frame(t),
          context.start,
          context.start + seconds,
        );

  return (duration: number): IAutoMovieMotionHumanActionPlan => {
    HumanBound.above("seconds", duration, 0, "s");
    const settle: number = Math.min(0.5, duration);
    const sx: IAutoMovieRandom = context.random("swayX");
    const sz: IAutoMovieRandom = context.random("swayZ");
    const noiseX: ReturnType<typeof seededSmoothNoise.prepare> =
      seededSmoothNoise.prepare(sx, duration, 0.8);
    const noiseZ: ReturnType<typeof seededSmoothNoise.prepare> =
      seededSmoothNoise.prepare(sz, duration, 0.8);
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...aligned };
    return {
      duration,
      events: [{ name: "settled", share: settle / duration }],

      // Once settled, without sway or a moving support, every term below is
      // constant: the course is at its end and the sway is zero.
      ...(sway === 0 && on === undefined && settle < duration
        ? { still: [settle, duration] as const }
        : {}),
      contacts: (["leftFoot", "rightFoot"] as const).map(
        (part: "leftFoot" | "rightFoot"): IAutoMovieMotionHumanContactWindow => ({
          part,
          kind: "plant",
          from: 0,
          to: 1,
          support:
            on === undefined
              ? HumanSupportFrame.contact(context, part)
              : { kind: "prop", subject: on.prop },
        }),
      ),
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number = minimumJerk.share(t / settle);
        const u: number = t / duration;
        const feet: standFeet.ISample = course.sample(s);
        const offset: IAutoMovieVector3 = feet.offset;

        // Sign lateral sway in the acting side's frame, as the standing law does.
        const swayed: IAutoMovieVector3 = HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          {
            x: (side === "left" ? -1 : 1) * sway * Math.SQRT2 * noiseX(u),
            y: 0,
            z: sway * Math.SQRT2 * noiseZ(u),
          },
        );
        const root: IAutoMovieVector3 = {
          x:
            from.x +
            (middle.x - from.x) * s +
            offset.x -
            initial.x * (1 - s) +
            swayed.x,
          y: from.y + (middle.y - from.y) * s + offset.y - initial.y * (1 - s),
          z:
            from.z +
            (middle.z - from.z) * s +
            offset.z -
            initial.z * (1 - s) +
            swayed.z,
        };
        const carry: IAutoMovieMotionHumanSupportCarry.ICarry | undefined = carried(t);
        return feet.write(
          {
            root: carry?.point(root) ?? root,
            yaw: yaw + (carry?.yaw ?? 0),
            pitch: 0,
            roll: 0,
            joints,
            limbs: {},
          },
          carry,
        );
      },
    };
  };
}
