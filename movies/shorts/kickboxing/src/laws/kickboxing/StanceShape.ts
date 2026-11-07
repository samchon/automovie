import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "./IBoutPosture";
import type { IFighterMeasure } from "./IFighterMeasure";

/**
 * The orthodox fighting stance and guard, scaled from the fighter's own
 * measured body: feet a shoulder width apart along the line on separated
 * hip-width tracks, knees slightly bent, the body turned so the lead
 * shoulder leads, chin tucked and gloves at the cheeks with the elbows over
 * the ribs. Every other shape starts from this posture.
 *
 * ```ts
 * const guard = StanceShape.guard(measure);
 * const feet = StanceShape.feet(measure); // body-frame ankle points
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#laws Shapes in the performer's own frame.
 * @evidence docs/research/kickboxing/ring-generalship.md#step Step and rope margin from the stance and shoulders.
 * @evidence docs/body/settings/cast/fighter-a.md#stance The orthodox stance A and B share.
 * @evidence contracts/development/common.md#meaningful-documentation States the stance and what each function returns.
 * @evidence contracts/development/design.md#principled-representation Ratios are named readings of the IBA stance drawings, applied to measured lengths.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The guard, the feet and the step and margin the footwork law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fighter is named; both share the law and differ by their measure.
 */
export namespace StanceShape {
  /**
   * Knee flexion of the stance, degrees: IBA p.34 shows "slightly bent"
   * knees; the film reads that as twenty degrees, a stated reading of the
   * drawing, not a measurement.
   */
  export const KNEE_FLEXION: number = 20;

  /**
   * Body turn of the orthodox stance from the line to the opponent, radians:
   * the IBA p.34 overhead feet show the lead shoulder forward; the film reads
   * the turn as thirty degrees, a stated reading of the drawing.
   */
  export const TURN: number = (30 * Math.PI) / 180;

  /** Chin tuck as cervical flexion, degrees: "chin tucked" read as the cervical range's lower third. */
  export const CHIN_TUCK: number = 12;

