import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "./IBoutPosture";
import type { IFighterMeasure } from "./IFighterMeasure";

/**
 * The orthodox kickboxing stance and guard, scaled from the fighter's own
 * measured body: feet a little more than a shoulder width apart along the
 * line on separated hip-width tracks, knees clearly flexed and springy so
 * either leg can lift at once, a light rhythm through the knees and the
 * pawing lead glove between exchanges, the body turned so the lead
 * shoulder leads, chin tucked and gloves at the cheeks with the elbows over
 * the ribs. Every other shape starts from this posture.
 *
 * ```ts
 * const guard = StanceShape.guard(measure);
 * const feet = StanceShape.feet(measure); // body-frame ankle points
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#laws Shapes in the performer's own frame.
 * @evidence docs/research/kickboxing/ring-generalship.md#stance The kickboxing stance as translated ranges.
 * @evidence docs/research/kickboxing/ring-generalship.md#step Step, entry and rope margin from the stance and shoulders.
 * @evidence docs/body/settings/cast/fighter-a.md#stance The orthodox stance A and B share.
 * @evidence contracts/development/common.md#meaningful-documentation States the stance and what each function returns.
 * @evidence contracts/development/design.md#principled-representation Ratios are named translations of kickboxing stance coaching, applied to measured lengths.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The guard, the feet and the step and margin the footwork law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fighter is named; both share the law and differ by their measure.
 */
export namespace StanceShape {
  /**
   * Knee flexion of the kickboxing stance, degrees. Kickboxing and Muay Thai
   * coaching keeps the knees soft and bent so either leg lifts at once to
   * check or kick; no source measures the angle, so the film translates it
   * inside {@link KNEE_FLEXION_RANGE} at its lower middle.
   */
  export const KNEE_FLEXION: number = 32;

  /**
   * The translated range of stance knee flexion, degrees: above the 20
   * degrees read from the boxing (IBA) drawing, which shows straight legs on
   * the figure, and up to the 45 degrees of a deep boxer's crouch (a rear knee
   * bent to 135 degrees). The picture measure is accepted inside it.
   */
  export const KNEE_FLEXION_RANGE: readonly [number, number] = [25, 45];

  /**
   * Stance length along the line as a multiple of the shoulder width:
   * kickboxing guides put the feet a little more than shoulder width apart,
   * Muay Thai guides no wider than the shoulders; the film takes 1.2 inside
   * that coaching range of 1.0 to 1.3.
   */
  export const LENGTH_SHARE: number = 1.2;

  /**
   * One ring step as a share of the stance length: the following foot
   * restores the stance without crossing (IBA pages 36-39), so a step is at
   * most half the stance; the film takes the half.
   */
  export const STEP_SHARE: number = 0.5;

  /**
   * The longest entry of one strike as a share of the stance length: a
   * step-in or lunge whose lead foot travels up to a full stance while the
   * rear foot drags behind to restore it (IBA stepping jab); the film takes
   * the full stance.
   */
  export const ENTRY_SHARE: number = 1;

  /**
   * Vertical bounce of the guard's rhythm, as a share of the stance's knee
   * drop: kickboxers keep a light rhythmic bounce through the knees between
   * exchanges; a third of the stance drop keeps it visible without leaving
   * the stance (film reading of the coaching).
   */
  export const RHYTHM_SHARE: number = 1 / 3;

  /**
   * Lead-glove pump of the guard's rhythm, as a share of the arm reach: the
   * pawing lead hand that measures distance and shows small feints between
   * exchanges; a fifth of the reach (film reading of the coaching).
   */
  export const PUMP_SHARE: number = 0.2;

  /**
   * Body turn of the orthodox stance from the line to the opponent, radians:
   * the IBA p.34 overhead feet show the lead shoulder forward; the film reads
   * the turn as thirty degrees, a stated reading of the drawing.
   */
  export const TURN: number = (30 * Math.PI) / 180;

  /** Chin tuck as cervical flexion, degrees: "chin tucked" read as the cervical range's lower third. */
  export const CHIN_TUCK: number = 12;

