import { AutoMovieGravity, preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanBound } from "../law/HumanBound";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanSkill } from "../skill/HumanSkill";
import { runStance } from "./runStance";
import { walk } from "./walk";
import { walkCarriage } from "./walkCarriage";
import { walkClear } from "./walkClear";
import { walkClock } from "./walkClock";
import { walkDescent } from "./walkDescent";
import { walkFacing } from "./walkFacing";
import { walkFoot } from "./walkFoot";
import { walkHorizontalRoot } from "./walkHorizontalRoot";
import { walkLeg } from "./walkLeg";
import { walkPlayback } from "./walkPlayback";
import { walkPosture } from "./walkPosture";
import { walkReach } from "./walkReach";
import { walkStation } from "./walkStation";
import { walkSteps } from "./walkSteps";
import { walkSupportHeight } from "./walkSupportHeight";
import { walkSwing } from "./walkSwing";
import { walkWindows } from "./walkWindows";

/** The already evaluated pelvis at the current action second. */
interface IReachAt {
  /** The action second it was evaluated at. */
  seconds: number;

  /** The pelvis there. */
  pelvis: walkReach.IPelvis;
}

/**
 * Plan stepping locomotion in a gait: footprints, their timing, the pelvis
 * and the arms, shared by walking and running.
 *
 * @param given The action's context; `pace` is read by the caller only.
 * @param gait The gait.
 * @returns The plan.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared gait plan, author context and caller-owned pace; the namespace gives trajectories, contacts and timing sources.
 * @evidence contracts/development/implementation.md#principled-implementation Planned footprints, a pelvis lowered by its fixed-point reach, constrained swings and a hip-pivoted trunk; explicit channel demand computes only the consumed leg goals and arm carriage.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Step planning, per-swing preparation, pelvis settling and posture assembly each have one owner before the clock warp.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every footprint, event, authored parameter and solver bound comes from its owner, the gait's numbers named and sourced or provisional; omitted demand evaluates the complete posture.
 * @evidence contracts/development/implementation.md#efficient-algorithms Step lookup is logarithmic in footfalls; each query does bounded pelvis/foot work for its demanded channels. A swing's endpoints, its descent or flight claims and its scheduled and reached swing readers are prepared once per swing, at its first read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A swing's endpoints are fixed by its foot and toe-off, so its settled endpoints, its descent or flight and its two prepared swing readers are kept per swing, keyed by foot and toe-off; root-only pacing omits unread carriage/swing goals, and queries share only FK workspaces, which change no result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds body/steps, the carriage, and per swing three settled endpoints, one descent or flight and two prepared swing readers, so its retention grows linearly with its footfalls and is released with the plan; it keeps no arbitrary-time pose cache.
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
  const manner: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner.of(
    context,
    p.manner,
  );
  const speed: number =
    Math.sqrt(froude * AutoMovieGravity.STANDARD * l) / manner.tempo;
  const authored: Record<"stride" | "arms", number> = {
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
  const { events, contacts }: ReturnType<typeof walkWindows.of> =
    walkWindows.of(steps);
  // A foot as its schedule alone has it, before any pelvis is settled.
  const endOf: (
    foot: IAutoMovieMotionHumanWalkFoot.IScheduled,
  ) => walkFoot.IEnd = (
    foot: IAutoMovieMotionHumanWalkFoot.IScheduled,
  ): walkFoot.IEnd => ({
    ankle: foot.placement.ankle,
    rotation: foot.placement.rotation,
    toes: foot.toes,
  });
  const scheduled: (side: "left" | "right", t: number) => walkFoot.IEnd = (
    side: "left" | "right",
    t: number,
  ): walkFoot.IEnd => endOf(steps.foot(side, t));

  // The foot schedule and the swing both carry the original heel-strike time.
  const closing: NonNullable<Parameters<typeof walkSwing>[3]> = (
    side: AutoMovieHumanSide,
    on: number,
  ): boolean => on === steps.lastLanding[side];
  const scheduledAt: ReturnType<typeof walkSwing> = walkSwing(
    body,
    gait,
    scheduled,
    closing,
  );

  const walking: boolean =
    gait.swing < 1 && gait.bob === undefined && steps.inPlace !== true;
  const support: ReturnType<typeof walkSupportHeight> | undefined = walking
    ? walkSupportHeight(steps, body, gait.lift, pelvis, claim)
    : undefined;
  const rootAt: typeof steps.root = support?.root ?? steps.root;

  // The lowering a swinging leg asks of the pelvis at a share of its swing for the ankle the schedule swings there, read from the schedule alone so that it needs no settled pelvis and every instant settles the same.
  function reaching(
    side: "left" | "right",
    swing: { off: number; on: number },
    u: number,
    resolution?: ReturnType<typeof preparePoseResolution>,
    current?: IReachAt,
  ): number {
    const t: number = swing.off + u * (swing.on - swing.off);
    const frame: walkReach.IPelvis =
      current?.seconds === t
        ? current.pelvis
        : walkReach.pelvis(
            body,
            rootAt(t),
            steps.yaw(t),
            pelvis(t),
            {
              left: steps.foot("left", t),
              right: steps.foot("right", t),
            },
            resolution,
          );
    return claim(frame.hips[side], scheduledAt(side, swing)(u).placement.ankle);
  }

  // A swing's scheduled descent, kept per swing by its foot and toe-off.
  const descents: Map<string, walkDescent.IPlan> = new Map();
  const flights: Map<string, [number, number]> = new Map();
  function settle(
    t: number,
    feet: Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled>,
    amount: number = steps.amount(t),
    hips: readonly [number, number, number] = pelvis(t, steps.phase(t), amount),
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ): walkReach.IGround {
    const read: ReturnType<typeof preparePoseResolution> | undefined =
      resolution === undefined
        ? undefined
        : prepareHumanPoseResolution.read(resolution);
    const root: IAutoMovieVector3 = rootAt(t);
    const frame: walkReach.IPelvis = walkReach.pelvis(
      body,
      root,
      steps.yaw(t),
      hips,
      feet,
      read,
    );
    const current: IReachAt = { seconds: t, pelvis: frame };
    const claims: Partial<Record<"left" | "right", number>> = {};
    for (const side of ["left", "right"] as const) {
      const swing: IAutoMovieMotionHumanWalkFoot.IScheduled["swing"] =
        feet[side].swing;
      if (swing === undefined) continue;

      // A foot in flight bears nothing: it claims what its stance claimed
      // when it left and what the next claims when it lands, blended.
      if (gait.swing > 1) {
        const key: string = `${side}:${swing.off}`;
        let held: [number, number] | undefined = flights.get(key);
        if (held === undefined) {
          const sampled: ReturnType<typeof preparePoseResolution> =
            read ?? preparePoseResolution();
          held = [
            reaching(side, swing, 0, sampled),
            reaching(side, swing, 1, sampled),
          ];
          flights.set(key, held);
        }
        claims[side] = runStance.airborne(held, swing.u);
        continue;
      }
      if (swing.u < walkDescent.START) continue;
      // The airborne ankle does not lower its support. Transfer only the
      // lowering the landing foot actually needs at the instant of strike.
      if (support !== undefined) {
        const weight: number = walkReach.weight(feet[side]);
        const landing: number =
          weight === 0 ? 0 : support.landing(side, swing.on, read);
        claims[side] = -walkReach.CLAIM + weight * (landing + walkReach.CLAIM);
        continue;
      }
      const key: string = `${side}:${swing.off}`;
      let descent: walkDescent.IPlan | undefined = descents.get(key);
      if (descent === undefined) {
        const sampled: ReturnType<typeof preparePoseResolution> =
          read ?? preparePoseResolution();
        descent = walkDescent.plan((u: number): number =>
          reaching(side, swing, u, sampled),
        );
        descents.set(key, descent);
      }
      claims[side] = walkDescent.claim(
        descent,
        swing.u,
        reaching(side, swing, swing.u, read, current),
        -walkReach.CLAIM,
      );
    }
    return walkReach.ground(
      body,
      root,
      frame,
      hips,
      feet,
      claims,

      // The forefoot rocker is a stepping foot's: it comes in with the gait and goes with it, so a walk stands flat where it starts and stops.
      walkLeg.ROCKER * amount,
      read,
    );
  }

  // A swing joins the stance it left and the stance it lands in, each
  // settled at the swing's own two ends: constants of the step, so each is
  // settled once for the plan, as its descent and its flight are, rather
  // than again at every second the swing is read.
  const ends: Map<string, walkFoot.IEnd> = new Map();
  const end: (
    side: "left" | "right",
    t: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ) => walkFoot.IEnd = (
    side: "left" | "right",
    t: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ): walkFoot.IEnd => {
    const key: string = `${side}:${t}`;
    let known: walkFoot.IEnd | undefined = ends.get(key);
    if (known === undefined) {
      known = settle(
        t,
        {
          left: steps.foot("left", t),
          right: steps.foot("right", t),
        },
        undefined,
        undefined,
        resolution,
      ).feet[side];
      ends.set(key, known);
    }
    return known;
  };
  const reachedAt: ReturnType<typeof walkSwing> = walkSwing(
    body,
    gait,
    end,
    closing,
  );
  const ranged: Partial<
    Record<"left" | "right", ReturnType<typeof walkReach.prepareSwing>>
  > = {};
  function solve(
    t: number,
    legs: readonly ("left" | "right")[],
    phase: number,
    amount: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ): walkPosture.ISettled {
    const feet: Record<
      "left" | "right",
      IAutoMovieMotionHumanWalkFoot.IScheduled
    > = {
      left: steps.foot("left", t),
      right: steps.foot("right", t),
    };
    const hips: readonly [number, number, number] = pelvis(t, phase, amount);
    const settled: walkReach.IGround = settle(
      t,
      feet,
      amount,
      hips,
      resolution,
    );
    const reached: Record<"left" | "right", walkFoot.IEnd> = {} as Record<
      "left" | "right",
      walkFoot.IEnd
    >;
    for (const side of ["left", "right"] as const) {
      const swing: IAutoMovieMotionHumanWalkFoot.IScheduled["swing"] =
        feet[side].swing;
      if (!legs.includes(side)) {
        reached[side] = endOf(feet[side]);
        continue;
      }
      if (swing === undefined) {
        reached[side] = settled.feet[side];
        continue;
      }
      reached[side] = (ranged[side] ??= walkReach.prepareSwing(body, side))(
        settled,
        reachedAt(side, swing, resolution)(swing.u),
        steps.inPlace === true ? swing.u : undefined,
      );
    }
    return { feet, hips, settled, reached };
  }
  const unswung: ReturnType<typeof walkPosture> = walkPosture(
    body,
    gait,
    arms,
    elbows,
    steps,
    solve,
  );

  // The swinging arms are carried clear of the body, the hands passing the
  // thighs no nearer than they hang beside them, by one abduction read
  // over one of its strides (`walkCarriage`).
  let carried: Record<"left" | "right", number> | undefined;
  const planned: walkStation.IPlan = {
    duration,
    events,
    contacts,
    horizontalRoot: walkHorizontalRoot(body, gait, steps),
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(source);
      const legs: readonly ("left" | "right")[] =
        channels === undefined
          ? walkReach.SIDES
          : walkReach.SIDES.filter((side: "left" | "right"): boolean =>
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
      return HumanArmSwing.carry(
        posture,
        (carried ??= walkCarriage.of(
          body,
          steps.events,
          duration,
          (
            at: number,
            _channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            read?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
          ): IAutoMovieMotionHumanPosture =>
            unswung(at, undefined, undefined, read),
          resolution,
          projection,
        )),
      );
    },
  };

  // The steps' timing: uneven, entrained to a beat, or kept on a station (`walkClock`).
  return walkPlayback(walkClock(context, planned, gait, clock), body);
}
