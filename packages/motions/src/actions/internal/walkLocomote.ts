import { AutoMovieGravity } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieMotionManner,
} from "@automovie/interface";

import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanArmSwing } from "../../posture/internal/HumanArmSwing";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { walk } from "../../gait/internal/walk";
import { walkCarriage } from "./walkCarriage";
import { walkClear } from "./walkClear";
import { walkClock } from "./walkClock";
import { walkFacing } from "./walkFacing";
import { walkFoot } from "./walkFoot";
import { walkHorizontalRoot } from "./walkHorizontalRoot";
import { walkLocomoteGround } from "./walkLocomoteGround";
import { walkLocomoteSolve } from "./walkLocomoteSolve";
import { walkLocomoteSwings } from "./walkLocomoteSwings";
import { walkPlayback } from "./walkPlayback";
import { walkPoleCarriage } from "./walkPoleCarriage";
import { walkPosture } from "./walkPosture";
import { walkReach } from "./walkReach";
import { walkStation } from "../../gait/internal/walkStation";
import { walkSteps } from "../../gait/internal/walkSteps";
import { walkSupportHeight } from "./walkSupportHeight";
import { walkSwing } from "./walkSwing";
import { walkWindows } from "./walkWindows";

/*
 * Plan stepping locomotion in a gait: footprints, their timing, the pelvis and
 * the arms, shared by walking and running.
 * Parameter given: The action's context; `pace` is read by the caller only.
 * Parameter gait: The gait.
 * Returns: The plan.
 */
