import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBodyMeasure } from "../../../laws/body/IBodyMeasure";
import type { IBodyPosture } from "../../../laws/body/IBodyPosture";
import type { StudentHuman } from "./StudentHuman";

/**
 * A student's skeleton as joints solved from a posture: the pelvis and the
 * trunk frame, shoulders, neck and head, and both arms and legs fitted to
 * their goals by analytic two-bone inverse kinematics with the elbow or knee
 * turned toward its aim. Given the student's Human skeleton, every segment
 * and the shoulder line's offset are that skeleton's own, so solved joints
 * coincide with the drawn polygon bones; without it the segment convention
 * applies (upper arm 0.186 and forearm 0.146 of stature, knee at 0.285).
 *
 * ```ts
 * const body = new StudentBody(student.measure);
 * const joints = body.solve(posture); // world joint points and frames
 * ```
 *
 * @evidence docs/body/settings/cast/carina-malfoy.md#measures Lengths scale from her stature.
 * @evidence docs/body/settings/cast/harry-potter.md#measures Lengths scale from his stature.
 * @evidence contracts/development/entities.md#settings-realization Segment lengths are the stated proportions of the record's stature.
 * @evidence contracts/development/entities.md#object-shape A frozen fragment holding only its measures; `solve` is pure.
 * @evidence contracts/development/implementation.md#principled-implementation Two-bone IK by the law of cosines in the plane of root, goal and aim; a goal beyond reach is met at full extension along its direction.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per solve.
 * @evidence contracts/development/common.md#meaningful-documentation States the method and lengths.
 */
export class StudentBody {
  /** Body lengths. */
  public readonly measure: IBodyMeasure;

  /** Segment lengths, metres. */
  public readonly lengths: StudentBody.ILengths;

  /**
   * Build the skeleton.
   *
   * @param measure The body's measures.
   */
  public constructor(measure: IBodyMeasure, human?: StudentHuman.ISkeletonPoints) {
    this.measure = measure;
    const h: number = measure.stature;
    const knee: number = 0.285 * h;

    // With the student's Human skeleton, every segment is that skeleton's own,
    // so the solved joints are the drawn bones' joints and contacts and
    // collisions computed on them are what the picture shows.
    this.lengths = Object.freeze(
      human === undefined
        ? {
            upperArm: 0.186 * h,
            forearm: 0.146 * h,
            hand: Math.max(0.03, measure.armReach - 0.332 * h),
            thigh: measure.hip - knee,
            shank: knee - measure.ankle,
            trunk: measure.shoulder - measure.hip,
            shoulderForward: 0,
            neck: 0.052 * h,
            headRadius: 0.065 * h,
            toe: 0.72 * measure.foot,
          }
        : {
            upperArm: human.upperArm,
            forearm: human.forearm,
            hand: human.hand,
            thigh: human.thigh,
            shank: human.shank,
            trunk: human.shoulder - human.hip,
            shoulderForward: human.shoulderForward,
            neck: human.neck,
            headRadius: 0.065 * h,
            toe: 0.72 * measure.foot,
          },
    );
    Object.freeze(this);
  }

  /**
   * Solve every joint of a posture.
   *
   * @param posture The posture.
   * @returns World joints and frames.
   */
  public solve(posture: IBodyPosture): StudentBody.IJoints {
    const m: IBodyMeasure = this.measure;
    const L: StudentBody.ILengths = this.lengths;
    const frame: StudentBody.IFrame = StudentBody.frame(posture.heading, posture.pitch, posture.roll);
    // The trunk: lean bends forward about the left axis, twist turns about the trunk's own up.
    const lu: V = add(scale(frame.up, Math.cos(posture.lean)), scale(frame.forward, Math.sin(posture.lean)));
    const lf: V = sub(scale(frame.forward, Math.cos(posture.lean)), scale(frame.up, Math.sin(posture.lean)));
    const trunk: StudentBody.IFrame = {
      up: lu,
      forward: add(scale(lf, Math.cos(posture.twist)), scale(frame.left, Math.sin(posture.twist))),
      left: sub(scale(frame.left, Math.cos(posture.twist)), scale(lf, Math.sin(posture.twist))),
    };
    const pelvis: V = posture.pelvis;
    const chest: V = add(add(pelvis, scale(trunk.up, L.trunk)), scale(trunk.forward, L.shoulderForward));
    const neck: V = add(chest, scale(trunk.up, L.neck));
    // The head: yaw about the trunk's up, then pitch down about the head's left.
    const yf: V = add(scale(trunk.forward, Math.cos(posture.headYaw)), scale(trunk.left, Math.sin(posture.headYaw)));
    const yl: V = sub(scale(trunk.left, Math.cos(posture.headYaw)), scale(trunk.forward, Math.sin(posture.headYaw)));
    const head: StudentBody.IFrame = {
      forward: sub(scale(yf, Math.cos(posture.headPitch)), scale(trunk.up, Math.sin(posture.headPitch))),
      up: add(scale(trunk.up, Math.cos(posture.headPitch)), scale(yf, Math.sin(posture.headPitch))),
      left: yl,
    };
    const headCentre: V = add(add(neck, scale(head.up, L.headRadius * 1.05)), scale(head.forward, 0.012));
    const side = (s: "left" | "right"): number => (s === "left" ? 1 : -1);
    const shoulder = (s: "left" | "right"): V => add(chest, scale(trunk.left, side(s) * m.shoulderHalfWidth));
    const hip = (s: "left" | "right"): V => add(pelvis, scale(frame.left, side(s) * m.hipHalfWidth));
    const arm = (s: "left" | "right"): StudentBody.IArm => {
      const goal: IBodyPosture.IHand = posture.hands[s];
      const root: V = shoulder(s);
      const toward: V = normalize(sub(goal.point, root), scale(frame.up, -1));
      const wristGoal: V = sub(goal.point, scale(toward, L.hand));
      const { mid, end } = twoBone(root, wristGoal, L.upperArm, L.forearm, goal.elbow, scale(frame.up, -1));
      // The hand runs from the wrist to the goal, so its end lands on the goal whenever the arm reaches it.
      const along: V = normalize(sub(goal.point, end), normalize(sub(end, mid), toward));
      return { shoulder: root, elbow: mid, wrist: end, hand: add(end, scale(along, L.hand)), palm: goal.palm };
    };
    const leg = (s: "left" | "right"): StudentBody.ILeg => {
      const goal: IBodyPosture.IFoot = posture.feet[s];
      const root: V = hip(s);
      const { mid, end } = twoBone(root, goal.point, L.thigh, L.shank, goal.knee, frame.forward);
      const toes: V = normalize(goal.toes, frame.forward);
      const down: V = normalize(sub(end, mid), scale(frame.up, -1));
      return {
        hip: root,
        knee: mid,
        ankle: end,
        toe: add(add(end, scale(toes, L.toe)), scale(down, m.ankle * 0.6)),
      };
    };
    return {
      frame,
      trunk,
      head,
      pelvis,
      chest,
      neck,
      headCentre,
      arms: { left: arm("left"), right: arm("right") },
      legs: { left: leg("left"), right: leg("right") },
    };
  }
}
export namespace StudentBody {
  /** Segment lengths, metres. */
  export interface ILengths {
    upperArm: number;
    forearm: number;
    hand: number;
    thigh: number;
    shank: number;
    trunk: number;
    /** The shoulder line ahead of the pelvis along the trunk's forward. */
    shoulderForward: number;
    neck: number;
    headRadius: number;
    toe: number;
  }

