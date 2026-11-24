import {
  ANKLE_DORSIFLEXION,
  DEFAULT_HUMANOID_ROM,
  Vector3,
  minimumJerk,
  smoothMinimum,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareWalkLegLean } from "./prepareWalkLegLean";
import { walkLegLow } from "./walkLegLow";
import { walkRockerReachBoundary } from "./walkRockerReachBoundary";

/** The alternatives of `RiseStale`'s site. */
type RiseStale = -1 | 0 | 1;

/** The alternatives of `PLANTARBone`'s site. */
type PLANTARBone = "leftFoot" | "rightFoot";

/**
 * The two-bone geometry of a stepping leg, read without solving it: where the
 * knee's bend puts the shank and the thigh for a hip and an ankle, by the law
 * of cosines on the segment lengths.
 */
export namespace walkLeg {
  /**
   * Degrees a foot keeps inside the ankle's plantar limit (`PLANTAR`) and its
   * dorsal one, loaded or unloaded (`ANKLE_DORSIFLEXION`).
   */
  export const ANKLE: number = 2;

  /**
   * The ankle's plantarflexion limit, degrees: the lesser of the two feet's in
   * the range table (`DEFAULT_HUMANOID_ROM`, the AAOS norm of 50 as
   * `ANKLE_DORSIFLEXION` relays it).
   */
  export const PLANTAR: number = Math.min(
    ...(["leftFoot", "rightFoot"] as const).map((bone: PLANTARBone): number => {
      const flexion: IAutoMovieAngleRange | null | undefined =
        DEFAULT_HUMANOID_ROM[bone]?.flexion;
      if (flexion === null || flexion === undefined)
        throw new Error(`The range-of-motion table gives ${bone} no flexion`);
      return -flexion.min;
    }),
  );

  /**
   * Fixed body/heading preparation of the shank's forward lean from vertical
   * along a heading (`prepareWalkLegLean`).
   */
  export const prepareLean: typeof prepareWalkLegLean = prepareWalkLegLean;

  /**
   * Prepare the fixed lengths of a knee's thigh-to-reach angle.
   *
   * @param body The unchanged measured thigh/shank geometry, metres.
   * @returns The same cosine-law angle in radians for every actual hip-to-ankle
   *   reach in metres.
   */
  export function prepareBehind(
    body: IAutoMovieMotionHumanBody,
  ): (reach: number) => number {
    const a: number = body.measure.thigh;
    const b: number = body.measure.shank;
    const aa: number = a ** 2;
    const bb: number = b ** 2;
    const span: number = a + b;
    const twice: number = 2 * a;
    return (reach: number): number => {
      const d: number = Math.min(reach, span);

      // A hip on its ankle leaves the angle undefined; the denominator is held
      // off zero (`COINCIDENT`) and the clamp then reads such a leg folded.
      return Math.acos(
        Math.min(
          1,
          Math.max(-1, (aa + d ** 2 - bb) / (twice * Math.max(d, COINCIDENT))),
        ),
      );
    };
  }

  /**
   * How far a leg's thigh trails behind vertical in the pelvis's sagittal
   * plane: the hip-to-ankle line's angle less the knee's.
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param yaw The pelvis's heading, degrees.
   * @returns Degrees, positive trailing.
   */
  export function trailing(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    yaw: number,
  ): number {
    return prepareTrailing(body, yaw)(hip, ankle);
  }

