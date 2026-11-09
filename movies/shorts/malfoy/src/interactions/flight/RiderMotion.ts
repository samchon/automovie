import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Student } from "../../entities/cast/student/Student";
import { StudentBody } from "../../entities/cast/student/StudentBody";
import { BodyFrame } from "../../laws/body/BodyFrame";
import type { IBodyPosture } from "../../laws/body/IBodyPosture";
import type { IBodyState } from "../../laws/body/IBodyState";
import { BroomLaw } from "../../laws/flight/BroomLaw";
import type { IStageWorld } from "../staging/IStageWorld";
import { StudentPose } from "../staging/StudentPose";

/**
 * A rider's broom and body at any second: the broom follows a `fly` step's
 * smooth route at its speed, or carries on along its heading at its speed
 * (sinking under a hanging rider) during any other step; it pitches with its
 * climb and banks by the level-turn law. The seated rider sits astride at
 * the seat point leaning forward with both hands on the shaft ahead; a
 * hanging rider hangs straight-armed below the shaft by one or both hands; a
 * rear rider sits half a metre behind the front rider's seat point.
 *
 * ```ts
 * RiderMotion.broom(step, local); // { position, heading, pitch, roll, speed }
 * ```
 *
 * @evidence docs/research/flight/broom-riding.md#seat Pelvis on the shaft, thighs closed, trunk 20-45 degrees forward cruising and 50-70 degrees sprinting, hands 0.35-0.50 m ahead.
 * @evidence docs/research/flight/broom-riding.md#banking tan(bank) = v^2 / (g r), capped at 60 degrees.
 * @evidence docs/research/flight/broom-riding.md#hanging Hanging straight-armed; the broom sinks 0.3-0.5 m/s.
 * @evidence docs/research/flight/broom-riding.md#tandem The rear rider 0.45-0.55 m behind.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure in the step and the instant.
 * @evidence contracts/development/common.md#meaningful-documentation States the broom's path rules and the three seats.
 */
export namespace RiderMotion {
  /** A broom's placement at an instant. */
  export interface IBroom {
    /** Seat point, world metres. */
    position: IAutoMovieVector3;

    /** Heading, radians. */
    heading: number;

    /** Nose-up pitch, radians. */
    pitch: number;

    /** Left-down bank, radians. */
    roll: number;

    /** Speed, metres per second. */
    speed: number;
  }

