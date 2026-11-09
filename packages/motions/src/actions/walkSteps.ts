import { HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME, type IAutoMovieResolvedBone, Quaternion, Vector3, minimumJerk, resolvePose } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { stand } from "./stand";

/**
 * The footstep plan of a walk: footprints, their heel-strike and toe-off
 * times, each foot's rockers and swings, and the pelvis path, all as closed
 * functions of seconds.
 *
 * Footprints lie along the straight line from the feet's midpoint to the
 * destination, at most `longest` apart, alternately half a step width to
 * either side (step width 0.1 hip heights, about 9 cm, inside the 7 to 12 cm
 * of normal adult gait, Perry and Burnfield), the foot behind stepping
 * first and the last two ending at the body's rest separation. Each step's
 * heel strike comes one step period after the previous; its toe-off one swing
 * (0.8 step periods, 40 % of a stride) before its heel strike; the first
 * toe-off comes 0.25 s after the start, a provisional gait-initiation delay
 * (anticipatory postural adjustments take a few tenths of a second,
 * Brenière, Do and Bouisset 1987). In stance a foot rolls on its heel from
 * 15° toes-up to flat over 12 % of stance and, from 60 % of stance, on its
 * ball to 40° toes-down at toe-off (provisional angles inside the ranges of
 * Perry and Burnfield's rockers), the toes extending at the ball by the same
 * angle so they stay flat on the floor, and relaxing to neutral over the first
 * half of the swing. In swing the ankle travels between the toe-off and
 * heel-strike placements on a minimum-jerk path lifted 0.07 hip heights at
 * mid-swing and raised further wherever the toe or heel would come within
 * 12 mm of the floor.
 *
 * The plan's root is the unconstrained pelvis path; `reach` then makes every
 * foot goal reachable on the actual pelvis, the footskate cleanup of Kovar,
 * Schreiner and Gleicher (2002): the contacts are enforced by IK, and the
 * root moves so the IK can meet them.
 */
export namespace walkSteps {
  /** The largest angle, degrees, a swinging ankle may trail behind its hip, 2° inside the hip's 30° extension. */
  export const EXTENSION: number = 28;

  /** Planner input. */
  export interface IInput {
    /** The body. */
    body: IHumanBody;

    /** The state the walk starts from. */
    entry: IHumanEntryState;

    /** The destination floor point, world metres. */
    to: IAutoMovieVector3;

    /** Walking speed, m/s. */
    speed: number;

    /** The longest step, metres. */
    longest: number;

    /** The realised step period for a planned one, seconds (timing variability). */
    period(seconds: number): number;
  }

  /** A foot at an instant. */
  export interface IFoot {
    /** Its placement. */
    placement: HumanFoot.IPlacement;

    /** Whether it bears on the floor. */
    planted: boolean;

    /** The toes' flexion from the foot, degrees, positive lifting them. */
    toes: number;
  }

  /** The plan. */
  export interface IPlan {
    /** Seconds. */
    duration: number;

    /** Named instants in seconds. */
    events: { name: string; seconds: number }[];

    /** Stance spans per foot, seconds. */
    stances: { side: "left" | "right"; from: number; to: number }[];

    /** The rig origin before `reach`, world metres. */
    root(seconds: number): IAutoMovieVector3;

    /** The heading, degrees. */
    yaw(seconds: number): number;

    /** Stride phase: 0.25 at a left heel strike, one per stride. */
    phase(seconds: number): number;

    /** How much the body is walking, 0 standing to 1 in full stride. */
    amount(seconds: number): number;

    /** A foot at an instant. */
    foot(side: "left" | "right", seconds: number): IFoot;
  }

  /** One footfall. */
  interface IStep {
    side: "left" | "right";
    heelStrike: number;
    toeOff: number;
    flat: HumanFoot.IPlacement;
    heading: number;
  }

