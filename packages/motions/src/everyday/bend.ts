import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { prepareBendGoal } from "./prepareBendGoal";
import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanBalance } from "./HumanBalance";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { HumanGaze } from "./HumanGaze";
import { bendLower } from "./bendLower";
import { prepareBendSquat } from "./prepareBendSquat";
import { bendFloorHand } from "./bendFloorHand";
import { bendReleasedFingers } from "./bendReleasedFingers";
import { braceOnThigh } from "./braceOnThigh";

/** The offset-corrected wrist point for a strategy. */
type AutoMovieBendWrist = bendLower.WristAt;

/** One physical lowering strategy selected by the automatic planner. */
type AutoMovieBendStrategy = Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">;

/**
 * Bending down to bring a hand to a low point (the floor, a low shelf, a
 * note on the ground) with the feet planted, by a stoop, a squat or a
 * semi-squat, then straightening up.
 *
 * The goal is the palm on the target, facing it from above. The body is
 * found from that goal: the strategy sets how far the hips drop, to the
 * height the body's own leg keeps at the strategy's knee flexion (a stoop's
 * knees as straight as a planted leg holds them, a semi-squat's 90 degrees,
 * a squat's 135, Washmuth, McAfee and Bickel 2022; `bendLower.hipShare`),
 * and the trunk then inclines forward just enough to
 * bring the shoulder within the arm's reach of the target (`bendLower.REACH`,
 * where freely reaching people lean in, of the arm's length plus the palm's
 * offset), found by bisection. A stoop carries its measured hip retreat
 * from Kim and Yoo (2018). An explicitly balanced bend may add a shift.
 * The inclination is shared by the lumbopelvic rhythm of forward bending:
 * about 40 degrees of lumbar flexion against 70 of hip flexion at full
 * bending (Esola et al. 1996, Spine 21:71), so the pelvis pitches 0.64 of
 * it, the lumbar spine flexes 0.28 and the thorax 0.08 (`HumanTrunk.incline`).
 * The legs are solved onto the planted feet, lowering the pelvis where a
 * leg could not reach (`resolveHumanPosture.lower`); a squat, which outruns
 * the ankles' 20 degree dorsiflexion range, lets the heels rise up to 30
 * degrees, the feet rolling on their balls (provisional). The arm goes onto the palm's goal and
 * the gaze onto the target, and the free hand braces on its own thigh just
 * above the knee (Kingma, Faber and van Dieen 2016, J Biomech 49:881, on
 * supporting the trunk with a hand on the thigh while lifting). No lifting technique is shown to be better than
 * another (van Dieen, Hoozemans and Toussaint 1999, Clin Biomech 14:685), so
 * `auto` takes the semi-squat for targets below mid-shank and the stoop above,
 * the rule the campaign sets, and squats where the semi-squat cannot reach
 * (a short-armed body cannot reach the floor from a semi-squat).
 *
 * The descent takes the time of a movement that stops on a target for the
 * hand's travel, the package's timing owner for aimed movements
 * (`AutoMovieMotionHumanTiming.aimed`, McIntosh et al. 2018's two-factor fit,
 * the palm's target a point), scaled from 1.4 to 1.0 by the `speed` axis;
 * the hand holds for `hold` seconds and the rise takes the same time. Events:
 * `contact` and `deepest` at the bottom, `upright` at the end. A target the
 * strategy cannot reach is refused with the lowest height it reaches.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 */
