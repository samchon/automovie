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
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanSkill } from "../skill/HumanSkill";
import { stand } from "./stand";
import { standClearArms } from "./standClearArms";
import { standFeet } from "./standFeet";
import { standUpright } from "./standUpright";

/** The alternatives of `PrepareStandPart`'s site. */
type PrepareStandPart = "leftFoot" | "rightFoot";

/**
 * Prepare a quiet standing entry once when its owning action discovers its
 * final duration after a probe. Body, entry, skill, side, sway and support
 * parameters remain unchanged; duration-specific timing and streams do not.
 *
 * @param context The fixed action context; params.seconds is supplied later.
 * @param side The acting side that signs lateral sway.
 * @returns A stand planner at a positive duration in seconds.
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
  const upright: IAutoMovieMotionHumanStandUpright.IAlignment = standUpright.of(
    context.body,
  );
  const middle: IAutoMovieVector3 = stand.root(context.body, course.flat, yaw);
  const from: IAutoMovieVector3 = context.entry.posture.root;
  // The arms hang relaxed beside the thighs of the stance settled on the
  // entry's feet, which may stand wider or staggered than the quiet stance;
  // while the stance settles, a hand the moving thighs meet is let out at
  // the shoulder (`HumanArmSwing.of`), as a gait's swinging arm is.
  const aligned: IAutoMovieMotionHumanPosture["joints"] = {
    ...standClearArms(context.body, [
      course.write(
        {
          root: middle,
          yaw,
          pitch: 0,
          roll: 0,
          joints: upright.joints,
          limbs: {},
        },
        1,
      ),
    ]),
    ...upright.joints,
  };
  const sway: number =
    context.params.sway ?? stand.SWAY * HumanSkill.sway(context.skill);
  HumanBound.least("sway", sway, 0, "m");

  const left: IAutoMovieMotionHumanContactWindow.Support =
    HumanSupportFrame.contact(context, "leftFoot");
  const right: IAutoMovieMotionHumanContactWindow.Support =
    HumanSupportFrame.contact(context, "rightFoot");
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
  const carried: (
    seconds: number,
  ) => IAutoMovieMotionHumanSupportCarry.ICarry | undefined = (
    seconds: number,
  ): IAutoMovieMotionHumanSupportCarry.ICarry | undefined =>
    on === undefined
      ? undefined
      : HumanSupportCarry.of(
          (t: number): IAutoMovieRigidTransform =>
            context.prop(on.prop).frame(t),
          context.start,
          context.start + seconds,
        );

  return (duration: number): IAutoMovieMotionHumanActionPlan => {
    HumanBound.above("hold", duration, 0, "s");
    const settle: number = Math.min(stand.SETTLE, duration);
    const sx: IAutoMovieRandom = context.random("swayX");
    const sz: IAutoMovieRandom = context.random("swayZ");
    const noiseX: ReturnType<typeof seededSmoothNoise.prepare> =
      seededSmoothNoise.prepare(sx, duration, stand.SWAY_FREQUENCY);
    const noiseZ: ReturnType<typeof seededSmoothNoise.prepare> =
      seededSmoothNoise.prepare(sz, duration, stand.SWAY_FREQUENCY);
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
        (part: PrepareStandPart): IAutoMovieMotionHumanContactWindow => ({
          part,
          kind: "plant",
          from: 0,
          to: 1,
          support:
            on === undefined
              ? { ...(part === "leftFoot" ? left : right) }
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
        const carry: IAutoMovieMotionHumanSupportCarry.ICarry | undefined =
          carried(t);
        const written: IAutoMovieMotionHumanPosture = feet.write(
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
        // Settled, the arms hang clear of the thighs they were found clear
        // of; while settling, the thighs move under them.
        return s < 1 ? HumanArmSwing.of(context.body, written, SIDES) : written;
      },
    };
  };
}

/** Both arms, which a settling stand keeps clear of its moving thighs. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