  /**
   * Prepare one pelvis heading for repeated trailing-thigh queries.
   *
   * @param body The unchanged body's measured leg lengths.
   * @param yaw The unchanged pelvis heading, degrees.
   * @returns The same trailing-positive degree angle for each actual
   *   world-metre hip and ankle.
   */
  export function prepareTrailing(
    body: IAutoMovieMotionHumanBody,
    yaw: number,
  ): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number {
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const bend: ReturnType<typeof prepareBehind> = prepareBehind(body);
    return (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number =>
      // The hip-to-ankle line's components and its length (`Vector3.distance`
      // is the length of the difference), read without a vector record.
      ((Math.atan2(
        -((ankle.x - hip.x) * forward.x + (ankle.z - hip.z) * forward.z),
        -(ankle.y - hip.y),
      ) -
        bend(Vector3.distance(ankle, hip))) *
        180) /
      Math.PI;
  }

  /**
   * Prepare one exact heading through a foot's repeated ankle-clearance trials:
   * a foot that bears no weight, its rotation kept inside the unloaded ankle's
   * range relative to its shank (`ANKLE_DORSIFLEXION.unloaded` and `PLANTAR`),
   * less `ANKLE`.
   *
   * @param body The measured leg geometry, fixed through the trials.
   * @param heading The foot heading in degrees at this trial loop's start.
   * @returns The rotation clamp for a hip, an ankle and a foot rotation; a
   *   rotation of another heading prepares its own lean instead of reusing the
   *   fixed-heading geometry.
   */
  export function prepareAnkleRange(
    body: IAutoMovieMotionHumanBody,
    heading: number,
  ): (
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ) => IAutoMovieQuaternion {
    const prepared: ReturnType<typeof prepareWalkLegLean> = prepareWalkLegLean(
      body,
      heading,
    );
    return (
      hip: IAutoMovieVector3,
      ankle: IAutoMovieVector3,
      rotation: IAutoMovieQuaternion,
    ): IAutoMovieQuaternion => {
      const direction: ReturnType<typeof HumanFoot.headingPitch> =
        HumanFoot.headingPitch(rotation);
      return ankleRangeAt(
        hip,
        ankle,
        rotation,
        direction,
        Object.is(direction.heading, heading)
          ? prepared
          : prepareWalkLegLean(body, direction.heading),
      );
    };
  }

  /**
   * The unloaded ankle's clamp of a foot's pitch against its shank's lean,
   * under a prepared heading.
   */
  function ankleRangeAt(
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    direction: ReturnType<typeof HumanFoot.headingPitch>,
    lean: ReturnType<typeof prepareWalkLegLean>,
  ): IAutoMovieQuaternion {
    const shank: number = lean(hip, ankle);
    const pitch: number = direction.pitch;
    const clamped: number = Math.min(
      -shank + ANKLE_DORSIFLEXION.unloaded - ANKLE,
      Math.max(-shank - PLANTAR + ANKLE, pitch),
    );
    return clamped === pitch
      ? rotation
      : HumanFoot.rotation(direction.heading, clamped);
  }

  /**
   * The pitch a planted foot takes about its toes' joint once its shank leans
   * past the ankle's dorsal limit: the forefoot rocker begins where the ankle
   * can bend no further (Perry and Burnfield), so the ball never slides.
   *
   * The room is the ankle's distance from its dorsal limit, less `ANKLE`, and
   * the rise is `rise` on it.
   *
   * @param body The body.
   * @param side The foot.
   * @param hip The hip joint, world metres.
   * @param pivot The toes' joint the foot turns about, world metres.
   * @param heading The foot's heading, degrees.
   * @param pitch The asked pitch, degrees, negative toes-down.
   * @param width The room, degrees, under which the heel begins to rise; zero
   *   keeps the asked pitch until the limit itself.
   * @param dorsal The ankle's dorsal limit, degrees: an unloaded foot's
   *   (`ANKLE_DORSIFLEXION.unloaded`) when absent, more as the foot takes
   *   weight (`dorsal`).
   * @returns The pitch, no higher than the asked one.
   */
  export function heelRise(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    hip: IAutoMovieVector3,
    pivot: IAutoMovieVector3,
    heading: number,
    pitch: number,
    width: number,
    dorsal: number = ANKLE_DORSIFLEXION.unloaded,
  ): number {
    return prepareHeelRise(
      body,
      side,
      pivot,
      heading,
      width,
      dorsal,
    )(hip, pitch);
  }

  /**
   * The ankle's dorsal limit of a foot by its contact state, degrees: a foot
   * that bears any share of the body's weight the weight-bearing limit (39,
   * Konor, Morton, Eckerson and Grindstaff 2012, Int J Sports Phys Ther
   * 7(3):279, the weight-bearing lunge), one that bears none the passive one
   * (20, the AAOS norm), both from `ANKLE_DORSIFLEXION`. The limit is binary,
   * as the take's range audit reads it by the contact window: the studies
   * measure the two conditions, and no study relates the limit to a partial
   * load, so none is interpolated between them.
   *
   * @param share The share of the body's weight the foot bears, 0 to 1.
   * @returns Degrees.
   */
  export function dorsal(share: number): number {
    return share > 0 ? ANKLE_DORSIFLEXION.loaded : ANKLE_DORSIFLEXION.unloaded;
  }

  /**
   * Prepare one fixed sole contact's rocker search for varying hips and
   * pitches.
   *
   * @param body The body's fixed segment lengths and foot socket.
   * @param side The foot.
   * @param pivot The fixed toe-joint contact, world metres.
   * @param heading The fixed foot heading, degrees.
   * @param width The fixed dorsal-room onset, degrees.
   * @param dorsal The ankle's fixed dorsal limit, degrees; the unloaded foot's
   *   when absent (`dorsal`).
   * @returns The heel-rise rule for a world-space hip, asked pitch and optional
   *   current dorsal limit.
   */
  export function prepareHeelRise(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    pivot: IAutoMovieVector3,
    heading: number,
    width: number,
    dorsal: number = ANKLE_DORSIFLEXION.unloaded,
  ): (hip: IAutoMovieVector3, pitch: number, dorsalAt?: number) => number {
    const at: (degrees: number) => IAutoMovieVector3 = HumanFoot.prepareAnkle(
      body,
      side,
      "mtp",
      pivot,
      heading,
    );
    const lean: ReturnType<typeof prepareWalkLegLean.bounded> =
      prepareWalkLegLean.bounded(body, heading);
    const span: number = body.measure.thigh + body.measure.shank;
    let entry: ReturnType<typeof walkRockerReachBoundary> | undefined;
    return (
      hip: IAutoMovieVector3,
      pitch: number,
      dorsalAt: number = dorsal,
    ): number =>
      rise(
        (degrees: number): number => {
          // The ankle record is the reader's own, read here before its next pitch.
          const shank: number | undefined = lean(hip, at(degrees));
          return shank === undefined
            ? -Infinity
            : roomValue(shank, degrees, dorsalAt);
        },
        pitch,
        width,
        true,
        (degrees: number): boolean => Vector3.distance(at(degrees), hip) > span,
        (low: number, high: number): number | undefined =>
          (entry ??= walkRockerReachBoundary(at, span))(
            hip,
            low,
            high,
            REACHED,
          ),
      );
  }

  /**
   * The room a planted foot's ankle keeps before its dorsal limit (`dorsal`,
   * less `ANKLE`) at a shank's lean and a pitch, degrees: what `heelRise`
   * keeps.
   */
  function roomValue(lean: number, pitch: number, dorsal: number): number {
    return -lean + dorsal - ANKLE - pitch;
  }

  /**
   * The pitch a planted foot's heel rises to so that a room it must keep, which
   * rising the heel buys, never runs out, with the onset rounded.
   *
   * The rounding is done on the room, not the pitch: the foot keeps the room
   * its asked pitch has while that is `width` or more, never less than none,
   * and the smooth maximum of the two in between (the engine's `smoothMinimum`,
   * negated). A straight knee folds the room: the first degrees of heel rise
   * bend the knee and lean the shank faster than they open the ankle, so the
   * room first dips and only then grows, and the pitch that has a given room
   * lies past the dip, a finite step from the asked one. The pitch is therefore
   * searched past the dip: the room is walked down from the asked pitch in
   * `SCAN` steps to its first low, which the rise meets first (the room is not
   * unimodal over the whole range: past the first dip it may dip again), and
   * the kept room is bracketed beyond it, no steeper than `STEEPEST`, from the
   * step before the room grew, or from the low itself by golden-section search
   * where that step keeps the room. A pitch whose ankle lies beyond the leg's
   * reach has no room at all (`-Infinity`): it is no stance, and counting a
   * lean read off a leg stretched past its length made the room cross the kept
   * one twice, the pitch jumping between the crossings as the hip moved by
   * nanometres. An asked pitch the leg cannot stand on is first raised to the
   * least rise that brings the ankle within reach, and the rule goes on from
   * there. The foot moves from its asked pitch to the kept room's on a
   * minimum-jerk weight (Flash and Hogan 1985) as the asked room runs from
   * `width` down to none, so the heel's rate is continuous where the rule takes
   * over or lets go. The step past the dip is crossed in the time the asked
   * room takes to run through `width`, so its acceleration falls with the
   * square of the width.
   *
   * A room that only grows as the heel rises has no dip, and the pitch that
   * keeps the smooth maximum is already continuous in rate with the least
   * acceleration a rounding of that width can have; the weight would only
   * steepen it. Such a rule says so with `folds` and takes that pitch itself.
   *
   * @param room The room a pitch leaves, degrees; `Infinity` where the rule
   *   asks nothing of that pitch, `-Infinity` where the leg cannot stand on
   *   it.
   * @param pitch The asked pitch, degrees, negative toes-down.
   * @param width The room, degrees, under which the heel begins to rise; zero
   *   keeps the asked pitch until the room is none.
   * @param folds Whether the room may dip before it grows as the heel rises.
   * @param beyond The native reach-only reading equivalent to negative infinite
   *   room, when available.
   * @param boundary The native circular reach boundary rounded onto the
   *   original bracket lattice, if certified.
   * @returns The pitch, no higher than the asked one.
   */
  export function rise(
    room: (degrees: number) => number,
    pitch: number,
    width: number,
    folds: boolean = true,
    beyond?: (degrees: number) => boolean,
    boundary?: (low: number, high: number) => number | undefined,
  ): number {
    // An asked pitch the leg cannot stand on is first raised to the least
    // rise that brings its ankle within the leg's reach, which is continuous
    // with the asked pitch as the reach is lost; the rule then reads that
    // pitch as the asked one.
    let asked: number = room(pitch);
    if (asked === -Infinity) {
      const unreachable =
        beyond ?? ((degrees: number): boolean => room(degrees) === -Infinity);
      if (unreachable(-STEEPEST)) return -STEEPEST;
      pitch =
        boundary?.(-STEEPEST, pitch) ??
        reachBracket(-STEEPEST, pitch, unreachable);
      asked = room(pitch);
    }
    if (asked >= width || pitch <= -STEEPEST) return pitch;
    const kept: number =
      width > 0 ? -smoothMinimum(-asked, 0, width) : Math.max(asked, 0);
    // The dip is the first low of the room as the heel rises from the asked
    // pitch: walked down in `SCAN` steps until the room grows again, so it is
    // the one the rise meets first. It is wanted only as an end of the kept
    // room's bracket that does not keep the room, which the step before the
    // room grew is when its room is under the kept one: the room has one low
    // between the steps around it (`SCAN`), so it stays under that step's up
    // to the low. Any other walk has its low narrowed by golden section.
    let low: number = -STEEPEST;
    let high: number = pitch;
    if (folds) {
      let far: number = -STEEPEST;
      let near: number = pitch;
      let before: number = asked;
      let lowest: number = pitch;
      let grew: boolean = false;
      for (let at: number = pitch - SCAN; at > -STEEPEST; at -= SCAN) {
        const value: number = room(at);
        // Pitches the leg cannot stand on lie before the dip, not in it.
        if (value > before && before > -Infinity) {
          far = Math.max(-STEEPEST, at);
          near = Math.min(pitch, at + 2 * SCAN);
          grew = true;
          break;
        }
        before = value;
        lowest = at;
      }
      if (grew && before < kept) high = lowest;
      else {
        [far, near] = walkLegLow(room, far, near);
        high = (far + near) / 2;
      }
    }
    // The kept room's pitch, bracketed between a pitch that keeps it and one
    // that does not, to `RESOLVED`: a false-position step where both ends'
    // rooms are finite, the stale end's value halved when it is kept twice
    // (the Illinois rule, Dowell and Jarratt 1971), and a bisection step
    // where an end has no room to read (a rule that asks nothing, a leg that
    // cannot stand), so the bracket closes superlinearly on a smooth room
    // and never slower than by halves.
    let above: number = room(low) - kept;
    if (above >= 0) {
      let below: number = -Infinity;
      let stale: RiseStale = 0;
      for (let k: number = 0; k < 2 * HALVINGS && high - low > RESOLVED; k++) {
        const secant: number =
          Number.isFinite(above) && Number.isFinite(below)
            ? low + ((high - low) * above) / (above - below)
            : NaN;
        const middle: number =
          secant > low && secant < high ? secant : (low + high) / 2;
        const value: number = room(middle) - kept;
        if (value < 0) {
          high = middle;
          below = value;
          if (stale === 1) above /= 2;
          stale = 1;
        } else {
          low = middle;
          above = value;
          if (stale === -1) below /= 2;
          stale = -1;
        }
      }

      // A room with a kink can hold one end still; halves close what is left.
      for (let k: number = 0; k < HALVINGS && high - low > RESOLVED; k++) {
        const middle: number = (low + high) / 2;
        if (room(middle) < kept) high = middle;
        else low = middle;
      }
    }
    if (!folds) return low;
    const share: number =
      width > 0 ? Math.min(1, Math.max(0, (width - asked) / width)) : 1;
    return pitch + (low - pitch) * minimumJerk.share(share);
  }

  /**
   * Lower endpoint of the original reach bracket for a non-circular or
   * unverified input.
   */
  function reachBracket(
    low: number,
    high: number,
    unreachable: (pitch: number) => boolean,
  ): number {
    while (high - low > REACHED) {
      const middle: number = (high + low) / 2;
      if (unreachable(middle)) high = middle;
      else low = middle;
    }
    return low;
  }

  /**
   * The room left to a stance's ankle before its dorsal limit, degrees, under
   * which a stepping foot's heel begins to rise (provisional): the heel is
   * leaving the floor by 10° of dorsiflexion (Perry and Burnfield), a third of
   * the way into this rounding under the 18° limit this body keeps, and the
   * rounding is wide enough that the step past the fold is crossed in a
   * stance's few hundredths of a second without a jolt at the knee.
   */
  export const ROCKER: number = 12;

  /**
   * The width, degrees, a kept room's pitch is bracketed to: under a hundred
   * nanometres of any point of a foot, the resolution thirty halvings of the
   * widest bracket gave.
   */
  export const RESOLVED: number = 1e-7;

  /**
   * The width, degrees, to which the least standable pitch of an unreachable
   * asked one is bisected: a millionth of a degree turns a point of a 0.3 m
   * foot by 5 nm, under the micrometre a pose is read to, and ⌈log₂(75 / 1e-6)⌉
   * = 27 halvings reach it from the widest bracket.
   */
  const REACHED: number = 1e-6;

  /**
   * The least hip-to-ankle distance, metres, a knee angle is divided by: a
   * nanometre, under which hip and ankle coincide to every pose's resolution
   * and the angle is undefined.
   */
  const COINCIDENT: number = 1e-9;

  /**
   * The step, degrees, in which `rise` walks the room down from the asked pitch
   * to find its first low: half a degree, under which the room of a leg near
   * straight has no second low.
   */
  export const SCAN: number = 0.5;

  /**
   * The steepest heel rise of a planted foot, degrees toes-down (provisional):
   * past it the foot would stand on its toe tips.
   */
  export const STEEPEST: number = 75;

  /**
   * The halvings that take the widest bracket, `STEEPEST` degrees, under
   * `RESOLVED`: ⌈log₂(75 / 1e-7)⌉ = 30. The Illinois steps are allowed twice as
   * many, since a stale end is halved at least every second step (Dowell and
   * Jarratt 1971), and the bisection that follows closes whatever a kink left
   * in as many again.
   */
  const HALVINGS: number = Math.ceil(Math.log2(STEEPEST / RESOLVED));
}
