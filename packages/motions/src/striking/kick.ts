import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingAim } from "./StrikingAim";
import { StrikingBody } from "./StrikingBody";
import { StrikingLeg } from "./StrikingLeg";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingReach } from "./StrikingReach";
import { StrikingRecord } from "./StrikingRecord";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStroke } from "./StrikingStroke";
import { StrikingTarget } from "./StrikingTarget";

/**
 * A kick: the round kick's lower shin or the push kick's ball of the foot
 * brought onto the target, through a chamber, and recoiled to the replant.
 *
 * Effector goals, not keyed angles: the ankle travels on superposed
 * minimum-jerk units from its plant through the chamber (the knee raised
 * toward the target, the foot folded behind it) to the contact and back
 * through a re-chamber, the knee's bend hint and the foot's rotation riding
 * along, and the engine's limb fit solves the leg. At contact the ankle and
 * knee are the two-segment solve ({@link StrikingReach}) that puts the lower
 * shin (seven tenths of the way from the knee) or the ball of the foot on the
 * target point, with the knee between 5 and 40 degrees of flexion (35 for the
 * push kick); a target nearer than that band is met higher up the shin, as a
 * jammed kick lands; one beyond it, after a step-up of the support foot by up
 * to half a stance, is missed at maximum reach.
 *
 * The body carries the kick (Gavagan and Sayers 2017 phases; kickboxing
 * research of #3201): the support foot pivots on its ball with the heel
 * raised, the pelvis turns over into the kick and the root moves over the
 * support foot, with the trunk leaning away to keep the centre of mass over
 * it (low, body and high kicks lean 5, 15 and 25 degrees, provisional
 * readings of the coaching photographs). Both gloves keep their guard, the
 * kicking-side glove extended forward at the head line (the kick-guard
 * decision of the kickboxing research).
 *
 * Timing (Gavagan and Sayers 2017): preparation 0.074 s, chamber 14 % and
 * extension 11 % of the 1.02 s execution, recoil 0.65 s; the round kick lands
 * at 0.55 of its peak foot speed. Skill scales chamber and recoil by 1.4 to 1
 * and the strike phase by 1.06 to 1, and the chamber's height by its range
 * share ({@link StrikingSkill}). Every phase applies to low, body and high
 * kicks alike, an approximation the source states (it timed head kicks).
 *
 * A round kick may be redirected before its chamber key into another round
 * kick (a middle kick switched to a high kick): the new kick keeps the old
 * one's clock and path and superposes one minimum-jerk unit from the old
 * contact goal to the new one (Flash and Henis 1991), while the body's lean
 * and turn move to the new level's on the same profile, so position,
 * velocity and acceleration stay continuous through the switch.
 */
export namespace kick {
  /** The action's name. */
  export const name: HumanActionName = "kick";

  /** Cancel table: a round kick redirects into another until its chamber key. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    kick: [{ window: [0, "chamber"], kind: "redirect", entry: 0 }],
  };

  /** Parameters. */
  export interface IParams {
    /** The technique: the round kick with the shin, or the push kick (teep) with the ball of the foot. */
    technique: "round" | "push";

    /** Which leg: the stance's lead or rear; rear for a round kick and lead for a push kick when absent. */
    leg?: "lead" | "rear";

    /** What it strikes. */
    at: AutoMovieMotionTarget;

    /** Declared accuracy; `hit` when absent. */
    accuracy?: StrikingQuality.Accuracy;

    /** A feint: the kick shows its chamber and returns without extending. */
    feint?: boolean;
  }

  /** Knee flexion band at contact, degrees: not locked, not jammed (kickboxing research: "a bent knee can remain at delivery"). */
  export const FLEXION: Readonly<Record<IParams["technique"], readonly [number, number]>> = { round: [5, 40], push: [5, 35] };

  /** Share of the shank from the knee at which the round kick's shin lands: the lower shin (kickboxing research, surfaces table). */
  export const SHIN_SHARE: number = 0.7;

  /**
   * Where the target lies from the turned pelvis's forward toward the
   * kicking side at contact, degrees, by height band. A full turnover puts it
   * at 90 degrees and lifts the leg by abduction, but the rig's hip abducts at
   * most 45 degrees (`DEFAULT_HUMANOID_ROM`), so higher kicks rise more through
   * the hip's flexion with less turnover; provisional values, no study gives
   * the angle.
   */
  export const AZIMUTH: Readonly<Record<"low" | "middle" | "high", number>> = { low: 35, middle: 25, high: 15 };

