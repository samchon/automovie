import { AutoMovieGravity, preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieMotionManner,
} from "@automovie/interface";

import { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanBound } from "../law/HumanBound";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanSkill } from "../skill/HumanSkill";
import { runStance } from "./runStance";
import { walkCarriage } from "./walkCarriage";
import { walkClear } from "./walkClear";
import { walkClock } from "./walkClock";
import { walkCuts } from "./walkCuts";
import { walkDescent } from "./walkDescent";
import { walkFacing } from "./walkFacing";
import { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";
import { walkPosture } from "./walkPosture";
import { walkReach } from "./walkReach";
import { walkStation } from "./walkStation";
import { walkSteps } from "./walkSteps";
import { walkSwing } from "./walkSwing";
import { walkWindows } from "./walkWindows";

/**
 * Walking to a floor point in whole steps, ending with the feet side by side.
 *
 * Speed comes from dynamic similarity (Alexander 1984): people of different
 * leg length walk alike at equal Froude number `v^2 / (g l)`, so each pace is
 * a Froude number on the hip height `l`: slow 0.12, normal 0.20 and fast
 * 0.32, which give 1.05, 1.35 and 1.71 m/s at a 0.93 m hip, inside the
 * comfortable and fast adult ranges (Bohannon 1997). Step length grows with
 * the square root of speed (Grieve and Gear 1966): `1.2 l sqrt(sqrt(Fr))`,
 * 0.8 hip heights at the normal pace (about 0.4 stature, Perry and Burnfield);
 * the step count is rounded up so every step is at most that long, at the
 * pace's own cadence (`WalkPace`).
 *
 * Each foot follows the three rockers of stance with its contact point fixed
 * on the floor, and swings between footprints on a minimum-jerk path lifted
 * clear of the floor ({@link walkSteps}): 60 % stance and 40 % swing of each
 * stride, so each double support lasts a tenth of a stride (Perry and
 * Burnfield). The pelvis progresses at the walking speed with smooth start
 * and stop, rises and falls 2.5 cm about its mean twice a stride (the 4 to 5
 * cm vertical excursion of the centre of mass), sways 2 cm toward the stance
 * foot, and is lowered wherever a planted leg could not otherwise reach its
 * foot, so no plant is ever stretched off its point ({@link walkReach}). A
 * swing joins the stance its foot left, as the leg reached it at toe-off, to
 * the stance it lands in, as the leg reaches it at heel strike
 * ({@link walkFoot}), and the pelvis reads a swinging foot only through those
 * two stances, so a plant is never moved and every displayed channel is
 * continuous through every contact event by construction. The pelvis turns 4° and
 * tilts 4° with the stride, the chest counter-rotates, and the arms swing
 * opposite the legs about 15° with the elbows bent 15 to 30° (Perry and
 * Burnfield, normal gait kinematics).
 *
 * The engine's gait owners cannot express this, for stated reasons, so the
 * walk plans its own footprints and reuses the engine for everything else
 * (minimum-jerk profiles, the limb fit, the transitions):
 *
 * - `IAutoMovieGait`, `gaitMotion` and `HUMANOID_GAITS` oscillate limb angles
 *   periodically; their stance and swing intervals "do not constrain a
 *   resolved foot to the ground" (`IAutoMovieGaitLimb.duty`), so a footprint, a
 *   stop at a point and a whole-step count cannot be stated in them.
 * - `locomoteMotion` and `followPathMotion` carry that oscillation along a
 *   distance in whole cycles, compressing a short trip, and start from rest,
 *   not from an entry state, so a walk cannot continue a cut.
 * - `plantStanceFeet` and `pinStanceTargets` pin oscillated feet after the
 *   fact and "do not guarantee exact no-skate contact"; here every planted
 *   foot is an IK goal on its footprint, so the 5 mm slip bound holds by
 *   construction rather than by repair.
 *
 * The audits use the engine's `contactMask` to read stance from the result.
 *
 * Proficiency changes nothing here except the cross-task timing variability
 * of the step period; no locomotion study of skill differences in ordinary
 * walking was located, so walking skill is left unscaled.
 */
export namespace walk {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "walk";

  /** Cancel table (`walkCuts`). */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = walkCuts;

  /** What a gait lets an overlay take: the arms it would swing, the hands and the head. */
  export const yields: IAutoMovieMotionHumanActionLaw["yields"] = [
    "head",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
  ];

  /** Froude number of each pace (Alexander 1984; Bohannon 1997 speeds at a 0.93 m hip). */
  export const FROUDE: Readonly<Record<NonNullable<IAutoMovieMotionHumanWalkParams["pace"]>, number>> =
    { slow: 0.12, normal: 0.2, fast: 0.32 };

  /**
   * The walking gait of a Froude number: a step of `1.2 l Fr^0.25`, at most
   * 0.85 hip heights, the fast-walking step that keeps the trailing hip's
   * extension at toe-off inside its range (about 0.8 m at 1.75 m stature), and
   * 40 % of the stride in swing.
   */
  export const walking: (froude: number) => IAutoMovieMotionHumanWalkGait = (froude: number): IAutoMovieMotionHumanWalkGait => ({
    froude,
    step: (fr: number): number =>
      Math.min(0.85, 1.2 * Math.sqrt(Math.sqrt(fr))),
    swing: 0.8,
    lift: 0.07,
    arms: { shoulder: 15, elbow: 22, swing: 8 },
    lean: LEAN,
  });

  /** A walk's forward trunk inclination, degrees (provisional: walkers carry the trunk a few degrees forward of upright, and the inclination grows with speed, Thorstensson et al. 1984, Acta Physiol Scand 121:179). */
  export const LEAN: number = 3;

  /**
   * Plan a walk.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWalkParams>,
  ): IAutoMovieMotionHumanActionPlan {
    // On a moving support the walk planned on it as it stood at the start
    // is carried by its motion, the feet planted on it (#3491).
    const planned: IAutoMovieMotionHumanActionPlan = locomote(
      context,
      walking(FROUDE[context.params.pace ?? "normal"]),
    );
    const on: IAutoMovieMotionHumanWalkParams["on"] = context.params.on;
    if (on === undefined) return planned;
    HumanSupportFrame.board(
      context,
      on.prop,
      Math.sqrt(
        FROUDE[context.params.pace ?? "normal"] *
          AutoMovieGravity.STANDARD *
          context.body.measure.hipHeight,
      ),
    );
    return HumanSupportCarry.on(context, planned, on.prop);
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
   * @evidence contracts/development/implementation.md#principled-implementation Keeps the same planned footprints, pelvis fixed-point reach, swing constraints and hip-pivoted trunk, while explicit channel demand computes only consumed leg goals and arm carriage.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Step planning, fixed-interval swing preparation, pelvis settling and posture assembly each have one owner before the unchanged clock warp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No footprint, event, authored parameter, solver bound or sampling schedule changes; omitted demand still evaluates the complete posture.
   * @evidence contracts/development/implementation.md#efficient-algorithms Step lookup is logarithmic in footfalls; every query retains actual bounded pelvis/foot work for demanded channels. Fixed body/stance prerequisites prepare once, while every reached swing endpoint is actually settled for that swing observation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Root-only pacing omits unread carriage/swing goals; current queries share only exact FK/body prerequisites. Scheduled and reached endpoint readers remain separate, and no completed reached endpoint or fit-derived interpolation reader is retained across observations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains body/steps, declared scalar carriage/descent/flight profiles and fixed geometry, released with the plan. Synchronous endpoint construction borrows one exact FK reader until return/throw; completed stance endpoints and their interpolation reader end with the actual swing observation, without a retained fit or arbitrary-time pose cache.
   */
  export function locomote(
    given: IAutoMovieMotionHumanActionContext<Omit<IAutoMovieMotionHumanWalkParams, "pace">>,
    gait: IAutoMovieMotionHumanWalkGait,
  ): IAutoMovieMotionHumanActionPlan {
    // A station is a way read from its slot; without one the context is as given.
    const context: IAutoMovieMotionHumanActionContext<Omit<IAutoMovieMotionHumanWalkParams, "pace">> =
      walkStation.resolve(given);
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
    HumanBound.within("stride", authored.stride, 0.6, 1.3);
    HumanBound.within("armSwing", authored.arms, 0, 2);
    HumanBound.within("elbows", elbows, 0, 30, "degrees");
    const stride: number = authored.stride * manner.step;
    const arms: number = authored.arms * manner.swing;
    walkClear(context);
    const forward: number = stride * l * gait.step(froude);
    // A walk that does not face its way keeps the share of its speed and
    // step its direction allows, at the same cadence.
    const share: number =
      p.facing === undefined
        ? 1
        : walkFacing.share(body, context.entry, p, p.facing, forward);
    const longest: number = forward * share;
    // A tired member walks slower; a cadenced gait keeps its count (`walkClock.weary`).
    const weary: number = walkClock.weary(context, gait);
    const steps: IAutoMovieMotionHumanWalkSteps.IPlan = walkSteps.plan({
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
    const claim: ReturnType<typeof walkReach.prepareShort> = walkReach.prepareShort(body);

    const pelvis: (t: number, phase?: number, amount?: number) => readonly [number, number, number] = (
      t: number,
      phase: number = steps.phase(t),
      amount: number = steps.amount(t),
    ): readonly [number, number, number] => {
      return [
        0,
        4 * Math.cos(2 * Math.PI * phase) * amount,
        4 * Math.sin(2 * Math.PI * phase) * amount,
      ];
    };
    const { events, contacts }: ReturnType<typeof walkWindows.of> =
      walkWindows.of(body, steps, pelvis, (t: number): walkReach.IPelvis["pivots"] =>
        walkReach.turn(steps.yaw(t), {
          left: steps.foot("left", t), right: steps.foot("right", t),
        }).pivots,
      );
    // A foot as its schedule alone has it, before any pelvis is settled.
    const scheduled: (side: "left" | "right", t: number) => walkFoot.IEnd = (side: "left" | "right", t: number): walkFoot.IEnd => {
      const foot: IAutoMovieMotionHumanWalkFoot.IScheduled = steps.foot(side, t);
      return {
        ankle: foot.placement.ankle,
        rotation: foot.placement.rotation,
        toes: foot.toes,
      };
    };
    const scheduledSwing: ReturnType<typeof walkSwing> = walkSwing(body, gait, scheduled);
    // The lowering a swinging leg asks of the pelvis at a share of its swing for the ankle the schedule swings there, read from the schedule alone so that it needs no settled pelvis and every instant settles the same.
    function reaching(
      side: "left" | "right",
      swing: { off: number; on: number },
      u: number,
      resolution?: ReturnType<typeof preparePoseResolution>,
    ): number {
      const t: number = swing.off + u * (swing.on - swing.off);
      return claim(
        walkReach.pelvis(body, steps.root(t), steps.yaw(t), pelvis(t), {
          left: steps.foot("left", t),
          right: steps.foot("right", t),
        }, resolution).hips[side],
        scheduledSwing(side, swing, u).placement.ankle,
      );
    }
    // A swing's scheduled descent, memoised by its toe-off.
    const descents: Map<string, walkDescent.IPlan> = new Map();
    const flights: Map<string, [number, number]> = new Map();
    function settle(
      t: number,
      feet: Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled>,
      amount: number = steps.amount(t),
      hips: readonly [number, number, number] = pelvis(t, steps.phase(t), amount),
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): walkReach.IGround {
      const read: ReturnType<typeof preparePoseResolution> | undefined = resolution === undefined ? undefined : prepareHumanPoseResolution.read(resolution);
      const claims: Partial<Record<"left" | "right", number>> = {};
      for (const side of ["left", "right"] as const) {
        const swing: IAutoMovieMotionHumanWalkFoot.IScheduled["swing"] = feet[side].swing;
        if (swing === undefined) continue;

        // A foot in flight bears nothing: it claims what its stance claimed
        // when it left and what the next claims when it lands, blended.
        if (gait.swing > 1) {
          const key: string = `${side}:${swing.off}`;
          let held: [number, number] | undefined = flights.get(key);
          if (held === undefined) {
            const sampled: ReturnType<typeof preparePoseResolution> = read ?? preparePoseResolution();
            held = [reaching(side, swing, 0, sampled), reaching(side, swing, 1, sampled)];
            flights.set(key, held);
          }
          claims[side] = runStance.airborne(held, swing.u);
          continue;
        }
        if (swing.u < walkDescent.START) continue;
        const key: string = `${side}:${swing.off}`;
        let descent: walkDescent.IPlan | undefined = descents.get(key);
        if (descent === undefined) {
          const sampled: ReturnType<typeof preparePoseResolution> = read ?? preparePoseResolution();
          descent = walkDescent.plan((u: number): number =>
            reaching(side, swing, u, sampled),
          );
          descents.set(key, descent);
        }
        claims[side] = walkDescent.claim(
          descent,
          swing.u,
          reaching(side, swing, swing.u, read),
          -walkReach.CLAIM,
        );
      }
      return walkReach.ground(
        body,
        steps.root(t),
        steps.yaw(t),
        hips,
        feet,
        claims,

        // The forefoot rocker is a stepping foot's: it comes in with the gait and goes with it, so a walk stands flat where it starts and stops.
        walkLeg.ROCKER * amount,
        read,
      );
    }
    // Settle every reached endpoint for the current swing observation.
    // A swing joins the stance it left and the stance it lands in, each
    // settled at the swing's own two ends: constants of the step, so each is
    // settled once for the plan, as its descent and its flight are, rather
    // than again at every second the swing is read.
    const ends: Map<string, walkFoot.IEnd> = new Map();
    const end: (side: "left" | "right", t: number, resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2]) => walkFoot.IEnd = (side: "left" | "right", t: number, resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2]): walkFoot.IEnd => {
      const key: string = `${side}:${t}`;
      let known: walkFoot.IEnd | undefined = ends.get(key);
      if (known === undefined) {
        known = settle(t, {
          left: steps.foot("left", t),
          right: steps.foot("right", t),
        }, undefined, undefined, resolution).feet[side];
        ends.set(key, known);
      }
      return known;
    };
    const reachedSwing: ReturnType<typeof walkSwing> = walkSwing(body, gait, end);
    const ranged: Partial<Record<"left" | "right", ReturnType<typeof walkReach.prepareSwing>>> = {};
    function solve(
      t: number,
      legs: readonly ("left" | "right")[],
      phase: number,
      amount: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): {
      feet: Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled>;
      hips: readonly [number, number, number];
      settled: walkReach.IGround;
      reached: Record<"left" | "right", walkFoot.IEnd>;
    } {
      const feet: Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled> = {
        left: steps.foot("left", t),
        right: steps.foot("right", t),
      };
      const hips: readonly [number, number, number] = pelvis(t, phase, amount);
      const settled: walkReach.IGround = settle(t, feet, amount, hips, resolution);
      const reached: Record<"left" | "right", walkFoot.IEnd> = {} as Record<"left" | "right", walkFoot.IEnd>;
      for (const side of ["left", "right"] as const) {
        const swing: IAutoMovieMotionHumanWalkFoot.IScheduled["swing"] = feet[side].swing;
        if (!legs.includes(side)) {
          reached[side] = { ankle: feet[side].placement.ankle, rotation: feet[side].placement.rotation, toes: feet[side].toes };
          continue;
        }
        if (swing === undefined) {
          reached[side] = settled.feet[side];
          continue;
        }
        reached[side] = (ranged[side] ??= walkReach.prepareSwing(body, side))(
          settled,
          reachedSwing(side, swing, swing.u, resolution),
        );
      }
      return { feet, hips, settled, reached };
    }
    const unswung: ReturnType<typeof walkPosture> =
      walkPosture(body, gait, arms, elbows, steps, solve);

    // The swinging arms are carried clear of the body, the hands passing the
    // thighs no nearer than they hang beside them, by one abduction read
    // over one of its strides (`walkCarriage`).
    let carried: Record<"left" | "right", number> | undefined;
    const planned: IAutoMovieMotionHumanActionPlan = {
      duration,
      events,
      contacts,
      posture: (seconds: number, channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1], source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2], projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture => {
        const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
        const legs: readonly ("left" | "right")[] = channels === undefined
          ? walkReach.SIDES
          : walkReach.SIDES.filter((side: "left" | "right"): boolean => channels.includes(`${side}Leg`));
        const posture: IAutoMovieMotionHumanPosture = unswung(seconds, legs, channels, resolution);
        if (channels !== undefined && !channels.includes("leftArm") && !channels.includes("rightArm"))
          return posture;
        return HumanArmSwing.carry(
          posture,
          (carried ??= walkCarriage.of(body, steps.events, duration,
            (at: number, _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1], read?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2]): IAutoMovieMotionHumanPosture => unswung(at, undefined, undefined, read),
            resolution, projection)),
        );
      },
    };

    // The steps' timing: uneven, entrained to a beat, or kept on a station (`walkClock`).
    return walkClock(context, planned, gait);
  }
}