  /**
   * The broom of a rider's step at a local time.
   *
   * @param step The step.
   * @param local Seconds since its start.
   * @param limit The most it banks, radians: the rider's limit, or 30° with two aboard.
   * @returns The broom's placement.
   */
  export function broom(step: IStageWorld.IStudentStep, local: number, limit: number = BroomLaw.BANK_MAX): IBroom {
    const own: number = Math.max(0, local - step.lead);
    const from: IBodyState = step.from;
    // Through a flight action's lead the broom flies on as before; its own motion starts where that leaves it.
    if (local < step.lead && (step.action.kind === "fly" || step.action.kind === "hover" || step.action.kind === "escort")) return carry(from, local);
    if (step.action.kind === "hover") {
      const begun: IBroom = carry(from, step.lead);
      const t: number = Math.min(own, from.speed / BroomLaw.BRAKE);
      const s: number = from.speed * t - 0.5 * BroomLaw.BRAKE * t * t;
      const f: IAutoMovieVector3 = BodyFrame.forward(from.heading);
      // The broom turns to its end facing as it slows.
      const k: number = Math.min(1, own / Math.max(0.1, step.natural));
      const heading: number = from.heading + BodyFrame.turn(from.heading, step.to.heading) * k * k * (3 - 2 * k);
      return { position: { x: begun.position.x + f.x * s, y: begun.position.y, z: begun.position.z + f.z * s }, heading, pitch: 0, roll: 0, speed: Math.max(0, from.speed - BroomLaw.BRAKE * own) };
    }
    if (step.action.kind === "fly" && step.route !== undefined && step.route.length >= 2) {
      const path: BroomLaw.IPath = BroomLaw.path(step.route);
      const speed: number = step.action.speed;
      const s: number = Math.min(path.length, own * speed);
      const tangent: IAutoMovieVector3 = path.tangent(s);
      const curvature: number = path.curvature(s);
      const roll: number = Math.sign(curvature) * BroomLaw.bank(speed, Math.abs(curvature) < 1e-6 ? Infinity : 1 / Math.abs(curvature), limit);
      // The shaft pitches with the route, never beyond the 45° a rider climbs or dives.
      const pitch: number = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, Math.asin(Math.max(-1, Math.min(1, tangent.y)))));
      return { position: path.at(s), heading: Math.atan2(tangent.x, tangent.z), pitch, roll, speed };
    }
    const t: number = local;
    if (step.action.kind === "offerRear" || (step.action.kind === "transfer" && step.outcome !== "not-admitted")) {
      // Through the lead the rider flies on as before; then the approach or the climb across blends to the step's end.
      const begun: IBroom = carry(from, Math.min(local, step.lead));
      if (local < step.lead) return begun;
      const k: number = Math.min(1, own / Math.max(0.01, step.natural));
      const e: number = k * k * (3 - 2 * k);
      // An approach with a waypoint (an offered rear seat) curves through it, so the rider never passes through the one she comes beside.
      const curve: BroomLaw.IPath | undefined = step.action.kind === "offerRear" && step.point !== undefined ? BroomLaw.path([begun.position, step.point, step.to.position]) : undefined;
      return {
        position: curve ? curve.at(e * curve.length) : lerp(begun.position, step.to.position, e),
        heading: from.heading + BodyFrame.turn(from.heading, step.to.heading) * e,
        pitch: 0,
        roll: 0,
        speed: step.to.speed,
      };
    }
    const f: IAutoMovieVector3 = BodyFrame.forward(from.heading);
    return {
      position: { x: from.position.x + f.x * from.speed * t, y: Math.max(0.5, from.position.y + from.climb * t), z: from.position.z + f.z * from.speed * t },
      heading: from.heading,
      pitch: from.speed > 0.1 ? Math.atan2(from.climb, from.speed) : 0,
      roll: 0,
      speed: from.speed,
    };
  }

  /**
   * A rider's posture at a local time.
   *
   * @param student The rider.
   * @param step The step.
   * @param local Seconds since its start.
   * @param _seconds Film seconds.
   * @param _locate Positions of others.
   * @param phase Breath phase.
   * @param host The front rider's live broom, for a rear rider or a transfer.
   * @param live The rider's own live broom, dipped under a second rider; derived from the step when absent.
   * @returns The posture.
   */
  export function posture(student: Student, step: IStageWorld.IStudentStep, local: number, _seconds: number, locate: StudentPose.Locate, phase: number, host?: IBroom, live?: IBroom): IBodyPosture {
    const base: IBodyPosture =
      step.action.kind === "transfer" && step.outcome !== "not-admitted" && host !== undefined
        ? transfer(student, step, local, phase, host)
        : step.to.support === "tandem" && host !== undefined
          ? seated(student, step, host, "tandem", phase, local)
          : pose(student, step, live ?? broom(step, local, limitOf(student)), local, phase);
    return look(student, step, gesture(student, step, local, base), locate, local);
  }

  /**
   * The most a student banks a broom, radians: the profile's limit, or the
   * flight law's 60°.
   *
   * @param student The rider.
   * @returns Radians.
   */
  export function limitOf(student: Student): number {
    return student.profile.bank !== undefined ? (student.profile.bank * Math.PI) / 180 : BroomLaw.BANK_MAX;
  }

  /**
   * The rider's head turned to the step's gaze: yaw within 80° of the
   * broom's heading and pitch toward the target's head, over the riding
   * posture's raised chin; a rider's head is about 0.6 m above the seat.
   */
  function look(student: Student, step: IStageWorld.IStudentStep, p: IBodyPosture, locate: StudentPose.Locate, local: number): IBodyPosture {
    // The head comes round from the old gaze to the new over the look's own seconds, never in one frame.
    const turned = (gaze: IBodyState["gaze"]): { yaw: number; pitch: number } => head(student, gaze, p, locate);
    const to = turned(step.to.gaze);
    const k: number = step.from.gaze === step.to.gaze ? 1 : Math.max(0, Math.min(1, (local - step.lead) / Math.max(0.2, step.natural)));
    const from = k >= 1 ? to : turned(step.from.gaze);
    const e: number = k * k * (3 - 2 * k);
    return { ...p, headYaw: from.yaw + (to.yaw - from.yaw) * e, headPitch: p.headPitch + from.pitch + (to.pitch - from.pitch) * e };
  }

  /** A rider's head yaw within 80° of the broom and pitch toward a gaze; ahead and level without one. */
  function head(student: Student, g: IBodyState["gaze"], p: IBodyPosture, locate: StudentPose.Locate): { yaw: number; pitch: number } {
    if (g === null) return { yaw: 0, pitch: 0 };
    const limb: IAutoMovieVector3 | undefined = g.kind === "subject" && (g.part === "leftHand" || g.part === "rightHand") ? locate.limb?.(g.subject, g.part === "leftHand" ? "left" : "right") : undefined;
    const target: IAutoMovieVector3 | undefined = limb ?? (g.kind === "point" ? g.point : locate(g.subject));
    if (target === undefined) return { yaw: 0, pitch: 0 };
    const m = student.measure;
    const eye: number = p.pelvis.y + (m.head - m.hip) * Math.cos(p.lean);
    const lookY: number = g.kind === "subject" && limb === undefined ? target.y + (target.y > 0.3 ? 0.6 : m.head * 0.9) : target.y;
    const want: number = BodyFrame.turn(p.heading, BodyFrame.headingTo(p.pelvis, target));
    const horizontal: number = Math.hypot(target.x - p.pelvis.x, target.z - p.pelvis.z);
    const pitch: number = Math.max(-0.6, Math.min(0.9, Math.atan2(eye - lookY, Math.max(0.2, horizontal))));
    return { yaw: Math.max(-1.4, Math.min(1.4, want)), pitch };
  }

  /**
   * A hand gesture drawn over a rider's or hanging rider's posture: the
   * forehead touch, the glasses push, the stop-play arm raised straight up,
   * the free arm swinging up toward the shaft and falling short, a pass's
   * throwing arm and a Beater's swing across the body.
   */
  function gesture(student: Student, step: IStageWorld.IStudentStep, local: number, p: IBodyPosture): IBodyPosture {
    const own: number = local - step.lead;
    const a = step.action;
    if (own < 0 || step.natural <= 0) return p;
    const u: number = Math.min(1, own / step.natural);
    const m = student.measure;
    const head: number = m.head - m.hip;
    const lift: number = Math.sin(Math.PI * u);
    const set = (side: "left" | "right", target: IAutoMovieVector3, k: number): IBodyPosture => ({
      ...p,
      hands: { ...p.hands, [side]: { ...p.hands[side], point: lerp(p.hands[side].point, target, Math.max(0, Math.min(1, k))) } },
    });
    if (a.kind === "touchForehead" || a.kind === "pushGlasses")
      return set(a.hand, StudentPose.onTrunk(p, 0.11, 0, head + (a.kind === "pushGlasses" ? 0 : 0.03)), Math.min(own / 0.3, (step.natural - own) / 0.3));
    if (a.kind === "stopPlay") {
      // Straight up from the right shoulder, whatever the trunk's lean.
      const shoulder: IAutoMovieVector3 = StudentPose.onTrunk(p, 0, -0.15, m.shoulder - m.hip);
      return set("right", { x: shoulder.x, y: shoulder.y + 0.95 * m.armReach, z: shoulder.z }, Math.min(own / 0.3, 1));
    }
    if (a.kind === "swingArm") {
      const shaft: IAutoMovieVector3 = p.hands[a.hand === "left" ? "right" : "left"].point;
      return set(a.hand, { x: shaft.x, y: shaft.y - 0.3, z: shaft.z }, 0.85 * lift);
    }
    if (a.kind === "pass") return set("right", StudentPose.onTrunk(p, 0.55, -0.2, m.shoulder - m.hip + 0.05), lift);
    if (a.kind === "strike") {
      // The bat hand swings across the body from its own side, the left hand mirrored.
      const hand: "left" | "right" = a.hand ?? "right";
      const s: number = hand === "left" ? -1 : 1;
      return set(hand, StudentPose.onTrunk(p, 0.45, s * (-0.5 + 0.9 * u), m.shoulder - m.hip), lift);
    }
    return p;
  }

  /**
   * The five transfer phases, from the hanging grip on the old broom to the
   * rear seat of the host's live broom: through the lead and the first phase
   * he hangs below his own broom while the free hand closes on the new rear
   * section; through the swing the holding hand lets go of the old shaft and
   * joins it, and the body swings across to hang two-handed below the new
   * rear section; the chest comes over the shaft (lying along it, half his
   * weight on it); the leg comes over into the rear seat; then he steadies.
   */
  function transfer(student: Student, step: IStageWorld.IStudentStep, local: number, phase: number, host: IBroom): IBodyPosture {
    const own: number = Math.max(0, local - step.lead);
    const old: IBroom = carry(step.from, local);
    const both: IBodyState["hands"] = { left: { place: "shaft", point: null, holds: null }, right: { place: "shaft", point: null, holds: null } };
    const hangingOld: IBodyPosture = pose(student, { ...step, to: { ...step.from, support: "hang" } }, old, local, phase);
    // Hanging two-handed below the rear section: the hang's grips sit 0.3 m ahead of its broom point, so that point is set just behind the rear seat.
    const under: IBroom = { ...host, position: BodyFrame.toWorld(host.position, host.heading, { forward: -BroomLaw.TANDEM_SPACING - 0.05, left: 0, up: 0 }) };
    const hangingNew: IBodyPosture = pose(student, { ...step, to: { ...step.from, support: "hang", hands: both } }, under, local, phase);
    const rear: IBodyPosture = seated(student, step, host, "tandem", phase, local);
    const chestOver: IBodyPosture = blendPostures(hangingNew, rear, 0.55);
    chestOver.lean += 0.5;
    const [g, s, c, l] = BroomLaw.TRANSFER_PHASES as [number, number, number, number, number];
    const smooth = (u: number): number => {
      const k: number = Math.max(0, Math.min(1, u));
      return k * k * (3 - 2 * k);
    };
    // The free hand is the one off the old shaft; the other holds it until the swing.
    const free: "left" | "right" = step.from.hands.left.place === "shaft" && step.from.hands.right.place !== "shaft" ? "right" : "left";
    const holding: "left" | "right" = free === "left" ? "right" : "left";
    if (own < g) {
      const result: IBodyPosture = blendPostures(hangingOld, hangingOld, 0);
      result.hands[free] = { ...hangingNew.hands[free], point: lerp(hangingOld.hands[free].point, hangingNew.hands[free].point, smooth(own / g)) };
      return result;
    }
    if (own < g + s) {
      const u: number = (own - g) / s;
      const result: IBodyPosture = blendPostures(hangingOld, hangingNew, smooth(u));
      result.hands[free] = { ...hangingNew.hands[free] };
      result.hands[holding] = { ...hangingNew.hands[holding], point: lerp(hangingOld.hands[holding].point, hangingNew.hands[holding].point, smooth(u)) };
      return result;
    }
    if (own < g + s + c) return blendPostures(hangingNew, chestOver, smooth((own - g - s) / c));
    if (own < g + s + c + l) return blendPostures(chestOver, rear, smooth((own - g - s - c) / l));
    return rear;
  }

  /**
   * An escort's broom: through the lead it flies on as before; then it comes
   * to its station beside the escorted rider's live broom (`distance` to the
   * named side) at the sprint's 12 m/s, easing into the station, and keeps it,
   * matching heading, pitch, roll and speed.
   *
   * @param step The escort step.
   * @param local Seconds since its start.
   * @param target The escorted rider's live broom now.
   * @param first The escorted rider's live broom when the approach began.
   * @returns The escort's broom.
   */
  export function escort(step: IStageWorld.IStudentStep, local: number, target: IBroom | undefined, first: IBroom | undefined): IBroom {
    const a = step.action;
    if (a.kind !== "escort" || target === undefined || local < step.lead) return carry(step.from, local);
    const begun: IBroom = carry(step.from, step.lead);
    const station = (b: IBroom): IAutoMovieVector3 => BodyFrame.toWorld(b.position, b.heading, { forward: 0, left: (a.side === "left" ? 1 : -1) * a.distance, up: 0 });
    const start: IAutoMovieVector3 = station(first ?? target);
    const approach: number = Math.max(1, Math.hypot(start.x - begun.position.x, start.y - begun.position.y, start.z - begun.position.z) / BroomLaw.ESCORT_SPEED);
    const k: number = Math.min(1, (local - step.lead) / approach);
    const u: number = k * k * (3 - 2 * k);
    return {
      position: lerp(begun.position, station(target), u),
      heading: begun.heading + BodyFrame.turn(begun.heading, target.heading) * u,
      pitch: target.pitch * u,
      roll: target.roll * u,
      speed: begun.speed + (target.speed - begun.speed) * u,
    };
  }

  /**
   * A riderless broom after its rider let go: it keeps its heading, slows at
   * 1 m/s² until it stops and sinks at 0.3 m/s, never below 0.5 m.
   *
   * @param from The rider's state when the broom was released.
   * @param t Seconds since the release.
   * @returns The broom's placement.
   */
  export function riderless(from: IBodyState, t: number): IBroom {
    const v0: number = from.speed;
    const stop: number = v0 / BroomLaw.RIDERLESS_DECELERATION;
    const s: number = t < stop ? v0 * t - 0.5 * BroomLaw.RIDERLESS_DECELERATION * t * t : v0 * stop / 2;
    const f: IAutoMovieVector3 = BodyFrame.forward(from.heading);
    return {
      position: { x: from.position.x + f.x * s, y: Math.max(0.5, from.position.y - BroomLaw.RIDERLESS_SINK * t), z: from.position.z + f.z * s },
      heading: from.heading,
      pitch: 0,
      roll: 0,
      speed: Math.max(0, v0 - BroomLaw.RIDERLESS_DECELERATION * t),
    };
  }

  /** A broom carried on along its heading at its speed and climb. */
  function carry(from: IBodyState, t: number): IBroom {
    const f: IAutoMovieVector3 = BodyFrame.forward(from.heading);
    return {
      position: { x: from.position.x + f.x * from.speed * t, y: Math.max(0.5, from.position.y + from.climb * t), z: from.position.z + f.z * from.speed * t },
      heading: from.heading,
      pitch: 0,
      roll: 0,
      speed: from.speed,
    };
  }

  /** A seated rider on a broom: the front seat, or the rear seat half a metre behind it. */
  function seated(student: Student, step: IStageWorld.IStudentStep, b: IBroom, seat: "ride" | "tandem", phase: number, local: number): IBodyPosture {
    return pose(student, { ...step, to: { ...step.to, support: seat === "tandem" ? "tandem" : "ride", hands: { left: { place: "shaft", point: null, holds: null }, right: { place: "shaft", point: null, holds: null } } } }, b, local, phase);
  }

  function blendPostures(a: IBodyPosture, b: IBodyPosture, k: number): IBodyPosture {
    const mix = (x: number, y: number): number => x + (y - x) * k;
    return {
      pelvis: lerp(a.pelvis, b.pelvis, k),
      heading: a.heading + BodyFrame.turn(a.heading, b.heading) * k,
      pitch: mix(a.pitch, b.pitch),
      roll: mix(a.roll, b.roll),
      lean: mix(a.lean, b.lean),
      twist: mix(a.twist, b.twist),
      headYaw: mix(a.headYaw, b.headYaw),
      headPitch: mix(a.headPitch, b.headPitch),
      feet: {
        left: { point: lerp(a.feet.left.point, b.feet.left.point, k), toes: lerp(a.feet.left.toes, b.feet.left.toes, k), knee: lerp(a.feet.left.knee, b.feet.left.knee, k) },
        right: { point: lerp(a.feet.right.point, b.feet.right.point, k), toes: lerp(a.feet.right.toes, b.feet.right.toes, k), knee: lerp(a.feet.right.knee, b.feet.right.knee, k) },
      },
      hands: {
        left: { point: lerp(a.hands.left.point, b.hands.left.point, k), elbow: lerp(a.hands.left.elbow, b.hands.left.elbow, k), palm: lerp(a.hands.left.palm, b.hands.left.palm, k) },
        right: { point: lerp(a.hands.right.point, b.hands.right.point, k), elbow: lerp(a.hands.right.elbow, b.hands.right.elbow, k), palm: lerp(a.hands.right.palm, b.hands.right.palm, k) },
      },
    };
  }

  /** The posture of a rider on a placed broom. */
  function pose(student: Student, step: IStageWorld.IStudentStep, b: IBroom, local: number, phase: number): IBodyPosture {
    const m = student.measure;
    const frame: StudentBody.IFrame = StudentBody.frame(b.heading, b.pitch, b.roll);
    const at = (forward: number, left: number, up: number, origin: IAutoMovieVector3 = b.position): IAutoMovieVector3 => ({
      x: origin.x + frame.forward.x * forward + frame.left.x * left + frame.up.x * up,
      y: origin.y + frame.forward.y * forward + frame.left.y * left + frame.up.y * up,
      z: origin.z + frame.forward.z * forward + frame.left.z * left + frame.up.z * up,
    });
    // A transfer's starting posture asks for the hang explicitly; its own end support is the rear seat.
    const support: IBodyState["support"] = step.to.support === "hang" ? "hang" : step.to.support === "tandem" ? "tandem" : "ride";
    // Chest down to the shaft at sprint speed for a rider whose habit is to race that way.
    const race: number = student.has("chest-down") && b.speed >= 12 ? 0.35 : 0;
    const lean: number = 0.55 + 0.25 * Math.min(1, b.speed / 18) + race + 0.01 * Math.sin(phase + local);
    if (support === "hang") {
      const grip: IAutoMovieVector3 = at(0.3, 0, -0.02);
      const hangs = (side: "left" | "right"): boolean => step.to.hands[side].place === "shaft";
      const pelvis: IAutoMovieVector3 = { x: grip.x, y: grip.y - (m.shoulder - m.hip) - 0.95 * m.armReach, z: grip.z };
      const hand = (side: "left" | "right"): IBodyPosture.IHand => {
        const s: number = side === "left" ? 1 : -1;
        return hangs(side)
          ? { point: at(0.3, s * 0.05, -0.02), elbow: at(0.6, s * 0.3, -0.4), palm: frame.forward }
          : { point: { x: pelvis.x + frame.left.x * s * 0.3, y: pelvis.y + 0.45, z: pelvis.z + frame.left.z * s * 0.3 }, elbow: pelvis, palm: { x: 0, y: -1, z: 0 } };
      };
      return {
        pelvis,
        heading: b.heading,
        pitch: 0,
        roll: 0,
        lean: 0.05,
        twist: 0,
        headYaw: 0,
        headPitch: -0.2,
        feet: {
          left: { point: { x: pelvis.x + frame.left.x * 0.1, y: pelvis.y - (m.hip - m.ankle) + 0.05, z: pelvis.z + frame.left.z * 0.1 }, toes: frame.forward, knee: at(1.0, 0, -2.5) },
          right: { point: { x: pelvis.x - frame.left.x * 0.1, y: pelvis.y - (m.hip - m.ankle) + 0.02, z: pelvis.z - frame.left.z * 0.1 }, toes: frame.forward, knee: at(1.0, 0, -2.5) },
        },
        hands: { left: hand("left"), right: hand("right") },
      };
    }
    const seat: IAutoMovieVector3 = support === "tandem" ? at(-BroomLaw.TANDEM_SPACING, 0, 0) : b.position;
    const pelvis: IAutoMovieVector3 = at(0, 0, BroomLaw.SEAT_HEIGHT, seat);
    const reach: number = support === "tandem" ? 0.25 : 0.45;
    const legs = (side: "left" | "right"): IBodyPosture.IFoot => {
      const s: number = side === "left" ? 1 : -1;
      return { point: at(0.2, s * 0.14, -0.5, seat), toes: frame.forward, knee: at(0.6, s * 0.25, 0.1, seat) };
    };
    const hands = (side: "left" | "right"): IBodyPosture.IHand => {
      const s: number = side === "left" ? 1 : -1;
      const own: IBodyState.IHand = step.to.hands[side];
      const grip: IBodyPosture.IHand = { point: at(reach + (side === "left" ? 0.08 : 0), s * 0.03, -0.02, seat), elbow: at(reach * 0.5, s * 0.3, 0.1, seat), palm: { x: 0, y: -1, z: 0 } };
      // An arm raised straight up from the shoulder, as a stop of play holds it.
      if (own.place === "raised" && own.point === null)
        return { point: at(0.3, s * 0.2, m.shoulder - m.hip + 0.95 * m.armReach - 0.1, seat), elbow: at(0.2, s * 0.45, m.shoulder - m.hip + 0.2, seat), palm: frame.forward };
      if (own.place !== "extended" || own.point === null) return grip;
      // An open hand reaching toward a point: straight from the shoulder at most an arm's length, riding with the broom; it leaves the shaft over half a second.
      const shoulder: IAutoMovieVector3 = at(0.3, s * 0.17, m.shoulder - m.hip - 0.15, seat);
      const d = { x: own.point.x - shoulder.x, y: own.point.y - shoulder.y, z: own.point.z - shoulder.z };
      const length: number = Math.hypot(d.x, d.y, d.z);
      const arm: number = Math.min(length, 0.95 * m.armReach) / Math.max(1e-6, length);
      const tip: IAutoMovieVector3 = length < 1e-6 ? grip.point : { x: shoulder.x + d.x * arm, y: shoulder.y + d.y * arm, z: shoulder.z + d.z * arm };
      const k: number = step.action.kind === "reach" ? Math.max(0, Math.min(1, (local - step.lead) / 0.5)) : 1;
      const elbow: IAutoMovieVector3 = lerp(shoulder, tip, 0.5);
      return { point: lerp(grip.point, tip, k), elbow: lerp(grip.elbow, { ...elbow, y: elbow.y - 0.06 }, k), palm: { x: 0, y: 1, z: 0 } };
    };
    return {
      pelvis,
      heading: b.heading,
      pitch: b.pitch,
      roll: b.roll,
      lean,
      twist: 0,
      headYaw: 0,
      headPitch: -0.35,
      feet: { left: legs("left"), right: legs("right") },
      hands: { left: hands("left"), right: hands("right") },
    };
  }

  function lerp(a: IAutoMovieVector3, b: IAutoMovieVector3, k: number): IAutoMovieVector3 {
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
  }
}