  /** The least and most trunk lean away from the kicking leg, degrees (the lean itself is what the hip's swing cone cannot reach; bounds provisional). */
  export const LEAN_LEAST: number = 5;

  /** The most trunk lean, degrees (provisional reading of coaching photographs of head kicks). */
  export const LEAN_MOST: number = 40;

  /**
   * The most the pelvis itself tips away from the kick, degrees: rolling the
   * whole body about its root would carry the support hip off its planted
   * foot, so beyond this the lean is the trunk's lateral flexion (the spine's
   * 35 and the chest's 25 degree abduction ranges hold the 40 degree lean).
   * Provisional.
   */
  export const PELVIS_ROLL: number = 10;

  /** Support heel raise and foot turn at contact, degrees (provisional reading of the pivot on the ball). */
  export const PIVOT: { readonly raise: number; readonly turn: number } = { raise: 15, turn: 60 };

  /** The push kick's impact speed share: it drives through rather than snaps (provisional, no measured teep). */
  export const PUSH_SPEED_SHARE: number = 0.8;

  /**
   * The leg a kick's parameters resolve to.
   *
   * @param params The parameters.
   * @returns Lead or rear.
   */
  export function leg(params: IParams): "lead" | "rear" {
    return params.leg ?? (params.technique === "round" ? "rear" : "lead");
  }

  /**
   * Plan a kick.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const p: IParams = context.params;

    // A redirect continues its source's clock: the kick's own time zero is
    // the source's, and this instance shows it from the cut on.
    const source: ISource | undefined = redirected(context);
    const timing: ITiming = source?.timing ?? measure(context);
    const t0: number = source?.start ?? context.start;
    const offset: number = context.start - t0;
    const duration: number = timing.duration - offset;
    const share = (seconds: number): number => Math.min(1, Math.max(0, (seconds - offset) / duration));
    const events: IAutoMovieMotionEvent[] = [
      ...(timing.prep >= offset ? [{ name: "launch", share: share(timing.prep) }] : []),
      ...(timing.chamber >= offset ? [{ name: "chamber", share: share(timing.chamber) }] : []),
      ...(p.feint === true ? [] : [{ name: "impact", share: share(timing.impact) }]),
      { name: "replant", share: 1 },
    ];
    let built: IGeometry | undefined;
    let building: boolean = false;
    const geometry = (): IGeometry => {
      if (built !== undefined) return built;
      if (building) throw new Error(`${context.subject}: the kick was read back while it was being planned`);
      building = true;
      try {
        built = source === undefined ? build(context, timing, t0) : redirect(context, timing, source);
      } finally {
        building = false;
      }
      return built;
    };
    const out: IHumanActionPlan = {
      duration,
      events,
      get contacts(): IHumanContactWindow[] {
        return geometry()
          .contacts.map((c: IHumanContactWindow): IHumanContactWindow => ({
            ...c,
            from: share(c.from * timing.duration),
            to: share(c.to * timing.duration),
          }))
          .filter((c: IHumanContactWindow): boolean => c.to > c.from || c.to === 1);
      },
      ...(p.feint === true ? {} : { contact: timing.impact - offset }),
      posture: (seconds: number): IHumanPosture => geometry().posture(Math.min(timing.duration, Math.max(0, seconds + offset))),
      settle: (): void => {
        built = undefined;
      },
    };
    SOURCES.set(out, { timing, geometry, params: p, start: t0, context: source?.context ?? context });
    StrikingRecord.register(out, (): StrikingRecord.IRecord => geometry().record);
    return out;
  }

  /** A kick's timing, seconds from its start. */
  interface ITiming {
    /** The kicking side. */
    side: "left" | "right";
    /** The stance's lead side. */
    lead: "left" | "right";
    /** The kick's preparation end (the launch of the knee). */
    prep: number;
    /** The chamber key. */
    chamber: number;
    /** The contact, or the feint's return start. */
    impact: number;
    /** The replant. */
    duration: number;
  }