export function walkLocomote(
  given: IAutoMovieMotionHumanActionContext<
    Omit<IAutoMovieMotionHumanWalkParams, "pace">
  >,
  gait: IAutoMovieMotionHumanWalkGait,
): IAutoMovieMotionHumanActionPlan {
  // A station is a way read from its slot; without one the context is as given.
  const context: IAutoMovieMotionHumanActionContext<
    Omit<IAutoMovieMotionHumanWalkParams, "pace">
  > = walkStation.resolve(given);
  const body: IAutoMovieMotionHumanBody = context.body;
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const l: number = m.hipHeight;
  const froude: number = gait.froude;
  const p: Omit<IAutoMovieMotionHumanWalkParams, "pace"> = context.params;
  // The manner's gait factors: its step and swing scale the authored step
  // and arm swing, and its tempo divides the speed at that step, so a weary
  // walk is slower in cadence as well as shorter in step.
  const manner: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
    context,
    p.manner,
  );
  const speed: number =
    Math.sqrt(froude * AutoMovieGravity.STANDARD * l) / manner.tempo;
  const authored: Record<WalkLocomoteAuthoredEntry, number> = {
    stride: p.stride ?? 1,
    arms: p.armSwing ?? 1,
  };
  const elbows: number = p.elbows ?? 0;
  HumanBound.within(
    "stride",
    authored.stride,
    walk.STRIDE_RANGE.minimum,
    walk.STRIDE_RANGE.maximum,
  );
  HumanBound.within(
    "armSwing",
    authored.arms,
    walk.ARM_SWING_RANGE.minimum,
    walk.ARM_SWING_RANGE.maximum,
  );
  HumanBound.within(
    "elbows",
    elbows,
    walk.ELBOWS_RANGE.minimum,
    walk.ELBOWS_RANGE.maximum,
    "degrees",
  );
  const stride: number = authored.stride * manner.step;
  const arms: number = authored.arms * manner.swing;
  walkClear(context);
  // Step length follows the speed actually requested by the manner.
  const effectiveFroude: number = froude / (manner.tempo * manner.tempo);
  const forward: number = stride * l * gait.step(effectiveFroude);
  // A walk that does not face its way keeps the share of its speed and
  // step its direction allows, at the same cadence.
  const share: number =
    p.facing === undefined
      ? 1
      : walkFacing.share(body, context.entry, p, p.facing, forward);
  const longest: number = forward * share;
  // A tired member walks slower; a cadenced gait keeps its count (`walkClock.weary`).
  const weary: number = walkClock.weary(context, gait);
  const { plan: steps, clock }: ReturnType<typeof walkClock.steps> =
    walkClock.steps(context, {
      body,
      entry: context.entry,
      to: p.to,
      ...(p.via === undefined ? {} : { via: p.via }),
      ...(p.face === undefined ? {} : { face: p.face }),
      ...(p.facing === undefined ? {} : { facing: p.facing }),
      speed: speed * share * weary,
      longest,
      period: (seconds: number): number =>
        gait.called === true
          ? seconds
          : HumanSkill.jitter(context.skill, walkSteps.tempo(context), seconds),
      swing: gait.swing,
      gait,
      ...walkStation.cadenced(context, gait, speed * share * weary),
    });
  const duration: number = steps.duration;
  const claim: ReturnType<typeof walkReach.prepareShort> =
    walkReach.prepareShort(body);

  const pelvis: (
    t: number,
    phase?: number,
    amount?: number,
  ) => readonly [number, number, number] = (
    t: number,
    phase: number = steps.phase(t),
    amount: number = steps.amount(t),
  ): readonly [number, number, number] => {
    return [
      0,
      walkPosture.PELVIS * Math.cos(2 * Math.PI * phase) * amount,
      walkPosture.PELVIS * Math.sin(2 * Math.PI * phase) * amount,
    ];
  };
  const { events, contacts }: ReturnType<typeof walkWindows> =
    walkWindows(steps);
  // Every swing of the schedule, so each swing's constants are prepared as
  // the walk is planned rather than on the first second that reads them.
  const swings: walkLocomoteSwings.ISwing[] = walkLocomoteSwings(steps);

  // The foot schedule and the swing both carry the original heel-strike time.
  const closing: NonNullable<Parameters<typeof walkSwing>[4]> = (
    side: AutoMovieHumanSide,
    on: number,
  ): boolean => on === steps.lastLanding[side];
  const scheduledAt: ReturnType<typeof walkSwing> = walkSwing(
    body,
    gait,
    (side: AutoMovieHumanSide, t: number): walkFoot.IEnd =>
      walkLocomoteGround.scheduled(steps.foot(side, t)),
    swings,
    closing,
  );

  const walking: boolean =
    gait.swing < 1 && gait.bob === undefined && steps.inPlace !== true;
  const support: ReturnType<typeof walkSupportHeight> | undefined = walking
    ? walkSupportHeight(steps, body, gait.lift, pelvis, claim)
    : undefined;
  const ground: walkLocomoteGround.IGround = walkLocomoteGround.prepare(
    {
      body,
      gait,
      steps,
      root: support?.root ?? steps.root,
      pelvis,
      claim,
      support,
      scheduled: scheduledAt,
    },
    swings,
  );
  // A swing joins the stance it left and the stance it lands in, each
  // settled at the swing's own two ends: constants of the step, settled once
  // for the plan, as its descent and its flight are.
  const unswung: ReturnType<typeof walkPosture> = walkPosture(
    body,
    gait,
    arms,
    elbows,
    steps,
    walkLocomoteSolve.prepare(
      {
        body,
        gait,
        steps,
        pelvis,
        ground,
        reached: walkSwing(body, gait, ground.end, swings, closing),
      },
      swings,
    ),
    swings,
  );

  // The swinging arms are carried clear of the body, the hands passing the
  // thighs no nearer than they hang beside them, by one abduction read
  // over one of its strides (`walkCarriage`), once for the plan.
  const carried: Record<AutoMovieHumanSide, number> = walkCarriage(
    body,
    steps.events,
    duration,
    (
      at: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      read?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IAutoMovieMotionHumanPosture => unswung(at, undefined, undefined, read),
  );

  // A hand carrying a long prop is driven by the walk, which takes the prop
  // over with a grip window, so the performance lets the walk's carriage
  // reach it (`walkPoleCarriage`).
  const poles: walkPoleCarriage.IHold[] = walkPoleCarriage.prepare(
    context,
    events,
    duration,
  );
  const planned: walkStation.IPlan = {
    duration,
    events,
    contacts: [...contacts, ...walkPoleCarriage.grips(poles)],
    ...(poles.length === 0
      ? {}
      : { holds: walkPoleCarriage.kept(context, poles) }),
    horizontalRoot: walkHorizontalRoot(body, gait, steps),
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IAutoMovieMotionHumanPosture => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(source);
      const legs: readonly AutoMovieHumanSide[] =
        channels === undefined
          ? walkReach.SIDES
          : walkReach.SIDES.filter((side: AutoMovieHumanSide): boolean =>
              channels.includes(`${side}Leg`),
            );
      const posture: IAutoMovieMotionHumanPosture = unswung(
        seconds,
        legs,
        channels,
        resolution,
      );
      if (
        channels !== undefined &&
        !channels.includes("leftArm") &&
        !channels.includes("rightArm")
      )
        return posture;
      // A long held prop is carried tip raised ahead, lowered to a plant
      // the walk is cut into (`walkPoleCarriage`).
      return walkPoleCarriage.write(
        body,
        HumanArmSwing.carry(posture, carried),
        poles,
        seconds,
      );
    },
  };

  // The steps' timing: uneven, entrained to a beat, or kept on a station (`walkClock`).
  return walkPlayback(walkClock(context, planned, gait, clock), body);
}

/*
 * The alternatives of `WalkLocomoteAuthoredEntry`'s site.
 */
type WalkLocomoteAuthoredEntry = "stride" | "arms";