export namespace bend {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "bend";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate }],
    bend: [{ window: ["deepest", 1], kind: "inertialize", entry: 0 }],
    // A pick up continues the deepest point of a bend, the body held as it
    // is lowered and the arm taken from the target over to the grip.
    pickUp: [{ window: ["deepest", 1], kind: "inertialize", entry: 0 }],
  };

  /** A requested shift uses the pelvis over the feet throughout the bend. */
  export const balance: IAutoMovieMotionHumanBalance = { by: "hips", from: { event: "start" }, to: { event: "end" } };

  /** How long the palm holds on the target when the caller names no hold, seconds (provisional: half a second, a brief touch, read from no measured source). */
  export const HOLD: number = 0.5;

  /** The reaching elbow's outward hint, a share of the upper arm (provisional: read from no measured source). */
  export const REACH_OUT: number = 0.2;

  /**
   * Plan a bend: choose the strategy, solve the balance shift and the least
   * trunk inclination that brings the palm to the target, time the descent as
   * an aimed movement, and return postures that lower the body, put the palm on the
   * target and the free palm on its thigh, hold, and rise.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the target lies beyond the strategy's reach, or the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the solve, the timing, the postures and both refusals; the law's doc gives the sources and the provisional constants.
   * @evidence contracts/development/implementation.md#principled-implementation Esola et al.'s lumbopelvic rhythm and the strategy's lowered body carry the arm planner. The palm faces down against a flat target, and the free hand braces on the thigh (Kingma et al. 2016). The two motions share one clock with the measured aimed timing and the named hold.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The chosen lowering writes root, trunk, gaze and legs. Two arm goals and the fingers read the resulting pose, each on its channel. The hold reads the same authored lowest key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The only strategy fallback is the stated automatic squat where the semi-squat cannot reach. The reached point stays where authored. The hold and the reaching elbow hint are provisional.
   * @evidence contracts/development/implementation.md#efficient-algorithms The lowering and its pitch are planned once. The planner lays trajectories over the actual descent and ascent and refines failed stretches. Hold duration adds no arm waypoints or posture fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The strategy, lean, pitch, timing and stand base are computed once per instance and every posture reads them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains this body's lowered geometry and arm courses, released with the performance. No query history grows in playback.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBend.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const target: IAutoMovieVector3 = context.aim(context.params.toward, context.start).point;
    const requested: IAutoMovieMotionHumanBend.Strategy = context.params.strategy ?? "auto";
    if (context.params.toward.kind !== "self")
      return planStrategy(context, requested, target);
    // A surface on the moving body can be occluded by the lowered thigh
    // even when the shoulder lies within reach. Admit the complete arm
    // course before committing to one of the law's lowering strategies.
    const nominal: AutoMovieBendStrategy = choose(context.body, target, requested);
    const candidates: ReadonlySet<AutoMovieBendStrategy> = new Set<AutoMovieBendStrategy>(
      requested === "auto" ? [nominal, "stoop", "semiSquat", "squat"] : [nominal],
    );
    const side: AutoMovieHumanSide = context.params.side ?? "right";
    const elbow: number = (stand.relaxed(context.body)[`${side}LowerArm`]?.[0] ?? 0) * Math.PI / 180;
    const upper: number = context.body.measure.upperArm;
    const lower: number = context.body.measure.forearm;
    // Voluntary trunk recruitment begins before anatomical extension runs
    // out. If that preferred course is obstructed, a relaxed elbow still
    // reaches the law-of-cosines span without locking the hinge.
    const available: number = Math.sqrt(upper * upper + lower * lower + 2 * upper * lower * Math.cos(elbow));
    const comfortable: number = bendLower.REACH * (upper + lower);
    let failure: HumanRefusal | undefined;
    for (const alignTrunk of [false, true]) {
      for (const candidate of candidates) {
        for (const reach of new Set([comfortable, Math.max(comfortable, available)])) {
          try {
            return planStrategy(context, candidate, target, reach, alignTrunk);
          } catch (error) {
            if (!(error instanceof HumanRefusal) || (error.axis !== "toward" && error.axis !== "region"))
              throw error;
            if (failure === undefined || (error.axis === "region" && failure.axis === "toward")) failure = error;
          }
        }
      }
    }
    throw failure!;
  }

  /** Fit one complete lowering, both arm courses and the held surface. */
  function planStrategy(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBend.IParams>,
    requested: IAutoMovieMotionHumanBend.Strategy,
    target: IAutoMovieVector3,
    wristReach?: number,
    alignTrunk: boolean = false,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const side: AutoMovieHumanSide = context.params.side ?? "right";
    const hold: number = context.params.hold ?? HOLD;
    HumanBound.least("hold", hold, 0, "s");
    const probe: IAutoMovieMotionHumanActionPlan = stand.plan(
      { ...context, params: { seconds: 1 } },
      side,
    );
    const upright: IAutoMovieMotionHumanPosture = probe.posture(0);
    // When the sagittal course is obstructed, direct the upper trunk's
    // inclination toward the unilateral contact. The angle is the lateral
    // displacement of the contact over the pelvis-to-shoulder lever.
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const armBase: IAutoMovieVector3 = body.rest.get(`${side}UpperArm`)!;
    const local: IAutoMovieVector3 = HumanFrame.local({ origin: upright.root, yaw: upright.yaw }, target);
    const lateralTilt: number = alignTrunk
      ? Math.atan2(hips.x - local.x, armBase.y - hips.y) * 180 / Math.PI
      : 0;
    const region: IAutoMovieHumanoidSurfaces.IFrame | undefined = context.params.toward.kind === "self"
      ? body.surfaces.regions[context.params.toward.region] : undefined;
    const floorContact: boolean = region === undefined && probe.contacts.some(
      ({ support }): boolean => support.kind === "ground" && target.y === (support.height ?? 0),
    );
    const goal: ReturnType<typeof prepareBendGoal> = prepareBendGoal(body, side, target, region, REACH_OUT);
    const fixedWrist: IAutoMovieVector3 | undefined = region === undefined ? goal(upright).point : undefined;
    const wristAt: AutoMovieBendWrist = fixedWrist === undefined
      ? (lowered: IAutoMovieMotionHumanPosture, read: ReturnType<typeof prepareHumanPoseResolution>): IAutoMovieVector3 => goal(lowered, read).point
      : () => fixedWrist;
    // The time of a movement that stops on a target, for the hand's travel
    // (`AutoMovieMotionHumanTiming.aimed`), scaled by skill.
    const hand: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones(body, upright),
      side,
      "palm",
    ).point;
    const D: number = Vector3.length(Vector3.subtract(target, hand));
    const speed: number = HumanSkill.quantity(context.skill, "speed", 1.4, 1.0);
    const down: number = speed * AutoMovieMotionHumanTiming.aimed(D, 0);
    const duration: number = 2 * down + hold;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(duration, [
      { name: "contact", seconds: down },
      { name: "deepest", seconds: down },
      { name: "upright", seconds: duration },
    ]);
    const window: HumanPhysics.Window = HumanPhysics.prepare(
      context.params, bend, context.start, { duration, events: clock.events() }, context.instant,
    );
    if (window !== null && window.by !== "hips")
      throw new HumanRefusal({
        kind: "parameter", axis: "balance.by", value: window.by,
        reason: "the bend carries its trunk inclination through the hips above planted feet",
        fix: "give hips for balance.by",
      });
    // A changing balance window can move the body during its hold.
    const moving: number = window === null ? 2 * down : duration;
    const rise: number = moving - down;
    // The body stands under the bend, its sway signed in the bending side's
    // frame, so a left bend mirrors a right one (`stand.plan`).
    const standing: IAutoMovieMotionHumanActionPlan = stand.plan(
      { ...context, params: { seconds: 2 * down } },
      side,
    );
    const atContact: IAutoMovieMotionHumanPosture = standing.posture(down);
    const { strategy, lean, pitch }: IAutoMovieMotionHumanBendLower.ISolved = bend.lowering(
      body,
      atContact,
      target,
      side,
      requested,
      wristReach ?? bendLower.REACH * (body.measure.upperArm + body.measure.forearm),
      undefined,
      wristAt,
      lateralTilt,
    );

    const squat = strategy === "stoop" || fixedWrist === undefined ? undefined : prepareBendSquat(
      body, atContact, bendLower.lower(body, atContact, strategy, pitch, 1, lean * Math.sin(pitch * Math.PI / 180)),
      strategy, side, fixedWrist,
    );
    const base: IAutoMovieMotionHumanActionPlan = window === null ? standing : {
      ...standing,
      duration: moving,
      posture: (seconds, channels, resolution, projection): IAutoMovieMotionHumanPosture =>
        standing.posture(
          Math.min(down, seconds) + Math.max(0, seconds - rise),
          channels, resolution, projection,
        ),
    };

    // How far down the bend is at a second: down over the descent, held,
    // and up again over as long.
    const share: (seconds: number) => number = (seconds: number): number => {
      const t: number = Math.min(moving, Math.max(0, seconds));
      return 1 - minimumJerk.share(Math.max(down - t, t - rise, 0) / down);
    };

    const free: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const armSpan: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: 0, ready: down, relax: rise, end: moving,
    };
    const sink: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "head", "leftLeg", "rightLeg"],
      reads: ["root", "trunk", "head", "leftLeg", "rightLeg"],
      from: 0,
      to: moving,
      write: (
        standing: IAutoMovieMotionHumanPosture,
        seconds: number,
        _before?: IAutoMovieMotionHumanPrimitive.Reader,
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      ): IAutoMovieMotionHumanPosture => {
        const s: number = share(seconds);
        const angle: number = pitch * s;
        const back: number = lean * Math.sin((angle * Math.PI) / 180);
        let lowered: IAutoMovieMotionHumanPosture = bendLower.lower(
          body, standing, strategy, angle, s, back, resolution, lateralTilt,
        );
        if (squat !== undefined) lowered = squat(lowered, s, standing);
        const weight: number = HumanPhysics.weightAt(window, seconds);
        if (weight > 0) {
          const support: IAutoMovieMotionHumanBalance.ISupport = HumanBalance.support(body, lowered, resolution);
          const shift: HumanPhysics.SupportOffset = HumanPhysics.supportOffset(support, HumanFrame.forward(lowered.yaw));
          if (shift !== null && shift !== 0)
            lowered = squat === undefined
              ? bendLower.lower(body, standing, strategy, angle, s, back - weight * shift, resolution, lateralTilt)
              : resolveHumanPosture.lower(body, { ...lowered, root: Vector3.addScaled(lowered.root, HumanFrame.forward(lowered.yaw), weight * shift) }, undefined, resolution);
        }
        return HumanGaze.aim(body, lowered, target, "head", { eyes: s, head: s, trunk: 0 });
      },
    };

    // The measured target and the supporting thigh are each held in their
    // own frames. The arm planner lays their routes on the lowered body.
    const arms: IAutoMovieMotionHumanArmPlanned.ITogether = AutoMovieMotionHumanArm.together();
    const lateral: number = HumanFrame.local({ origin: upright.root, yaw: upright.yaw }, target).x;
    const apart: boolean = side === "left" ? lateral > 0 : lateral < 0;
    const lowerLegs: ReadonlySet<AutoMovieHumanoidBone> = new Set(["leftLowerLeg", "rightLowerLeg"]);
    const readShins: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, lowerLegs);
    const placeShins: ReturnType<typeof HumanColliders.preparePlaced> = HumanColliders.preparePlaced(body, lowerLegs);
    const reach: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
      body,
      side,
      from: 0,
      to: moving,
      span: armSpan,
      ...(region === undefined ? {} : { on: region.bone }),
      ...(apart ? { beside: arms } : { together: arms }),
      rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
      weight: share,
      goal: (posture: IAutoMovieMotionHumanPosture, _seconds: number,
        source?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: Parameters<typeof resolveHumanPosture.seeded>[6]): IAutoMovieHumanLimbGoal =>
        {
          const site: IAutoMovieHumanLimbGoal = goal(posture, source, projection);
          if (strategy === "stoop") return site;
          const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
          const frame: ReturnType<typeof resolveHumanPosture.seeded> =
            resolveHumanPosture.seeded(body, posture, undefined, {}, read, lowerLegs, projection);
          return { ...site, clear: placeShins(readShins(frame.pose, read())) };
        },
    });
    const brace: IAutoMovieMotionHumanPrimitive = braceOnThigh(
      body, free, AutoMovieMotionHumanArm.angles(context.entry.pose, free),
      moving, share, armSpan, arms, apart, squat === undefined ? undefined : { x: 0, y: 1, z: 0 },
    );
    const fingers: (hand: AutoMovieHumanSide) => IAutoMovieMotionHumanPrimitive =
      (hand: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive =>
        hand !== side || !floorContact
          ? AutoMovieMotionHumanHand.shape({side:hand, shape:"flat",from:0,to:moving,weight:share})
          : bendFloorHand(body, upright, hand, moving, share);
    const travel: IAutoMovieMotionClock = AutoMovieMotionClock.of(moving, [
      { name: "contact", seconds: down },
      { name: "deepest", seconds: down },
      { name: "upright", seconds: moving },
    ]);
    const armCourse: IAutoMovieMotionHumanActionPlan = composeAutoMovieMotionHumanAction({
      base,
      clock: travel,
      contact: "contact",
      primitives: [sink, reach, brace, fingers(side), fingers(free)],
    });
    const course: IAutoMovieMotionHumanActionPlan = floorContact ? composeAutoMovieMotionHumanAction({
      base: armCourse, clock: travel, contact: "contact",
      primitives: [bendReleasedFingers(body,side,moving,share,target.y,D)],
    }) : armCourse;
    // A point-only wrist fit may turn its palm away when the wrist's
    // preferred rotation is beyond range. A thigh can bear this motion
    // only on the palm and between the ends of the femur.
    let held: IAutoMovieMotionHumanPosture | undefined;
    if (region !== undefined) {
      held = course.posture(down);
      const shown: ReturnType<typeof bones> = bones(body, held);
      const knee: IAutoMovieVector3 = shown.get(`${free}LowerLeg`)!.worldPosition;
      const femur: IAutoMovieVector3 = Vector3.subtract(shown.get(`${free}UpperLeg`)!.worldPosition, knee);
      const axis: IAutoMovieVector3 = Vector3.normalize(femur);
      const contact: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(body, shown, free, "palm", "flat");
      const delta: IAutoMovieVector3 = Vector3.subtract(contact.point, knee);
      const station: number = Vector3.dot(delta, axis);
      const radial: IAutoMovieVector3 = Vector3.addScaled(delta, axis, -station);
      const margin: number = body.measure.hand / 2 - AutoMovieMotionHumanAuditTangle.BUILT;
      if (Vector3.dot(contact.normal, radial) >= 0 || station < margin || Vector3.length(femur) - station < margin)
        throw new HumanRefusal({
          kind: "reach", axis: "region", value: `${free}UpperLeg`,
          reason: "the open support palm cannot bear against the front of the thigh between its ends",
          fix: "choose a lowering that leaves room for the bracing wrist",
        });
    }
    if (hold === 0 || window !== null) return { ...course, ...HumanPhysics.declared(context.params, window) };

    // Nothing changes while holding a bend. Measure one actual lowest
    // body with both hands placed. The reaching and returning courses
    // meet on this single key regardless of how long it is held.
    const posture: IAutoMovieMotionHumanActionPlan["posture"] = (seconds, channels, resolution, projection) =>
      seconds < down || seconds > down + hold
        ? course.posture(seconds < down ? seconds : seconds - hold, channels, resolution, projection)
        : (held ??= course.posture(down));
    return { ...course, ...HumanPhysics.declared(context.params, window), duration, events: clock.events(), posture };
  }
  /**
   * The lowering that brings a hand within reach of a target: the strategy
   * `choose` gives, solved by `bendLower.solve`, and for `auto` a squat where
   * the semi-squat cannot reach.
   *
   * @param body The body.
   * @param upright The standing posture lowered.
   * @param target The target.
   * @param side The hand.
   * @param strategy The requested strategy.
   * @param reach How near the shoulder must come to the target, metres; the bend's palm reach when absent.
   * @param instant Action-local time and the event clock when observing an optional balance window on this key.
   * @returns The solved lowering.
   * @throws {HumanRefusal} When the strategy, and for `auto` the squat after it, cannot reach the target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the choice, the solve and the fallback.
   * @evidence contracts/development/implementation.md#principled-implementation The campaign's strategy rule (`choose`) and the documented squat fallback over the shared lowering solve.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One choice and at most two solves.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only `auto` falls back, and only from a semi-squat; any other refusal is passed on.
   * @evidence contracts/development/implementation.md#efficient-algorithms One solve, two when `auto` falls back.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by the bend law and by the pick-up's lowering, so both choose and lower alike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lowering(
    body: IAutoMovieMotionHumanBody,
    upright: IAutoMovieMotionHumanPosture,
    target: IAutoMovieVector3,
    side: AutoMovieHumanSide,
    strategy: IAutoMovieMotionHumanBend.Strategy,
    reach?: number,
    balance?: IAutoMovieMotionHumanBalance,
    wristAt?: AutoMovieBendWrist,
    lateralTilt: number = 0,
    instant?: bendLower.IInstant,
  ): IAutoMovieMotionHumanBendLower.ISolved {
    const chosen: Exclude<IAutoMovieMotionHumanBend.Strategy, "auto"> = choose(body, target, strategy);
    const solve: (candidate: typeof chosen) => IAutoMovieMotionHumanBendLower.ISolved =
      (candidate: typeof chosen): IAutoMovieMotionHumanBendLower.ISolved => {
        return bendLower.solve(body, upright, target, side, candidate, reach, balance, wristAt, lateralTilt, instant);
      };
    try {
      return solve(chosen);
    } catch (error) {
      if (
        !(error instanceof HumanRefusal) ||
        strategy !== "auto" ||
        chosen !== "semiSquat"
      )
        throw error;
      return solve("squat");
    }
  }

  /**
   * The strategy for a target: `auto` stoops above mid-shank and semi-squats
   * below (the plan squats instead where the semi-squat cannot reach).
   *
   * @param body The body.
   * @param target The target point.
   * @param strategy The requested strategy.
   * @returns A concrete strategy.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, its mid-shank threshold and that the plan may still replace the semi-squat by a squat.
   * @evidence contracts/development/implementation.md#principled-implementation Compares the target's height with the body's own ankle height plus half its shank, so the threshold scales with the body; no study ranks the techniques (van Dieen et al. 1999), so the threshold is the campaign's rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A pure decision kept apart from the reach solve, which owns the fallback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The mid-shank threshold is the documented campaign rule, not a tuned value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function choose(
    body: IAutoMovieMotionHumanBody,
    target: IAutoMovieVector3,
    strategy: IAutoMovieMotionHumanBend.Strategy,
  ): Exclude<IAutoMovieMotionHumanBend.Strategy, "auto"> {
    if (strategy !== "auto") return strategy;
    return target.y < body.measure.ankleHeight + 0.5 * body.measure.shank
      ? "semiSquat"
      : "stoop";
  }
}

/** World bones of a posture, limbs solved. */
function bones(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
): ReturnType<typeof poseBones> {
  return poseBones(body, resolveHumanPosture(body, posture));
}
