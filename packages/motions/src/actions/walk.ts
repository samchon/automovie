import { AutoMovieGravity, preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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
  IAutoMovieVector3,
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
import { walkHorizontalRoot } from "./walkHorizontalRoot";
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
  seconds: number;
  pelvis: walkReach.IPelvis;
}

/**
 * Walking to a floor point in whole steps, ending with the feet side by side.
 *
 * Speed comes from dynamic similarity (Alexander 1984): people of different
 * leg length walk alike at equal Froude number `v^2 / (g l)`, so each pace is
 * a Froude number on the hip height `l`: slow 0.12, normal 0.25 and fast
 * 0.32, which give 1.05, 1.51 and 1.71 m/s at the reference hip (`walkRoot.REFERENCE_HIP`, 0.93 m).
 * Step length grows with
 * the square root of speed (Grieve and Gear 1966): `1.2 l sqrt(sqrt(Fr))`,
 * 0.8 hip heights at the normal pace (about 0.4 stature, Perry and Burnfield);
 * the step count is rounded up so every step is at most that long, at the
 * pace's own cadence (`WalkPace`).
 *
 * Each foot follows the three rockers of stance with its contact point fixed
 * on the floor, and swings between footprints on a minimum-jerk path lifted
 * clear of the floor ({@link walkSteps}): 60 % stance and 40 % swing of each
 * stride, so each double support lasts a tenth of a stride (Perry and
 * Burnfield). The pelvis advances fastest near double support and slowest
 * near midstance. Its height follows the two contact heights and accounts
 * for the raised leg's share of the 4–5 cm whole-body excursion. It sways
 * 2 cm toward the stance foot and lowers wherever a planted leg cannot reach its
 * foot, so no plant is ever stretched off its point ({@link walkReach}). A
 * swing joins the stance its foot left, as the leg reached it at toe-off, to
 * the stance it lands in, as the leg reaches it at heel strike
 * ({@link walkFoot}), and the pelvis reads a swinging foot only through those
 * two stances. The pelvis turns 4° and
 * tilts 4° with the stride, the chest counter-rotates, and the arms swing
 * opposite the legs about 15° with the elbows bent 15 to 30° (Perry and
 * Burnfield, normal gait kinematics).
 *
 * The explicit footprints and cut entry pose give the engine's IK their
 * stance targets. The audit reads the same windows through contactMask.
 * Proficiency only varies step timing.
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

  /** Froude number of each pace. Normal uses the metabolic minimum reported for ordinary limbs in Optimal walking speed following changes in limb geometry (2011, PMID 21653821). */
  export const FROUDE: Readonly<Record<NonNullable<IAutoMovieMotionHumanWalkParams["pace"]>, number>> =
    { slow: 0.12, normal: 0.25, fast: 0.32 };

  /**
   * The walking gait of a Froude number: a step of `1.2 l Fr^0.25`, at most
   * `longestStep()` hip heights, 40 % of the stride in swing, a mid-swing
   * lift of `LIFT` hip heights, and arms swinging `SHOULDER` degrees about
   * the shoulder with the elbow bent `ELBOW` and swinging `ELBOW_SWING` about
   * it.
   */
  export const walking: (froude: number) => IAutoMovieMotionHumanWalkGait = (froude: number): IAutoMovieMotionHumanWalkGait => ({
    froude,
    step: (fr: number): number =>
      Math.min(longestStep(), 1.2 * Math.sqrt(Math.sqrt(fr))),
    swing: 0.8,
    lift: LIFT,
    arms: { shoulder: SHOULDER, elbow: ELBOW, swing: ELBOW_SWING },
    lean: LEAN,
  });

  /** The hip's flexion at initial contact, degrees: about 20° (Perry and Burnfield's normal sagittal hip kinematics, read through Perry-based summaries; reported from 20 to 30°, 20 the most consistent). */
  export const CONTACT_FLEXION: number = 20;

  /**
   * The longest walking step, hip heights: the trailing leg at the thigh's
   * largest extension (`walkReach.EXTENSION`, the hip's range less its
   * margin) and the leading leg at its flexion at initial contact
   * (`CONTACT_FLEXION`), both straight from one hip over the floor, put the
   * ankles `sin(EXTENSION) + sin(CONTACT_FLEXION)` hip heights apart; a
   * longer step would ask the trailing hip past its range at toe-off.
   *
   * @returns Hip heights, about 0.81.
   */
  export function longestStep(): number {
    return (
      Math.sin((walkReach.EXTENSION * Math.PI) / 180) +
      Math.sin((CONTACT_FLEXION * Math.PI) / 180)
    );
  }

  /**
   * The ankle's lift above its standing height at the middle of the swing,
   * hip heights. The swing's middle, 80 % of the gait cycle, is the middle of
   * Perry and Burnfield's mid-swing (73 to 87 %), between initial swing's end
   * (hip flexed 15°, knee 60°) and mid-swing's end (hip 25°, knee 25°); read
   * linearly there, the hip is flexed 20° and the knee 42.5°. A thigh `a` at
   * hip flexion `h` and a shank `b` at `h - k` from vertical put the ankle
   * `a (1 - cos h) + b (1 - cos (h - k))` above its standing height. With the
   * thigh and the shank as shares of the hip height in Winter's segment table
   * (greater trochanter at 0.530, knee at 0.285 and ankle at 0.039 of
   * stature; Winter, Biomechanics and Motor Control of Human Movement, after
   * Drillis and Contini 1966), that is about 0.063 hip heights, some 6 cm at
   * the reference hip (`walkRoot.REFERENCE_HIP`). The toe's own clearance is bounded separately
   * (`walkFoot.CLEARANCE`).
   */
  export const LIFT: number =
    ((0.53 - 0.285) * (1 - Math.cos((((15 + 25) / 2) * Math.PI) / 180)) +
      (0.285 - 0.039) *
        (1 - Math.cos(((((15 + 25) / 2 - (60 + 25) / 2)) * Math.PI) / 180))) /
    0.53;

  /** The arms' swing about the shoulder, degrees either way (Perry and Burnfield, normal gait kinematics: about 15°). */
  export const SHOULDER: number = 15;

  /** The elbow's mean flexion through the stride, degrees: the middle of Perry and Burnfield's 15 to 30° elbow range in gait. */
  export const ELBOW: number = (15 + 30) / 2;

  /** The elbow's flexion swing about its mean, degrees: half of Perry and Burnfield's 15 to 30° elbow range in gait. */
  export const ELBOW_SWING: number = (30 - 15) / 2;

  /** The admitted step-length scale (`IAutoMovieMotionHumanWalkParams.stride`): inclusive, dimensionless. */
  export const STRIDE_RANGE: Readonly<{ minimum: number; maximum: number }> = { minimum: 0.6, maximum: 1.3 };

  /** The admitted arm-swing scale (`IAutoMovieMotionHumanWalkParams.armSwing`): inclusive, dimensionless. */
  export const ARM_SWING_RANGE: Readonly<{ minimum: number; maximum: number }> = { minimum: 0, maximum: 2 };

  /** The admitted added shoulder abduction (`IAutoMovieMotionHumanWalkParams.elbows`): inclusive, degrees. */
  export const ELBOWS_RANGE: Readonly<{ minimum: number; maximum: number }> = { minimum: 0, maximum: 30 };

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
    return walkPlayback(
      HumanSupportCarry.on(context, planned, on.prop),
      context.body,
    );
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
    HumanBound.within("stride", authored.stride, STRIDE_RANGE.minimum, STRIDE_RANGE.maximum);
    HumanBound.within("armSwing", authored.arms, ARM_SWING_RANGE.minimum, ARM_SWING_RANGE.maximum);
    HumanBound.within("elbows", elbows, ELBOWS_RANGE.minimum, ELBOWS_RANGE.maximum, "degrees");
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
        walkPosture.PELVIS * Math.cos(2 * Math.PI * phase) * amount,
        walkPosture.PELVIS * Math.sin(2 * Math.PI * phase) * amount,
      ];
    };
    const { events, contacts }: ReturnType<typeof walkWindows.of> = walkWindows.of(steps);
    // A foot as its schedule alone has it, before any pelvis is settled.
    const endOf: (foot: IAutoMovieMotionHumanWalkFoot.IScheduled) => walkFoot.IEnd = (foot: IAutoMovieMotionHumanWalkFoot.IScheduled): walkFoot.IEnd => ({
      ankle: foot.placement.ankle,
      rotation: foot.placement.rotation,
      toes: foot.toes,
    });
    const scheduled: (side: "left" | "right", t: number) => walkFoot.IEnd = (side: "left" | "right", t: number): walkFoot.IEnd =>
      endOf(steps.foot(side, t));

    // The foot schedule and the swing both carry the original heel-strike time.
    const closing: NonNullable<Parameters<typeof walkSwing>[3]> = (side: AutoMovieHumanSide, on: number): boolean =>
      on === steps.lastLanding[side];
    const scheduledAt: ReturnType<typeof walkSwing> = walkSwing(body, gait, scheduled, closing);

    const walking: boolean = gait.swing < 1 && gait.bob === undefined && steps.inPlace !== true;
    const support: ReturnType<typeof walkSupportHeight> | undefined = walking ? walkSupportHeight(steps, body, gait.lift, pelvis, claim) : undefined;
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
      const frame: walkReach.IPelvis = current?.seconds === t
        ? current.pelvis
        : walkReach.pelvis(body, rootAt(t), steps.yaw(t), pelvis(t), {
            left: steps.foot("left", t), right: steps.foot("right", t),
          }, resolution);
      return claim(
        frame.hips[side],
        scheduledAt(side, swing)(u).placement.ankle,
      );
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
      const read: ReturnType<typeof preparePoseResolution> | undefined = resolution === undefined ? undefined : prepareHumanPoseResolution.read(resolution);
      const root: IAutoMovieVector3 = rootAt(t);
      const frame: walkReach.IPelvis = walkReach.pelvis(body, root, steps.yaw(t), hips, feet, read);
      const current: IReachAt = { seconds: t, pelvis: frame };
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
        // The airborne ankle does not lower its support. Transfer only the
        // lowering the landing foot actually needs at the instant of strike.
        if (support !== undefined) {
          const weight: number = walkReach.weight(feet[side]);
          const landing: number = weight === 0 ? 0 : support.landing(side, swing.on, read);
          claims[side] = -walkReach.CLAIM + weight * (landing + walkReach.CLAIM);
          continue;
        }
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
    const reachedAt: ReturnType<typeof walkSwing> = walkSwing(body, gait, end, closing);
    const ranged: Partial<Record<"left" | "right", ReturnType<typeof walkReach.prepareSwing>>> = {};
    function solve(
      t: number,
      legs: readonly ("left" | "right")[],
      phase: number,
      amount: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): walkPosture.ISettled {
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
    const unswung: ReturnType<typeof walkPosture> =
      walkPosture(body, gait, arms, elbows, steps, solve);

    // The swinging arms are carried clear of the body, the hands passing the
    // thighs no nearer than they hang beside them, by one abduction read
    // over one of its strides (`walkCarriage`).
    let carried: Record<"left" | "right", number> | undefined;
    const planned: walkStation.IPlan = {
      duration,
      events,
      contacts,
      horizontalRoot: walkHorizontalRoot(body, gait, steps),
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
    return walkPlayback(walkClock(context, planned, gait), body);
  }
}