  /**
   * Plan the footsteps of a walk.
   *
   * @param input The body, its entry state, the destination, the speed, the longest step and the period law.
   * @returns The plan.
   */
  export function plan(input: IInput): IPlan {
    const { body } = input;
    const m = body.measure;
    const l: number = m.hipHeight;
    const yaw0: number = input.entry.posture.yaw;
    const flatten = (side: "left" | "right"): HumanFoot.IPlacement => ({
      ankle: { ...input.entry.feet[side].ankle, y: m.ankleHeight },
      rotation: HumanFoot.rotation(HumanFrame.heading(input.entry.feet[side].rotation), 0),
    });
    const start: Record<"left" | "right", HumanFoot.IPlacement> = { left: flatten("left"), right: flatten("right") };
    const S: IAutoMovieVector3 = { x: (start.left.ankle.x + start.right.ankle.x) / 2, y: 0, z: (start.left.ankle.z + start.right.ankle.z) / 2 };
    const dx: number = input.to.x - S.x;
    const dz: number = input.to.z - S.z;
    const D: number = Math.hypot(dx, dz);
    let heading: number = D < 1e-6 ? yaw0 : (Math.atan2(dx, dz) * 180) / Math.PI;
    while (heading - yaw0 > 180) heading -= 360;
    while (heading - yaw0 < -180) heading += 360;
    const n: number = Math.max(1, Math.ceil(D / input.longest - 1e-9));
    const delta: number = D / n;
    const frame: HumanFrame.IFrame = { origin: S, yaw: heading };
    const along = (side: "left" | "right"): number => HumanFrame.local(frame, start[side].ankle).z;
    const lead: "left" | "right" = along("left") < along("right") - 1e-6 ? "left" : "right";
    const other = (side: "left" | "right"): "left" | "right" => (side === "left" ? "right" : "left");
    const half: number = 0.05 * l;
    const rest = (side: "left" | "right"): number => Math.abs(body.rest.get(`${side}Foot`)!.x);
    const T: number = input.period(Math.max(delta, 0.05) / input.speed);
    const swing: number = 0.8 * T;
    const first: number = 0.25;
    const steps: IStep[] = [];
    for (let j: number = 1; j <= n + 1; j++) {
      const side: "left" | "right" = j % 2 === 1 ? lead : other(lead);
      const d: number = Math.min(D, j * delta);
      const lateral: number = (side === "left" ? 1 : -1) * (j >= n ? rest(side) : half);
      const point: IAutoMovieVector3 = HumanFrame.point(frame, { x: lateral, y: m.ankleHeight, z: d });
      const footHeading: number = heading + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT);
      const heelStrike: number = first + swing + (j - 1) * T;
      steps.push({ side, heelStrike, toeOff: heelStrike - swing, flat: { ankle: point, rotation: HumanFoot.rotation(footHeading, 0) }, heading: footHeading });
    }
    const last: number = steps.at(-1)!.heelStrike;
    const duration: number = last + 0.35;
    const counts: Record<string, number> = {};
    const events: { name: string; seconds: number }[] = [];
    for (const step of steps) {
      counts[step.side] = (counts[step.side] ?? 0) + 1;
      events.push({ name: `${step.side}ToeOff${counts[step.side]}`, seconds: step.toeOff });
      events.push({ name: `${step.side}HeelStrike${counts[step.side]}`, seconds: step.heelStrike });
    }
    events.push({ name: "lastFootfall", seconds: last }, { name: "arrive", seconds: duration });
    events.sort((a, b): number => a.seconds - b.seconds);
    const stances: { side: "left" | "right"; from: number; to: number }[] = [];
    for (const side of ["left", "right"] as const) {
      let from: number = 0;
      for (const step of steps.filter((s: IStep): boolean => s.side === side)) {
        stances.push({ side, from, to: step.toeOff });
        from = step.heelStrike;
      }
      stances.push({ side, from, to: duration });
    }

