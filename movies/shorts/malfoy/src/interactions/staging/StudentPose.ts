import type { IAutoMovieVector3 } from "@automovie/interface";

import { BodyFrame } from "../../laws/body/BodyFrame";
import type { IBodyMeasure } from "../../laws/body/IBodyMeasure";
import type { IBodyPosture } from "../../laws/body/IBodyPosture";
import { PostureFrame } from "../../laws/body/PostureFrame";
import type { IBodyState } from "../../laws/body/IBodyState";
import { EverydayLaw } from "../../laws/everyday/EverydayLaw";
import { GiveRoomShape } from "../../laws/everyday/GiveRoomShape";

/**
 * The resting posture of a body state: standing relaxed or on guard, bent
 * toward the floor, seated on a seat, with each hand at its named place
 * (at the side, in a pocket, at the chest or waist, behind the hip, at the
 * forehead, palms out, extended to a point) and the head turned to its gaze.
 * Motion laws blend between two such postures and add the action's own path.
 * A slow breath moves the trunk so nobody stands in a frozen pose.
 *
 * ```ts
 * StudentPose.of(state, measure, (id) => positions.get(id), seconds, phase);
 * ```
 *
 * @evidence docs/research/duelling/practice-duel.md#stance On guard: wand-side foot leading, feet 1.2–1.5 shoulder widths apart, knees soft, rear foot turned out.
 * @evidence docs/research/everyday/sitting.md#stand-to-sit Seated: pelvis on the seat, knees near 90°, feet planted.
 * @evidence docs/research/everyday/handover.md#pick-up A bend hinges at the hips with bent knees.
 * @evidence docs/body/settings/cast/carina-malfoy.md#movement Effort qualities differ by person; the breath never stops.
 * @evidence contracts/development/behaviors.md#relational-goals Gaze reads the watched subject's position at the instant.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation A pure function of the state, the measures and the instant.
 * @evidence contracts/development/common.md#meaningful-documentation States the places and what the breath does.
 */
export namespace StudentPose {
  /** Where a subject stands at an instant, for gaze. */
  export type Locate = ((subject: string) => IAutoMovieVector3 | undefined) & {
    /** Where another student's wand hand is now, for a gripping hand that follows it. */
    hand?: (subject: string) => IAutoMovieVector3 | undefined;

    /** Where another student's left or right hand is now, for a gaze on it. */
    limb?: (subject: string, side: "left" | "right") => IAutoMovieVector3 | undefined;
  };

  /**
   * The resting posture of a state.
   *
   * @param state The body state.
   * @param m The body's measures.
   * @param locate Positions of watched subjects.
   * @param seconds Film seconds, for the breath.
   * @param phase The person's breath phase, radians.
   * @returns The posture.
   */
  export function of(state: IBodyState, m: IBodyMeasure, locate: Locate, seconds: number, phase: number): IBodyPosture {
    const seated: boolean = state.support === "seat";
    // A duellist on guard squares to the watched opponent wherever the opponent has moved.
    if (state.stance === "guard" && state.gaze?.kind === "subject") {
      const target: IAutoMovieVector3 | undefined = locate(state.gaze.subject);
      if (target !== undefined) state = { ...state, heading: BodyFrame.headingTo(state.position, target) };
    }
    const guard: boolean = state.stance === "guard" && !seated;
    const bend: number = seated ? 0 : state.bend;
    const f: IAutoMovieVector3 = BodyFrame.forward(state.heading);
    const l: IAutoMovieVector3 = BodyFrame.left(state.heading);
    const drop: number = (guard ? 0.05 : 0.01) + bend * 0.2;
    const pelvis: IAutoMovieVector3 = seated
      ? { x: state.position.x, y: state.seat + EverydayLaw.HIP_ABOVE_SEAT, z: state.position.z }
      : { x: state.position.x - f.x * 0.12 * bend, y: m.hip - drop, z: state.position.z - f.z * 0.12 * bend };
    const lean: number = (seated ? 0.06 : guard ? 0.1 : 0.03) + bend * 0.95 + 0.012 * Math.sin((2 * Math.PI * seconds) / 4 + phase);
    const head = gaze(state, pelvis, m, locate);
    const feet = (side: "left" | "right"): IBodyPosture.IFoot => {
      const s: number = side === "left" ? 1 : -1;
      let forward: number = seated ? 0.25 : 0;
      let lateral: number = s * (m.hipHalfWidth + 0.01);
      let toes: IAutoMovieVector3 = f;
      if (guard) {
        // Wand-side (right) foot leads; the rear foot turns out 70°.
        const half: number = (1.3 * 2 * m.shoulderHalfWidth) / 2;
        forward = side === "right" ? half * 0.8 : -half * 0.8;
        lateral = s * half * 0.55;
        if (side === "left") toes = BodyFrame.forward(state.heading + 1.2);
      }
      if (bend > 0) lateral *= 1 + 0.6 * bend;
      const point: IAutoMovieVector3 = BodyFrame.toWorld({ x: state.position.x, y: 0, z: state.position.z }, state.heading, { forward, left: lateral, up: m.ankle });
      return { point, toes, knee: { x: point.x + f.x * 0.6 + l.x * s * 0.05, y: point.y + 0.5, z: point.z + f.z * 0.6 + l.z * s * 0.05 } };
    };
    const posture: IBodyPosture = {
      pelvis,
      heading: state.heading,
      pitch: 0,
      roll: 0,
      lean,
      twist: head.twist,
      headYaw: head.yaw,
      headPitch: head.pitch,
      feet: { left: feet("left"), right: feet("right") },
      hands: { left: { point: pelvis, elbow: pelvis, palm: { x: 0, y: -1, z: 0 } }, right: { point: pelvis, elbow: pelvis, palm: { x: 0, y: -1, z: 0 } } },
    };
    posture.hands.left = hand(state, "left", posture, m);
    posture.hands.right = hand(state, "right", posture, m);
    for (const side of ["left", "right"] as const) {
      const follows: string | null | undefined = state.hands[side].follows;
      const gripped: IAutoMovieVector3 | undefined = follows ? locate.hand?.(follows) : undefined;
      if (gripped !== undefined) posture.hands[side] = { ...posture.hands[side], point: gripped };
    }
    return posture;
  }