  /**
   * The stance length along the line, metres: a shoulder width, the coaching
   * convention for feet "about shoulder width apart".
   *
   * @param measure The fighter's measure.
   * @returns Metres.
   * @evidence docs/research/kickboxing/ring-generalship.md#step Stance length is measured on the body.
   * @evidence contracts/development/common.md#meaningful-documentation States the convention.
   * @evidence contracts/development/implementation.md#principled-implementation Twice the shoulder half-width.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The stated convention.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function length(measure: IFighterMeasure): number {
    return 2 * measure.shoulderHalfWidth;
  }

  /**
   * One step: half the stance length, so the following foot restores the stance without crossing.
   *
   * @param measure The fighter's measure.
   * @returns Metres.
   * @evidence docs/research/kickboxing/ring-generalship.md#step A step is at most half the stance length.
   * @evidence contracts/development/common.md#meaningful-documentation States the law.
   * @evidence contracts/development/implementation.md#principled-implementation Half the stance length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The studied step.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function step(measure: IFighterMeasure): number {
    return length(measure) / 2;
  }

  /**
   * The distance a stance origin keeps from the rope line: shoulder half-width plus the glove's diameter.
   *
   * @param measure The fighter's measure.
   * @returns Metres.
   * @evidence docs/research/kickboxing/ring-generalship.md#step The margin is the shoulder half-width plus the glove.
   * @evidence contracts/development/common.md#meaningful-documentation States the law.
   * @evidence contracts/development/implementation.md#principled-implementation Sum of measured lengths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The studied margin.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function margin(measure: IFighterMeasure): number {
    return measure.shoulderHalfWidth + 2 * measure.gloveRadius;
  }

  /**
   * Body-frame ankle points of the planted stance, before the body turn: the
   * lead (left) foot half a stance ahead on the left hip track, the rear foot
   * half a stance behind on the right hip track.
   *
   * @param measure The fighter's measure.
   * @returns Ankle points in the stance frame, metres.
   * @evidence docs/research/kickboxing/ring-generalship.md#sources Separated tracks and a staggered stance (IBA).
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and placement.
   * @evidence contracts/development/implementation.md#principled-implementation Stance length along the line, hip-width tracks across it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record.
   * @evidence contracts/development/behaviors.md#studied-laws The studied stance.
   * @evidence contracts/development/behaviors.md#relational-goals Placements are in the fighter's frame along his line to the opponent.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function feet(
    measure: IFighterMeasure,
  ): Record<"left" | "right", IAutoMovieVector3> {
    const half: number = length(measure) / 2;
    return {
      left: { x: half, y: measure.ankle, z: measure.hipHalfWidth },
      right: { x: -half, y: measure.ankle, z: -measure.hipHalfWidth },
    };
  }

  /**
   * The root drop that bends straight legs to the stance's knee flexion: the
   * difference between the straight leg and the chord of the bent one.
   *
   * @param measure The fighter's measure.
   * @param flexion Knee flexion, degrees.
   * @returns Metres.
   * @evidence docs/research/kickboxing/techniques.md#laws Lengths from the measured body.
   * @evidence contracts/development/common.md#meaningful-documentation States the geometry.
   * @evidence contracts/development/implementation.md#principled-implementation Law of cosines on thigh and shank.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws Geometry of the measured legs.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function drop(measure: IFighterMeasure, flexion: number): number {
    const { thigh, shank } = measure;
    const knee: number = Math.PI - (flexion * Math.PI) / 180;
    const chord: number = Math.sqrt(
      thigh * thigh + shank * shank - 2 * thigh * shank * Math.cos(knee),
    );
    return thigh + shank - chord;
  }

  /**
   * The guard posture: stance drop and turn, chin tucked, gloves at the
   * cheeks a head radius ahead of the head centre and a glove below its
   * centre, elbows over the ribs.
   *
   * @param measure The fighter's measure.
   * @returns The posture.
   * @evidence docs/body/settings/cast/fighter-a.md#stance Chin tucked, gloves beside the cheeks, elbows ready to cover the ribs.
   * @evidence docs/research/kickboxing/kick-guard.md The opposite glove guards the cheek during kicks; the same point serves.
   * @evidence contracts/development/common.md#meaningful-documentation States each part of the guard.
   * @evidence contracts/development/implementation.md#principled-implementation Points from measured head, shoulder and hip landmarks.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate is tuned; ratios are the stated readings.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record.
   * @evidence contracts/development/behaviors.md#studied-laws The studied guard.
   * @evidence contracts/development/behaviors.md#relational-goals Body-frame goals.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function guard(measure: IFighterMeasure): IBoutPosture {
    const lowered: number = drop(measure, KNEE_FLEXION);
    const head: number = measure.head - lowered;
    return {
      drop: lowered,
      shift: { forward: 0, left: 0 },
      yaw: TURN,
      pitch: 0,
      roll: 0,
      pelvis: { tilt: 0, obliquity: 0, rotation: 0 },
      // The root turns toward the own right with the stance; the trunk and neck
      // turn back toward the opponent (positive rotation turns the front left).
      thoracic: { flexion: CHIN_TUCK / 2, lateralFlexion: 0, rotation: toDegrees(TURN) / 2 },
      lumbar: { flexion: 0, lateralFlexion: 0 },
      cervical: { flexion: CHIN_TUCK, lateralFlexion: 0, rotation: toDegrees(TURN) / 2 },
      hands: {
        left: cheek(measure, head, 1),
        right: cheek(measure, head, -1),
      },
      feet: { left: null, right: null },
      pivot: 0,
      jaw: 0,
      wince: 0,
    };
  }

  /**
   * The glove-at-the-cheek goal of one side, in the stance frame.
   *
   * @param measure The fighter's measure.
   * @param head Head centre height in this posture, metres.
   * @param side +1 for the left glove, -1 for the right.
   * @returns The glove goal and elbow aim.
   * @evidence docs/body/settings/cast/fighter-a.md#stance Gloves beside the cheeks, elbows ready to cover the ribs.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and the side convention.
   * @evidence contracts/development/implementation.md#principled-implementation The glove sits one head radius ahead of the head centre, a glove radius below it and a head radius to the side; the elbow aims at the ribs under the shoulder.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One function for both sides.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record.
   * @evidence contracts/development/behaviors.md#studied-laws The studied guard.
   * @evidence contracts/development/behaviors.md#relational-goals Body-frame goal.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function cheek(
    measure: IFighterMeasure,
    head: number,
    side: 1 | -1,
  ): { point: IAutoMovieVector3; elbow: IAutoMovieVector3 } {
    // The stance turn leaves the lead side forward; turn the gloves back
    // toward the opponent so both cheeks stay covered on the line.
    const back: number = -TURN;
    const local: IAutoMovieVector3 = {
      x: measure.headRadius + measure.gloveRadius,
      y: head - measure.gloveRadius,
      z: side * measure.headRadius,
    };
    const elbow: IAutoMovieVector3 = {
      x: measure.headRadius,
      y: head - (measure.head - measure.shoulder) - measure.headRadius * 2,
      z: side * measure.shoulderHalfWidth,
    };
    return { point: turn(local, back), elbow: turn(elbow, back) };
  }

  /** Rotate a body-frame point about +Y. */
  function turn(p: IAutoMovieVector3, angle: number): IAutoMovieVector3 {
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
  }

  function toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }
}