    // The pelvis: progression with smooth start and stop, sway and bob.
    const firstLeft: number = steps.find((s: IStep): boolean => s.side === "left")!.heelStrike;
    const ramp = (t: number): number => {
      const up: number = minimumJerk(t / (first + T)).s;
      const down: number = 1 - minimumJerk((t - steps.at(-2)!.heelStrike) / (last + 0.2 - steps.at(-2)!.heelStrike)).s;
      return Math.min(up, down);
    };
    const accel: number = first + T;
    const decel: number = T;
    const span: number = last;
    const v: number = D / Math.max(1e-6, span - (accel + decel) / 2);
    const progress = (t: number): number => {
      const clamp: number = Math.min(span, Math.max(0, t));
      const integral = (u: number): number => 2.5 * u ** 4 - 3 * u ** 5 + u ** 6;
      const rise: number = accel * integral(Math.min(1, clamp / accel));
      const flatPart: number = Math.max(0, Math.min(clamp, span - decel) - accel);
      const fall: number = clamp > span - decel ? decel * (0.5 - integral(1 - (clamp - (span - decel)) / decel)) : 0;
      return v * (rise + flatPart + fall);
    };
    const rootStart: IAutoMovieVector3 = input.entry.posture.root;
    const centre = (yaw: number): IAutoMovieVector3 => {
      const a: IAutoMovieVector3 = body.rest.get("leftFoot")!;
      const b: IAutoMovieVector3 = body.rest.get("rightFoot")!;
      return HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, { x: (a.x + b.x) / 2, y: 0, z: (a.z + b.z) / 2 });
    };
    const yawAt = (t: number): number => yaw0 + (heading - yaw0) * minimumJerk(t / (first + T)).s;
    const amount = (t: number): number => Math.max(0, Math.min(1, ramp(t)));
    const foot = (side: "left" | "right", t: number): IFoot => footAt(body, side, steps, start[side], t);
    const planned = (t: number): IAutoMovieVector3 => {
      const yaw: number = yawAt(t);
      const c: IAutoMovieVector3 = centre(yaw);
      const a: number = amount(t);
      const sway: number = 0.02 * (l / 0.93) * a * Math.cos((2 * Math.PI * (t - (firstLeft + 0.6 * T))) / (2 * T));
      const bob: number = a * (-0.015 + 0.025 * Math.cos((2 * Math.PI * (t - (firstLeft + 0.6 * T))) / T));
      const p: IAutoMovieVector3 = HumanFrame.point({ origin: S, yaw: heading }, { x: sway, y: 0, z: progress(t) });
      return { x: p.x - c.x, y: -0.005 + bob, z: p.z - c.z };
    };
    const offset: IAutoMovieVector3 = { x: rootStart.x - planned(0).x, y: rootStart.y - planned(0).y, z: rootStart.z - planned(0).z };
    const root = (t: number): IAutoMovieVector3 => {
      const fade: number = 1 - minimumJerk(t / 0.3).s;
      const p: IAutoMovieVector3 = planned(t);
      return { x: p.x + offset.x * fade, y: p.y + offset.y * fade, z: p.z + offset.z * fade };
    };
    return {
      duration,
      events,
      stances,
      root,
      yaw: yawAt,
      phase: (t: number): number => (t - firstLeft) / (2 * T) + 0.25,
      amount,
      foot,
    };
  }

  /**
   * Make every foot goal reachable on the actual pelvis: lower the root until
   * each planted ankle is reached with the knee at least `KNEE` degrees bent
   * (`resolveHumanPosture.lower`), then pull an unreachable swinging ankle toward its hip and turn one
   * trailing further behind the hip than `EXTENSION` degrees forward, inside
   * the hip's 30° extension range (DEFAULT_HUMANOID_ROM), since the thigh
   * cannot carry it further back. A planted foot whose shank leans past the
   * ankle's dorsal limit raises its heel about its ball, and a swinging foot's
   * pitch is held inside the ankle's range relative to its shank, both `ANKLE`
   * degrees inside the limits, so the displayed foot is the goal foot. The hip
   * joints are read from the pelvis posed by the root, the heading and the
   * pelvis joint, so its rotation and list count.
   *
   * @param body The body.
   * @param root The unconstrained root, world metres.
   * @param yaw The heading, degrees.
   * @param hips The pelvis joint's clinical angles, degrees.
   * @param feet Each foot.
   * @returns The lowered root and each foot's reachable ankle.
   */
  export function reach(
    body: IHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    hips: readonly [number, number, number],
    feet: Readonly<Record<"left" | "right", IFoot>>,
  ): { root: IAutoMovieVector3; ankles: Record<"left" | "right", IAutoMovieVector3>; rotations: Record<"left" | "right", IAutoMovieQuaternion>; toes: Record<"left" | "right", number> } {
    const m = body.measure;
    const limit: number = Math.sqrt(m.thigh ** 2 + m.shank ** 2 + 2 * m.thigh * m.shank * Math.cos((KNEE * Math.PI) / 180));
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      resolvePose(
        {
          skeleton: body.skeleton.id,
          root: { translation: root, rotation: resolveHumanPosture.heading({ yaw, pitch: 0, roll: 0 }), scale: { x: 1, y: 1, z: 1 } },
          joints: [{ bone: "hips", flexion: hips[0], abduction: hips[1], twist: hips[2] }],
        },
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      ).map((r: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r]),
    );
    const hip = (side: "left" | "right"): IAutoMovieVector3 => bones.get(`${side}UpperLeg`)!.worldPosition;
    const lowered: IAutoMovieVector3 = resolveHumanPosture.lower(
      body,
      {
        root,
        yaw,
        pitch: 0,
        roll: 0,
        joints: { hips },
        limbs: {
          leftLeg: { point: feet.left.placement.ankle, bend: feet.left.placement.ankle, planted: feet.left.planted },
          rightLeg: { point: feet.right.placement.ankle, bend: feet.right.placement.ankle, planted: feet.right.planted },
        },
      },
      KNEE,
    ).root;
    const drop: number = root.y - lowered.y;
    const ankles = {} as Record<"left" | "right", IAutoMovieVector3>;
    const rotations: Record<"left" | "right", IAutoMovieQuaternion> = { left: feet.left.placement.rotation, right: feet.right.placement.rotation };
    const toes: Record<"left" | "right", number> = { left: feet.left.toes, right: feet.right.toes };
    const forward: IAutoMovieVector3 = HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, { x: 0, y: 0, z: 1 });
    const extension: number = (EXTENSION * Math.PI) / 180;
    for (const side of ["left", "right"] as const) {
      const ankle: IAutoMovieVector3 = feet[side].placement.ankle;
      const h: IAutoMovieVector3 = { ...hip(side), y: hip(side).y - drop };
      if (feet[side].planted) {
        // The heel rises about the ball once the shank leans past the ankle's
        // dorsal limit: the forefoot rocker begins where the ankle can bend no
        // further (Perry and Burnfield), so the ball never slides.
        let placement: HumanFoot.IPlacement = feet[side].placement;
        const heading: number = HumanFrame.heading(placement.rotation);
        let pitch: number = pitchOf(placement.rotation);
        const ball: IAutoMovieVector3 = HumanFoot.point(body, side, "ball", placement);
        if (pitch <= 1e-6 && ball.y < 0.01)
          for (let k: number = 0; k < 4; k++) {
            const top: number = -lean(body, h, placement.ankle, heading) + 20 - ANKLE;
            if (pitch <= top + 1e-6) break;
            pitch = top;
            placement = HumanFoot.pivot(body, side, "ball", ball, heading, pitch);
          }
        ankles[side] = placement.ankle;
        rotations[side] = placement.rotation;
        toes[side] = Math.max(feet[side].toes, -pitch);
        continue;
      }
      // A swinging ankle within reach and no further behind the hip than the
      // hip's extension allows: the thigh cannot carry it further back.
      let v: IAutoMovieVector3 = { x: ankle.x - h.x, y: ankle.y - h.y, z: ankle.z - h.z };
      const d: number = Math.hypot(v.x, v.y, v.z);
      if (d > limit) v = { x: (v.x * limit) / d, y: (v.y * limit) / d, z: (v.z * limit) / d };
      const ahead: number = v.x * forward.x + v.z * forward.z;
      const sagittal: number = Math.hypot(ahead, v.y);
      if (v.y < 0 && Math.atan2(-ahead, -v.y) > extension) {
        const lateral: IAutoMovieVector3 = { x: v.x - ahead * forward.x, y: 0, z: v.z - ahead * forward.z };
        const back: number = sagittal * Math.sin(extension);
        v = { x: lateral.x - back * forward.x, y: -sagittal * Math.cos(extension), z: lateral.z - back * forward.z };
      }
      ankles[side] = { x: h.x + v.x, y: h.y + v.y, z: h.z + v.z };
      rotations[side] = ankleRange(body, h, ankles[side], feet[side].placement.rotation);
    }
    return { root: { ...root, y: root.y - drop }, ankles, rotations, toes };
  }

  /** A foot's pitch from its rotation, degrees, positive toes up. */
  function pitchOf(rotation: IAutoMovieQuaternion): number {
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 });
    return (Math.asin(Math.max(-1, Math.min(1, toes.y))) * 180) / Math.PI;
  }

  /**
   * The shank's forward lean from vertical along a heading, degrees, with the
   * knee placed by the two-bone geometry in the plane of the hip, the ankle
   * and the heading.
   */
  function lean(body: IHumanBody, hip: IAutoMovieVector3, ankle: IAutoMovieVector3, heading: number): number {
    const forward: IAutoMovieVector3 = HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: heading }, { x: 0, y: 0, z: 1 });
    const v: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    const d: number = Vector3.length(v);
    const a: number = body.measure.thigh;
    const b: number = body.measure.shank;
    if (d < 1e-6) return 0;
    const axis: IAutoMovieVector3 = Vector3.scale(v, 1 / d);
    const along: number = (a * a - b * b + d * d) / (2 * d);
    const across: number = Math.sqrt(Math.max(0, a * a - along * along));
    let perpendicular: IAutoMovieVector3 = Vector3.subtract(forward, Vector3.scale(axis, Vector3.dot(forward, axis)));
    if (Vector3.length(perpendicular) < 1e-9) return 0;
    perpendicular = Vector3.normalize(perpendicular);
    const knee: IAutoMovieVector3 = Vector3.add(hip, Vector3.add(Vector3.scale(axis, along), Vector3.scale(perpendicular, across)));
    const shank: IAutoMovieVector3 = Vector3.subtract(knee, ankle);
    return (Math.atan2(Vector3.dot(shank, forward), shank.y) * 180) / Math.PI;
  }

  /**
   * A swinging foot's rotation kept inside the ankle's range: the knee is
   * placed by the two-bone geometry in the plane of the hip, the ankle and
   * the foot's heading, the shank's inclination read from it, and the foot's
   * pitch held within `ANKLE` of the ankle's 50° plantar and 20° dorsal limits
   * (DEFAULT_HUMANOID_ROM) relative to the shank.
   */
  function ankleRange(body: IHumanBody, hip: IAutoMovieVector3, ankle: IAutoMovieVector3, rotation: IAutoMovieQuaternion): IAutoMovieQuaternion {
    const heading: number = HumanFrame.heading(rotation);
    const shank: number = lean(body, hip, ankle, heading);
    const pitch: number = pitchOf(rotation);
    const clamped: number = Math.min(-shank + 20 - ANKLE, Math.max(-shank - 50 + ANKLE, pitch));
    return clamped === pitch ? rotation : HumanFoot.rotation(heading, clamped);
  }

  /** Degrees a swinging foot keeps inside the ankle's range. */
  const ANKLE: number = 2;

  /** The least knee flexion of a planted or reaching leg, degrees: a walking knee never locks straight. */
  const KNEE: number = 10;
}