  /**
   * The stance length along the line, metres: {@link LENGTH_SHARE} shoulder
   * widths, the kickboxing coaching convention.
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
    return LENGTH_SHARE * 2 * measure.shoulderHalfWidth;
  }

  /**
   * One ring step: {@link STEP_SHARE} of the stance length, so the following foot restores the stance without crossing.
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
    return STEP_SHARE * length(measure);
  }

  /**
   * The longest entry of one strike: the step-in or lunge that carries the
   * body from where it stands into that strike's contact range.
   *
   * @param measure The fighter's measure.
   * @returns Metres.
   * @evidence docs/research/kickboxing/ring-generalship.md#step The entry is at most a stance length.
   * @evidence contracts/development/common.md#meaningful-documentation States the law.
   * @evidence contracts/development/implementation.md#principled-implementation A share of the stance length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the stance length.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The studied entry.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function entry(measure: IFighterMeasure): number {
    return ENTRY_SHARE * length(measure);
  }

  /**
   * The guard's rhythm inside a free interval between busy actions: a
   * bounce through the knees and a pawing lead glove on every other beat, a
   * whole number of beats near the step cadence, zero with zero slope at both
   * ends so it joins every strike, answer and phase without a jump.
   *
   * @param measure The fighter's measure.
   * @param seconds Seconds since the free interval began.
   * @param span The free interval's length, seconds.
   * @param period Seconds per beat.
   * @returns The extra knee drop and the lead glove's forward pump, metres.
   * @evidence docs/research/kickboxing/ring-generalship.md#stance The guard keeps its rhythm between exchanges.
   * @evidence contracts/development/common.md#meaningful-documentation States the shape and its ends.
   * @evidence contracts/development/implementation.md#principled-implementation Squared sines of whole beats over the interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the stance drop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record.
   * @evidence contracts/development/behaviors.md#studied-laws The studied rhythm.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function rhythm(
    measure: IFighterMeasure,
    seconds: number,
    span: number,
    period: number,
  ): { drop: number; pump: number } {
    if (!(span > 0) || seconds <= 0 || seconds >= span)
      return { drop: 0, pump: 0 };
    const beats: number = Math.max(1, Math.round(span / period));
    const phase: number = (Math.PI * beats * seconds) / span;
    const bounce: number = Math.sin(phase) ** 2;
    const pump: number = Math.sin(phase / 2) ** 2 * bounce;
    return {
      drop: RHYTHM_SHARE * sink(measure) * bounce,
      pump: PUMP_SHARE * measure.armReach * pump,
    };
  }

  /**
   * The stance switch at a share of its movement: the feet exchange lead and
   * rear on their own hip tracks, so they pass without crossing, and the body
   * turn mirrors with them into the southpaw stance at the half, then back to
   * orthodox by the end; each half is one quick hop of both feet, as in the
   * switch that sets up the switch kick.
   *
   * @param measure The fighter's measure.
   * @param share Progress through the switch in [0, 1].
   * @returns Body-frame ankle points, the body turn in radians and the feet's lift share in [0, 1].
   * @evidence docs/research/kickboxing/ring-generalship.md#stance The switch exchanges lead and rear feet without crossing.
   */
  export function switching(
    measure: IFighterMeasure,
    share: number,
  ): {
    feet: Record<"left" | "right", IAutoMovieVector3>;
    yaw: number;
    lift: number;
  } {
    const p: number = 2 * Math.max(0, Math.min(1, share));
    const half: number = p <= 1 ? p : 2 - p;
    // Smoothstep of each hop's progress toward the mirrored stance.
    const mirrored: number = half * half * (3 - 2 * half);
    const stance = feet(measure);
    const swap = (q: IAutoMovieVector3): IAutoMovieVector3 => ({
      ...q,
      x: q.x * (1 - 2 * mirrored),
    });
    return {
      feet: { left: swap(stance.left), right: swap(stance.right) },
      yaw: TURN * (1 - 2 * mirrored),
      lift: Math.sin(Math.PI * (p % 1)),
    };
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
   * The root drop that bends the legs to a knee flexion: the straight leg's
   * height less the height of the bent leg's chord, which leans over the
   * floor run from its hip joint to its ankle, so a spread stance sinks
   * further than feet under the hips for the same knee bend.
   *
   * @param measure The fighter's measure.
   * @param flexion Knee flexion, degrees.
   * @param run Floor distance from the hip joint to the ankle, metres; 0 for feet under the hips.
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
  export function drop(
    measure: IFighterMeasure,
    flexion: number,
    run: number = 0,
  ): number {
    const { thigh, shank } = measure;
    const knee: number = Math.PI - (flexion * Math.PI) / 180;
    const chord: number = Math.sqrt(
      thigh * thigh + shank * shank - 2 * thigh * shank * Math.cos(knee),
    );
    return thigh + shank - Math.sqrt(Math.max(0, chord * chord - run * run));
  }

  /**
   * The floor run from each hip joint to its planted ankle in the guard: the
   * stance turn carries the lead hip forward and the rear hip back, and each
   * ankle stands half a stance along the line on its own hip track.
   *
   * @param measure The fighter's measure.
   * @returns Metres, the same for both legs.
   * @evidence docs/research/kickboxing/ring-generalship.md#stance Stance length and the turn of the stance.
   */
  export function run(measure: IFighterMeasure): number {
    const ankle: IAutoMovieVector3 = feet(measure).left;
    const hip: IAutoMovieVector3 = turn(
      { x: 0, y: 0, z: measure.hipHalfWidth },
      TURN,
    );
    return Math.hypot(ankle.x - hip.x, ankle.z - hip.z);
  }

  /**
   * The guard's root drop: the stance's knee flexion over the stance's
   * floor run, so the displayed knees bend by {@link KNEE_FLEXION}.
   *
   * @param measure The fighter's measure.
   * @returns Metres.
   * @evidence docs/research/kickboxing/ring-generalship.md#stance Knees bent inside the translated range.
   */
  export function sink(measure: IFighterMeasure): number {
    return drop(measure, KNEE_FLEXION, run(measure));
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
    const lowered: number = sink(measure);
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
      thoracic: {
        flexion: CHIN_TUCK / 2,
        lateralFlexion: 0,
        rotation: toDegrees(TURN) / 2,
      },
      lumbar: { flexion: 0, lateralFlexion: 0 },
      cervical: {
        flexion: CHIN_TUCK,
        lateralFlexion: 0,
        rotation: toDegrees(TURN) / 2,
      },
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