  /** A built kick. */
  interface IGeometry {
    /** The posture at seconds since the start. */
    posture(seconds: number): IHumanPosture;
    /** The body's posture without the kicking leg's goal. */
    base(seconds: number): IHumanPosture;
    /** The kicking ankle at seconds since the start. */
    ankle(seconds: number): IAutoMovieVector3;
    /** The kicking knee's bend hint at seconds since the start. */
    hint(seconds: number): IAutoMovieVector3;
    /** The kicking foot's rotation at seconds since the start. */
    rotation(seconds: number): IAutoMovieQuaternion;
    /** The ankle's planned contact goal, world metres. */
    goal: IAutoMovieVector3;
    /** The feet's contact windows. */
    contacts: IHumanContactWindow[];
    /** The ankle stroke's input, so a redirect can continue it. */
    stroke: StrikingStroke.IInput;
    /** What the kick decided. */
    record: StrikingRecord.IRecord;
  }

  /** A kick another kick may continue from. */
  interface ISource {
    /** Its timing. */
    timing: ITiming;
    /** Its geometry, built on demand. */
    geometry: () => IGeometry;
    /** Its parameters. */
    params: IParams;
    /** Film second of its time zero. */
    start: number;
    /** The context it was planned from, its entry being the kick's own start. */
    context: IHumanActionContext<IParams>;
  }

  /** Every planned kick, so a redirect can continue its source. */
  const SOURCES: WeakMap<IHumanActionPlan, ISource> = new WeakMap();

  /** The kick a redirect continues, when this instance is one. */
  function redirected(context: IHumanActionContext<IParams>): ISource | undefined {
    const from = context.entry.from;

    // Only a cut before the source's chamber key is a redirect: the cancel
    // table admits no other kick-to-kick cut.
    if (from === undefined || from.name !== "kick" || !(from.share < 1 - 1e-9)) return undefined;
    const source: ISource | undefined = SOURCES.get(from.plan);
    if (source === undefined) throw new Error("A kick redirect needs its source kick's plan");
    if (from.share * source.timing.duration > source.timing.chamber + 1e-9) return undefined;
    if (source.params.technique !== "round" || context.params.technique !== "round") throw new Error("Only a round kick redirects into a round kick");
    return source;
  }

  /** A fresh kick's timing. */
  function measure(context: IHumanActionContext<IParams>): ITiming {
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const side: "left" | "right" = leg(context.params) === "lead" ? lead : StrikingStance.rear({ lead });
    const slow: number = StrikingSkill.recovery(context.skill);
    const prep: number = StrikingSkill.KICK_PREPARATION;
    const chamber: number = prep + HumanSkill.jitter(context.skill, context.random("chamber"), StrikingSkill.KICK_CHAMBER * slow);
    const impact: number = chamber + (context.params.feint === true ? 0 : StrikingSkill.KICK_EXTENSION * StrikingSkill.strike(context.skill));
    const recoil: number = context.params.feint === true ? chamber - prep : StrikingSkill.KICK_RECOIL * slow;
    return { side, lead, prep, chamber, impact, duration: impact + recoil };
  }

  /** A heading difference wrapped into (-180, 180]. */
  function wrap(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }

  /** The height band of a target point against a body's own heights. */
  function band(body: IHumanActionContext["body"], point: IAutoMovieVector3, floor: number): "low" | "middle" | "high" {
    const h: number = point.y - floor;
    if (h < body.measure.waistHeight * 0.85) return "low";
    if (h < body.measure.shoulderHeight * 1.02) return "middle";
    return "high";
  }