/** A foot's placement at an instant: the rocker of its stance or its swing between footprints. */
function footAt(
  body: IHumanBody,
  side: "left" | "right",
  steps: readonly { side: "left" | "right"; heelStrike: number; toeOff: number; flat: HumanFoot.IPlacement; heading: number }[],
  start: HumanFoot.IPlacement,
  t: number,
): walkSteps.IFoot {
  const own = steps.filter((s) => s.side === side);
  let flat: HumanFoot.IPlacement = start;
  let heading: number | undefined;
  let strike: number = -Infinity;
  for (const step of own) {
    if (t < step.toeOff) {
      return stance(body, side, flat, headingOf(flat, heading), strike, step.toeOff, t);
    }
    if (t < step.heelStrike) {
      const lift: HumanFoot.IPlacement = rocked(body, side, flat, headingOf(flat, heading), -40, "ball");
      const land: HumanFoot.IPlacement = rocked(body, side, step.flat, step.heading, 15, "heel");
      const u: number = (t - step.toeOff) / (step.heelStrike - step.toeOff);
      const toes: number = 40 * (1 - minimumJerk(Math.min(1, 2 * u)).s);
      return { placement: swingAt(body, side, lift, land, headingOf(flat, heading), step.heading, u, toes), planted: false, toes };
    }
    flat = step.flat;
    heading = step.heading;
    strike = step.heelStrike;
  }
  return stance(body, side, flat, headingOf(flat, heading), strike, Infinity, t);
}