  /** An orthonormal frame: forward, up and the person's own left. */
  export interface IFrame {
    forward: IAutoMovieVector3;
    up: IAutoMovieVector3;
    left: IAutoMovieVector3;
  }

  /** An arm's joints. */
  export interface IArm {
    shoulder: IAutoMovieVector3;
    elbow: IAutoMovieVector3;
    wrist: IAutoMovieVector3;
    hand: IAutoMovieVector3;
    palm: IAutoMovieVector3;
  }

  /** A leg's joints. */
  export interface ILeg {
    hip: IAutoMovieVector3;
    knee: IAutoMovieVector3;
    ankle: IAutoMovieVector3;
    toe: IAutoMovieVector3;
  }

  /** Every solved joint. */
  export interface IJoints {
    frame: IFrame;
    trunk: IFrame;
    head: IFrame;
    pelvis: IAutoMovieVector3;
    chest: IAutoMovieVector3;
    neck: IAutoMovieVector3;
    headCentre: IAutoMovieVector3;
    arms: Record<"left" | "right", IArm>;
    legs: Record<"left" | "right", ILeg>;
  }

  /**
   * The body frame of a heading, pitched front-up and rolled left-side-down.
   *
   * @param heading Radians from +Z toward +X.
   * @param pitch Radians.
   * @param roll Radians.
   * @returns The frame.
   */
  export function frame(heading: number, pitch: number = 0, roll: number = 0): IFrame {
    const f0: V = { x: Math.sin(heading), y: 0, z: Math.cos(heading) };
    const l0: V = { x: Math.cos(heading), y: 0, z: -Math.sin(heading) };
    const u0: V = { x: 0, y: 1, z: 0 };
    const f1: V = add(scale(f0, Math.cos(pitch)), scale(u0, Math.sin(pitch)));
    const u1: V = sub(scale(u0, Math.cos(pitch)), scale(f0, Math.sin(pitch)));
    return {
      forward: f1,
      up: add(scale(u1, Math.cos(roll)), scale(l0, Math.sin(roll))),
      left: sub(scale(l0, Math.cos(roll)), scale(u1, Math.sin(roll))),
    };
  }
}

type V = IAutoMovieVector3;

function add(a: V, b: V): V {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
function sub(a: V, b: V): V {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function scale(a: V, s: number): V {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}
function dot(a: V, b: V): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function normalize(a: V, fallback: V): V {
  const n: number = Math.hypot(a.x, a.y, a.z);
  return n < 1e-9 ? fallback : scale(a, 1 / n);
}

/** Two-bone IK: the middle and end joints reaching from a root toward a goal with segment lengths a and b, bending toward an aim. */
function twoBone(root: V, goal: V, a: number, b: number, aim: V, fallback: V): { mid: V; end: V } {
  const span: V = sub(goal, root);
  const dir: V = normalize(span, fallback);
  const d: number = Math.min(a + b - 1e-4, Math.max(Math.abs(a - b) + 1e-4, Math.hypot(span.x, span.y, span.z)));
  const end: V = add(root, scale(dir, d));
  const cosA: number = Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d)));
  const toAim: V = sub(aim, root);
  let bendDir: V = sub(toAim, scale(dir, dot(toAim, dir)));
  if (Math.hypot(bendDir.x, bendDir.y, bendDir.z) < 1e-6) bendDir = sub(fallback, scale(dir, dot(fallback, dir)));
  const n: V = normalize(bendDir, { x: 0, y: 0, z: 1 });
  const mid: V = add(add(root, scale(dir, a * cosA)), scale(n, a * Math.sqrt(1 - cosA * cosA)));
  return { mid, end };
}