  /** Build a fresh kick's geometry. */
  function build(context: IHumanActionContext<IParams>, timing: ITiming, t0: number): IGeometry {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const { side, prep, chamber, impact, duration } = timing;
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const entry: IHumanPosture = context.entry.posture;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const aim = (seconds: number): IAutoMovieVector3 =>
      StrikingTarget.aim(context, p.at, seconds, (height: number): number =>
        p.technique === "push"
          ? 0.9 * (m.thigh + m.shank)
          : 0.5 * m.hipHalfWidth + Math.sqrt(Math.max(0, (0.9 * (m.thigh + SHIN_SHARE * m.shank)) ** 2 - (height - m.hipHeight) ** 2)),
      );
    const round: boolean = p.technique === "round";

    // The line, the height band and the body's turn and lean for it.
    const first: IAutoMovieVector3 = aim(t0 - StrikingTarget.LOOK);
    const line: IAutoMovieVector3 = StrikingTarget.line(entry.root, first, entry.yaw);
    const outward: IAutoMovieVector3 = Vector3.scale(Vector3.cross(up, line), side === "left" ? 1 : -1);
    const level: "low" | "middle" | "high" = band(body, first, 0);
    const amplitude: number = StrikingSkill.amplitude(context.skill);
    const away: number = side === "right" ? 1 : -1;

    // The pelvis turns until the target lies the band's azimuth to the
    // kicking side of its forward, and the trunk leans away by what the
    // hip's 120 degree swing cone (kept 20 % inside) cannot raise the leg to.
    const hip0: IAutoMovieVector3 = StrikingBody.trunk(body, entry).get(`${side}UpperLeg` as AutoMovieHumanoidBone)!.worldPosition;
    const toTarget: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(first, hip0));
    const elevation: number = (Math.acos(Math.max(-1, Math.min(1, -toTarget.y))) * 180) / Math.PI;
    const wanted: number = StrikingTarget.heading(line) + away * AZIMUTH[level];
    const turn: number = round ? wrap(wanted - entry.yaw) * amplitude : 0;
    const lean: number = round ? -away * Math.min(LEAN_MOST, Math.max(LEAN_LEAST, elevation - 0.8 * 120)) * amplitude : 0;
    const pitch: number = round ? 0 : -8 * amplitude;
    const feet: Record<"left" | "right", HumanFoot.IPlacement> = StrikingTarget.feet(context.entry);

    // The travel at contact and the foot's rotation.
    const direction: IAutoMovieVector3 = round
      ? Vector3.normalize(Vector3.add(Vector3.add(Vector3.scale(outward, -0.85), Vector3.scale(line, 0.35)), Vector3.scale(up, level === "low" ? -0.25 : level === "high" ? 0.1 : 0)))
      : line;
    const offset: IAutoMovieVector3 = StrikingQuality.offset({
      skill: context.skill,
      random: context.random("scatter"),
      ...(p.accuracy === undefined ? {} : { accuracy: p.accuracy }),
      direction,
      radius: m.shankRadius,
      distance: Vector3.length(Vector3.subtract(first, feet[side].ankle)),
      seconds: impact - prep,
    });
    const tracker: StrikingAim.ITracker = StrikingAim.track(
      aim,
      { launch: t0 - StrikingTarget.LOOK, impact: t0 + impact, latency: StrikingSkill.CORRECTION_LATENCY, step: 1 / 24, shortest: 0.04 },
      offset,
    );

    // The support foot steps up when the leg's band falls short.
    const stanceLength: number = StrikingStance.length(body);
    const shift = (t: number): number => minimumJerk(t / chamber).s - minimumJerk((t - impact) / (duration - impact)).s;
    const overSupport: IAutoMovieVector3 = { x: feet[support].ankle.x, y: 0, z: feet[support].ankle.z };
    const baseAt = (t: number, step: number): IHumanPosture => {
      const w: number = shift(t);
      const stepped: number = step * minimumJerk(t / chamber).s;
      const centre: IAutoMovieVector3 = Vector3.lerp({ ...entry.root, y: 0 }, Vector3.add(overSupport, Vector3.scale(line, step)), 0.8 * w);
      const supportFoot: HumanFoot.IPlacement = StrikingTarget.pivot(
        body,
        support,
        StrikingTarget.slide(feet[support], line, stepped, step > 0 ? 0.015 * m.stature * 4 * minimumJerk(t / chamber).s * (1 - minimumJerk(t / chamber).s) : 0),
        PIVOT.turn * Math.sign(turn) * amplitude * w,
        PIVOT.raise * w,
      );
      // The pelvis tips at most PELVIS_ROLL away from the kick; the rest of
      // the lean is the trunk's lateral flexion (spine and chest abduction,
      // positive toward the body's right like the roll), which no effector
      // goal expresses, so it is set as angles inside their ranges.
      const roll: number = Math.max(-PELVIS_ROLL, Math.min(PELVIS_ROLL, lean));
      const bendRest: number = (lean - roll) * w;
      return resolveHumanPosture.lower(body, {
        root: { x: centre.x, y: entry.root.y, z: centre.z },
        yaw: entry.yaw + turn * w,
        pitch: entry.pitch + pitch * w,
        roll: entry.roll + roll * w,
        joints: { ...entry.joints, ...StrikingStance.joints(), spine: [0, 0.55 * bendRest, 0], chest: [0, 0.45 * bendRest, 0] },
        limbs: StrikingStance.legs(body, side === "left" ? { left: feet.left, right: supportFoot } : { left: supportFoot, right: feet.right }, {
          left: side !== "left",
          right: side !== "right",
        }),
      }, 5);
    };
    const hipAt = (posture: IHumanPosture): IAutoMovieVector3 =>
      StrikingBody.trunk(body, posture).get(`${side}UpperLeg` as AutoMovieHumanoidBone)!.worldPosition;