/** A footprint's heading, or the starting foot's own heading. */
function headingOf(flat: HumanFoot.IPlacement, heading: number | undefined): number {
  return heading ?? HumanFrame.heading(flat.rotation);
}

/** A flat footprint pitched about its heel or ball. */
function rocked(body: IHumanBody, side: "left" | "right", flat: HumanFoot.IPlacement, heading: number, pitch: number, about: "heel" | "ball"): HumanFoot.IPlacement {
  return HumanFoot.pivot(body, side, about, HumanFoot.point(body, side, about, flat), heading, pitch);
}

/** A foot in stance: heel rocker after its strike, flat, forefoot rocker before its toe-off. */
function stance(body: IHumanBody, side: "left" | "right", flat: HumanFoot.IPlacement, heading: number, strike: number, toeOff: number, t: number): walkSteps.IFoot {
  const length: number = Number.isFinite(strike) && Number.isFinite(toeOff) ? toeOff - strike : 1;
  if (Number.isFinite(strike) && t < strike + 0.12 * length) {
    const pitch: number = 15 * (1 - minimumJerk((t - strike) / (0.12 * length)).s);
    return { placement: rocked(body, side, flat, heading, pitch, "heel"), planted: true, toes: 0 };
  }
  if (Number.isFinite(toeOff)) {
    const rise: number = toeOff - 0.4 * (Number.isFinite(strike) ? length : 0.6);
    if (t > rise) {
      const pitch: number = -40 * minimumJerk((t - rise) / (toeOff - rise)).s;
      return { placement: rocked(body, side, flat, heading, pitch, "ball"), planted: true, toes: -pitch };
    }
  }
  return { placement: { ankle: flat.ankle, rotation: HumanFoot.rotation(heading, 0) }, planted: true, toes: 0 };
}