  /** The trunk frame of a posture, for hand places that ride the chest. */
  export function trunk(p: IBodyPosture): PostureFrame.IFrame {
    return PostureFrame.trunk(p);
  }

  /**
   * A point in the trunk frame: forward, to the own left and up from the pelvis.
   *
   * @param p The posture.
   * @param forward Metres.
   * @param left Metres.
   * @param up Metres.
   * @returns World metres.
   */
  export function onTrunk(p: IBodyPosture, forward: number, left: number, up: number): IAutoMovieVector3 {
    return PostureFrame.onTrunk(p, forward, left, up);
  }

  /** A hand's goal at its state's place. */
  export function hand(state: IBodyState, side: "left" | "right", p: IBodyPosture, m: IBodyMeasure): IBodyPosture.IHand {
    const s: number = side === "left" ? 1 : -1;
    const trunkLength: number = m.shoulder - m.hip;
    const h: IBodyState.IHand = state.hands[side];
    const down: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const elbow: IAutoMovieVector3 = onTrunk(p, -0.35, s * (m.shoulderHalfWidth + 0.3), trunkLength - 0.45);
    const at = (forward: number, left: number, upward: number, palm: IAutoMovieVector3 = down): IBodyPosture.IHand => ({ point: onTrunk(p, forward, s * left, upward), elbow, palm });
    switch (h.place) {
      case "side":
        return state.support === "seat" ? at(0.28, 0.1, 0.06) : at(0.02, m.shoulderHalfWidth + 0.04, -0.04 + 0.04 * state.bend);
      case "pocket":
        return at(0.06, m.hipHalfWidth + 0.06, -0.05);
      case "chest":
        return at(0.27, 0.07, trunkLength - 0.2, up);
      case "waist":
        return at(0.32, 0.1, 0.13, up);
      case "hip-behind":
        return at(-0.17, m.hipHalfWidth + 0.07, -0.02);
      case "forehead":
        return at(0.16, 0.03, trunkLength + 0.17);
      case "palms-out":
        return GiveRoomShape.palm(p, side, m);
      case "extended":
      case "raised":
        return { point: h.point ?? onTrunk(p, 0.4, s * 0.15, trunkLength - 0.2), elbow, palm: up };
      case "shaft":
        return at(0.4, 0.08, trunkLength - 0.4);
      case "knee":
        // Seated, the hand rests on the top of the knee; standing, it hangs at the side.
        return state.support === "seat" ? at(0.43, m.hipHalfWidth - 0.02, 0.05) : at(0.02, m.shoulderHalfWidth + 0.04, -0.04);
    }
  }

  /** Head yaw, pitch and the trunk twist that carries a gaze beyond the neck's range. */
  function gaze(state: IBodyState, pelvis: IAutoMovieVector3, m: IBodyMeasure, locate: Locate): { yaw: number; pitch: number; twist: number } {
    if (state.gaze === null) return { yaw: 0, pitch: 0.05, twist: 0 };
    const part: "head" | "leftHand" | "rightHand" | undefined = state.gaze.kind === "subject" ? state.gaze.part : undefined;
    const limb: IAutoMovieVector3 | undefined =
      state.gaze.kind === "subject" && (part === "leftHand" || part === "rightHand") ? locate.limb?.(state.gaze.subject, part === "leftHand" ? "left" : "right") : undefined;
    const target: IAutoMovieVector3 | undefined = limb ?? (state.gaze.kind === "point" ? state.gaze.point : locate(state.gaze.subject));
    if (target === undefined) return { yaw: 0, pitch: 0.05, twist: 0 };
    const eye: number = pelvis.y + (m.head - m.hip);
    const want: number = BodyFrame.turn(state.heading, BodyFrame.headingTo(pelvis, target));
    const yaw: number = Math.max(-1.2, Math.min(1.2, want));
    const twist: number = Math.max(-0.6, Math.min(0.6, want - yaw));
    const horizontal: number = Math.hypot(target.x - pelvis.x, target.z - pelvis.z);
    // A watched hand is looked at where it is; a watched person at the head.
    const lookY: number = state.gaze.kind === "subject" && limb === undefined ? target.y + m.head * 0.9 : target.y;
    const pitch: number = Math.max(-0.5, Math.min(0.9, Math.atan2(eye - lookY, Math.max(0.2, horizontal))));
    return { yaw, pitch, twist };
  }
}