    // The contact solve: the shin's axis point (or the ankle behind the
    // ball, the push kick's sole facing the target with the toes up) from the
    // hip at contact, with a step-up when short.
    const sole: IAutoMovieQuaternion = StrikingBody.foot(up, Vector3.scale(line, -1));
    const ball: IAutoMovieVector3 = StrikingBody.socket(body, side === "left" ? "ballLeft" : "ballRight", sole);
    const wantedPoint: IAutoMovieVector3 = round ? Vector3.subtract(tracker.planned, Vector3.scale(direction, m.shankRadius)) : Vector3.subtract(tracker.planned, ball);

    // The hip swings at most 120 degrees from the pelvis's down axis
    // (`DEFAULT_HUMANOID_ROM`'s cone), kept 5 % inside: a point beyond that
    // cone is brought onto its edge at the same distance, so the leg stops
    // short along its highest reachable line, the declared rule for a target
    // the body cannot reach.
    const within = (hip: IAutoMovieVector3, posture: IHumanPosture): IAutoMovieVector3 => {
      const down: IAutoMovieVector3 = Quaternion.rotateVector(StrikingBody.trunk(body, posture).get("hips")!.worldRotation, { x: 0, y: -1, z: 0 });
      const toward: IAutoMovieVector3 = Vector3.subtract(wantedPoint, hip);
      const length: number = Vector3.length(toward);
      const limit: number = (0.95 * 120 * Math.PI) / 180;
      const angle: number = Math.acos(Math.max(-1, Math.min(1, Vector3.dot(toward, down) / length)));
      if (angle <= limit) return wantedPoint;
      const across: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(toward, Vector3.scale(down, Vector3.dot(toward, down))));
      return Vector3.add(hip, Vector3.scale(Vector3.add(Vector3.scale(down, Math.cos(limit)), Vector3.scale(across, Math.sin(limit))), length));
    };
    let point: IAutoMovieVector3 = wantedPoint;
    const solveFrom = (hip: IAutoMovieVector3, posture: IHumanPosture): StrikingReach.ISolution =>
      StrikingReach.chain({
        root: hip,
        point: (point = within(hip, posture)),
        upper: m.thigh,
        along: round ? SHIN_SHARE * m.shank : m.shank,
        lower: m.shank,
        bend: round ? Vector3.add(direction, Vector3.scale(up, 0.3)) : Vector3.add(up, line),
        flexion: FLEXION[p.technique],
        slide: round,
      });
    let solved: StrikingReach.ISolution = solveFrom(hipAt(baseAt(impact, 0)), baseAt(impact, 0));
    let step: number = 0;
    if (p.feint !== true && solved.status === "short") {
      step = Math.min(0.5 * stanceLength, solved.gap);
      solved = solveFrom(hipAt(baseAt(impact, step)), baseAt(impact, step));
    }
    const reachedWeapon: IAutoMovieVector3 = round
      ? Vector3.add(solved.point, Vector3.scale(direction, m.shankRadius))
      : Vector3.add(solved.end, ball);
    const base = (t: number): IHumanPosture => baseAt(t, step);
    const hip: IAutoMovieVector3 = hipAt(base(impact));

    // A round kick's foot is pointed along the shank with the instep facing
    // the travel, so the instep and the lower shin present one surface.
    const rotationAt: IAutoMovieQuaternion = round ? StrikingBody.foot(Vector3.normalize(Vector3.subtract(solved.end, solved.middle)), direction) : sole;

    // The chamber: the knee raised toward the target's height, the foot
    // folded behind it, both scaled by the range share skill uses.
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      resolvePose(context.entry.pose, body.skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
        (r: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
    const startKnee: IAutoMovieVector3 = bones.get(`${side}LowerLeg` as AutoMovieHumanoidBone)!.worldPosition;
    const rise: number = Math.max(-0.2, Math.min(1, (point.y - hip.y) / m.thigh + 0.6));
    const kneeUp: IAutoMovieVector3 = Vector3.add(hip, Vector3.scale(Vector3.normalize(Vector3.add(Vector3.add(Vector3.scale(line, 0.6), Vector3.scale(up, rise)), Vector3.scale(outward, round ? 0.5 : 0))), m.thigh));
    const kneeChamber: IAutoMovieVector3 = Vector3.lerp(startKnee, kneeUp, amplitude);
    const fold: IAutoMovieVector3 = round
      ? Vector3.normalize(Vector3.add(Vector3.add(Vector3.scale(direction, -0.6), Vector3.scale(up, -0.5)), Vector3.scale(line, -0.3)))
      : Vector3.normalize(Vector3.add(Vector3.scale(up, -0.8), Vector3.scale(line, -0.4)));
    const ankleChamber: IAutoMovieVector3 = Vector3.add(kneeChamber, Vector3.scale(fold, m.shank));
    const reached: IAutoMovieVector3 = p.feint === true ? ankleChamber : solved.end;
    const units = StrikingStroke.delivery({
      origin: feet[side].ankle,
      via: { point: ankleChamber, begin: t0 + prep, end: t0 + chamber, overlap: p.feint === true ? 0 : 0.4 * (chamber - prep) },
      impact: reached,
      direction: p.feint === true ? Vector3.subtract(ankleChamber, feet[side].ankle) : direction,
      launch: t0 + prep,
      contact: t0 + Math.max(impact, chamber + 1e-3),
      speed: p.feint === true ? 1 : round ? StrikingSkill.IMPACT_SPEED_SHARE.kick : PUSH_SPEED_SHARE,
    });

    // The return: re-chamber, then the replant where the foot left, moved by
    // any step-up.
    const back: IAutoMovieVector3 = Vector3.add(feet[side].ankle, Vector3.scale(line, step));
    const hintAt = (t: number): IAutoMovieVector3 => {
      const a: number = minimumJerk((t - prep) / (chamber - prep)).s;
      const b: number = minimumJerk((t - chamber) / Math.max(1e-3, impact - chamber)).s;
      const c: number = minimumJerk((t - impact) / (duration - impact)).s;
      const contactHint: IAutoMovieVector3 = StrikingReach.hint(hip, solved, round ? Vector3.add(direction, Vector3.scale(up, 0.3)) : Vector3.add(up, line), 0.25 * m.thigh);
      const outbound: IAutoMovieVector3 = Vector3.lerp(Vector3.lerp(startKnee, kneeChamber, a), p.feint === true ? kneeChamber : contactHint, b);
      return Vector3.lerp(outbound, Vector3.add(startKnee, Vector3.scale(line, step)), c);
    };
    const rotation = (t: number): IAutoMovieQuaternion =>
      Quaternion.slerp(
        Quaternion.slerp(feet[side].rotation, rotationAt, minimumJerk((t - prep) / (chamber - prep)).s),
        feet[side].rotation,
        minimumJerk((t - impact - 0.5 * (duration - impact)) / (0.5 * (duration - impact))).s,
      );
    const struck: IHumanActionContext.IPerformer | undefined =
      p.at.kind === "person" && p.feint !== true && StrikingQuality.stops(p.accuracy) ? context.performer(p.at.subject) : undefined;
    const input: StrikingStroke.IInput = {
      origin: feet[side].ankle,
      units,
      ...(p.feint === true ? {} : { tracker }),
      contact: t0 + impact,
      back,
      recoil: duration - impact,
      rechamber: Vector3.add(ankleChamber, Vector3.scale(line, step)),
      ...(struck === undefined ? {} : { gap: exact(body, struck, side, (t: number): IHumanPosture => posed(t - t0)) }),
      scan: { from: t0 + prep, to: t0 + impact + 0.1, step: 1 / 96 },
    };
    const stroke: StrikingStroke.IStroke = StrikingStroke.create(input);
    let posed: (t: number) => IHumanPosture = base;
    const built: IGeometry = compose(context, timing, t0, {
      base,
      ankle: (t: number): IAutoMovieVector3 => stroke.end(t0 + t),
      hint: hintAt,
      rotation,
      goal: solved.end,
      contacts: windows(timing, side, support, step > 0),
      stroke: input,
      record: { offset, planned: tracker.planned, reached: reachedWeapon, status: solved.status, stop: stroke.stop },
    });
    posed = built.posture;
    return built;
  }

  /**
   * The lower leg's gap to the struck body measured on the leg the display
   * will show: the posture at the second resolved by the same limb fit, so
   * the contact the scan finds is the contact the figure makes.
   */
  function exact(
    body: IHumanActionContext["body"],
    struck: IHumanActionContext.IPerformer,
    side: "left" | "right",
    posture: (seconds: number) => IHumanPosture,
  ): (ankle: IAutoMovieVector3, seconds: number) => number {
    return (_ankle: IAutoMovieVector3, seconds: number): number => {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
        resolvePose(resolveHumanPosture(body, posture(seconds)), body.skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
          (r: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
        ),
      );
      const knee: IAutoMovieVector3 = bones.get(`${side}LowerLeg` as AutoMovieHumanoidBone)!.worldPosition;
      const ankle: IAutoMovieVector3 = bones.get(`${side}Foot` as AutoMovieHumanoidBone)!.worldPosition;
      return StrikingLeg.gap(body, struck, knee, ankle, seconds);
    };
  }

  /** Build a redirect: the source's path plus one unit toward the new goal, the body moving to the new level's lean. */
  function redirect(context: IHumanActionContext<IParams>, timing: ITiming, source: ISource): IGeometry {
    const old: IGeometry = source.geometry();

    // The new kick planned as if thrown from the source's own entry, with
    // this instance's parameters and draws.
    const t0: number = source.start;
    const fresh: IGeometry = build({ ...source.context, params: context.params, random: context.random, start: t0 }, timing, t0);
    const cut: number = context.start - t0;
    const span: number = Math.max(1e-3, timing.impact - cut);
    const blend = (t: number): number => minimumJerk((t - cut) / span).s;

    // The source's own delivery with one unit from its contact goal to the
    // new one, its return and contact sweep taken from the new kick.
    const p: IParams = context.params;
    const struck: IHumanActionContext.IPerformer | undefined =
      p.at.kind === "person" && StrikingQuality.stops(p.accuracy) ? context.performer(p.at.subject) : undefined;
    let posed: (t: number) => IHumanPosture = old.base;
    const input: StrikingStroke.IInput = {
      ...fresh.stroke,
      origin: old.stroke.origin,
      units: [...old.stroke.units, { displacement: Vector3.subtract(fresh.goal, old.goal), start: t0 + cut, duration: span }],
      ...(struck === undefined ? {} : { gap: exact(context.body, struck, timing.side, (t: number): IHumanPosture => posed(t - t0)) }),
      scan: { ...fresh.stroke.scan, from: t0 + cut },
    };
    const stroke: StrikingStroke.IStroke = StrikingStroke.create(input);
    const built: IGeometry = compose(context, timing, t0, {
      base: (t: number): IHumanPosture => {
        const a: IHumanPosture = old.base(t);
        const b: IHumanPosture = fresh.base(t);
        const w: number = blend(t);

        // Every angle the two bodies set (the trunk's lean) moves on the same
        // profile as the heading, so nothing jumps at the cut.
        const joints: IHumanPosture["joints"] = { ...b.joints };
        for (const [bone, value] of Object.entries(b.joints) as [keyof IHumanPosture["joints"], readonly [number, number, number]][]) {
          const from: readonly [number, number, number] | undefined = a.joints[bone];
          if (from !== undefined) joints[bone] = [from[0] + (value[0] - from[0]) * w, from[1] + (value[1] - from[1]) * w, from[2] + (value[2] - from[2]) * w];
        }
        return { ...b, joints, yaw: a.yaw + (b.yaw - a.yaw) * w, roll: a.roll + (b.roll - a.roll) * w, pitch: a.pitch + (b.pitch - a.pitch) * w, root: Vector3.lerp(a.root, b.root, w) };
      },
      ankle: (t: number): IAutoMovieVector3 => stroke.end(t0 + t),
      hint: (t: number): IAutoMovieVector3 => Vector3.lerp(old.hint(t), fresh.hint(t), blend(t)),
      rotation: (t: number): IAutoMovieQuaternion => Quaternion.slerp(old.rotation(t), fresh.rotation(t), blend(t)),
      goal: fresh.goal,
      contacts: fresh.contacts,
      stroke: input,
      record: { ...fresh.record, stop: stroke.stop },
    });
    posed = built.posture;
    return built;
  }

  /**
   * Assemble the posture from the body, the kicking leg and the guard. When
   * the leg meets a surface before its planned contact, the whole striking
   * chain (the pelvis's turn and lean, the knee's hint, the foot) holds where
   * it was for the dwell and then returns over the rest of the kick, so the
   * knee and thigh never keep turning into a body the shin has stopped on.
   */
  function compose(context: IHumanActionContext<IParams>, timing: ITiming, t0: number, parts: Omit<IGeometry, "posture">): IGeometry {
    const body = context.body;
    const limb: "leftLeg" | "rightLeg" = timing.side === "left" ? "leftLeg" : "rightLeg";
    const chain = (t: number): { base: IHumanPosture; hint: IAutoMovieVector3; rotation: IAutoMovieQuaternion } => {
      const at: number | undefined = parts.record.stop(t0 + t);
      const s: number | undefined = at === undefined ? undefined : at - t0;
      if (s === undefined || t <= s || s >= timing.impact) return { base: parts.base(t), hint: parts.hint(t), rotation: parts.rotation(t) };
      const w: number = minimumJerk((t - s - StrikingStroke.DWELL) / Math.max(1e-3, timing.duration - s - StrikingStroke.DWELL)).s;
      const end: number = timing.duration;
      return {
        base: blend(parts.base(s), parts.base(end), w),
        hint: Vector3.lerp(parts.hint(s), parts.hint(end), w),
        rotation: Quaternion.slerp(parts.rotation(s), parts.rotation(end), w),
      };
    };
    return {
      ...parts,
      posture: (t: number): IHumanPosture => {
        const held = chain(t);
        const posture: IHumanPosture = held.base;
        const down: boolean = t <= timing.prep || t >= timing.duration - 1e-9;
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            ...StrikingStance.guard(body, posture, { lead: timing.lead }),
            [limb]: { point: parts.ankle(t), bend: held.hint, rotation: held.rotation, ...(down ? { planted: true } : {}) },
          },
        };
      },
    };
  }

  /** Two postures blended by a share: root, heading and angles linearly, limb goals by point, hint and rotation; planted flags from the first. */
  function blend(a: IHumanPosture, b: IHumanPosture, w: number): IHumanPosture {
    const joints: IHumanPosture["joints"] = { ...a.joints };
    for (const [bone, value] of Object.entries(b.joints) as [keyof IHumanPosture["joints"], readonly [number, number, number]][]) {
      const from: readonly [number, number, number] | undefined = a.joints[bone];
      if (from !== undefined) joints[bone] = [from[0] + (value[0] - from[0]) * w, from[1] + (value[1] - from[1]) * w, from[2] + (value[2] - from[2]) * w];
    }
    const limbs: IHumanPosture["limbs"] = { ...a.limbs };
    for (const limb of ["leftArm", "rightArm", "leftLeg", "rightLeg"] as const) {
      const p: IHumanPosture.IGoal | undefined = a.limbs[limb];
      const q: IHumanPosture.IGoal | undefined = b.limbs[limb];
      if (p === undefined || q === undefined) continue;
      limbs[limb] = {
        ...p,
        point: Vector3.lerp(p.point, q.point, w),
        bend: Vector3.lerp(p.bend, q.bend, w),
        ...(p.rotation !== undefined && q.rotation !== undefined ? { rotation: Quaternion.slerp(p.rotation, q.rotation, w) } : {}),
      };
    }
    return {
      root: Vector3.lerp(a.root, b.root, w),
      yaw: a.yaw + (b.yaw - a.yaw) * w,
      pitch: a.pitch + (b.pitch - a.pitch) * w,
      roll: a.roll + (b.roll - a.roll) * w,
      joints,
      limbs,
    };
  }

  /** The feet's contact windows. */
  function windows(timing: ITiming, side: "left" | "right", support: "left" | "right", stepped: boolean): IHumanContactWindow[] {
    const d: number = timing.duration;
    return [
      { part: `${side}Foot`, kind: "plant", from: 0, to: timing.prep / d, support: { kind: "ground" } },
      { part: `${side}Foot`, kind: "plant", from: 1, to: 1, support: { kind: "ground" } },
      { part: `${support}Foot`, kind: "pivot", from: stepped ? timing.chamber / d : 0, to: 1, support: { kind: "ground" } },
    ];
  }
}