/** A swinging foot between its toe-off and heel-strike placements, clear of the floor. */
function swingAt(
  body: IHumanBody,
  side: "left" | "right",
  lift: HumanFoot.IPlacement,
  land: HumanFoot.IPlacement,
  fromHeading: number,
  toHeading: number,
  u: number,
  toes: number,
): HumanFoot.IPlacement {
  const s: number = minimumJerk(u).s;
  const pitch: number = -40 + 55 * s;
  const heading: number = fromHeading + (toHeading - fromHeading) * s;
  const ankle: IAutoMovieVector3 = {
    x: lift.ankle.x + (land.ankle.x - lift.ankle.x) * s,
    y: lift.ankle.y + (land.ankle.y - lift.ankle.y) * s + 0.07 * body.measure.hipHeight * Math.sin(Math.PI * Math.min(1, Math.max(0, u))),
    z: lift.ankle.z + (land.ankle.z - lift.ankle.z) * s,
  };
  const placement: HumanFoot.IPlacement = { ankle, rotation: HumanFoot.rotation(heading, pitch) };
  const low: number = Math.min(HumanFoot.point(body, side, "toe", placement, toes).y, HumanFoot.point(body, side, "heel", placement).y);
  const clearance: number = 0.012 * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
  if (low < clearance && u > 0 && u < 1) ankle.y += clearance - low;
  return placement;
}
