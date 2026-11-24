import {
  ANKLE_DORSIFLEXION,
  DEFAULT_HUMANOID_ROM,
  Vector3,
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
import { walkLegRise } from "./walkLegRise";
import { walkRockerReachBoundary } from "./walkRockerReachBoundary";

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
      walkLegRise(
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
            walkLegRise.REACHED,
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
   * The room left to a stance's ankle before its dorsal limit, degrees, under
   * which a stepping foot's heel begins to rise (provisional): the heel is
   * leaving the floor by 10° of dorsiflexion (Perry and Burnfield), a third of
   * the way into this rounding under the 18° limit this body keeps, and the
   * rounding is wide enough that the step past the fold is crossed in a
   * stance's few hundredths of a second without a jolt at the knee.
   */
  export const ROCKER: number = 12;

  /**
   * The least hip-to-ankle distance, metres, a knee angle is divided by: a
   * nanometre, under which hip and ankle coincide to every pose's resolution
   * and the angle is undefined.
   */
  const COINCIDENT: number = 1e-9;
}
