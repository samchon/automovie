import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
} from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { QuadrupedHoofTrack } from "./QuadrupedHoofTrack";
import type { rideQuadruped } from "./rideQuadruped";

/** Degrees per radian. */
const DEGREE: number = 180 / Math.PI;

/**
 * Lateral dressage figures: the body heading turned away from the travel
 * heading on one course leg, entered from and recovered to straight travel.
 *
 * The figures follow the USEF Dressage Rules DR111 and DR112 (2023,
 * https://www.usdf.org/EduDocs/Training/2023%20Work%20on%20Two%20Tracks,%20Lateral%20Movements.pdf),
 * which follow the FEI's. In shoulder-in the inside hind steps in the track of
 * the outside fore while the inside fore crosses in front of the outside fore.
 * In leg-yielding and half-pass the legs on the side away from the movement
 * cross in front of the others; leg-yielding along the wall is ridden at about
 * 35 degrees to the direction of movement, and the half-pass keeps the body
 * nearly parallel to the long side while it travels the diagonal. In the
 * pirouette the forehand moves round the haunches on a circle whose radius is
 * the horse's length, the inside hind foot forming the pivot and the outside
 * hind moving round it.
 *
 * The trunk is one rigid body, so the bend and the poll flexion that tell
 * leg-yielding from half-pass are not represented; both are the same heading
 * offset with crossing legs. Shoulder-in's 30 degrees in DR111 includes the
 * bend; a rigid trunk puts its inside hind in its outside fore's track at the
 * angle the two stance centres set, which is used instead.
 */
export namespace EquineLateral {
  /**
   * The largest heading offset admitted for leg-yielding and half-pass: the
   * "about 35 degrees" of DR111.2.b, the largest angle the lateral movements
   * prescribe.
   */
  export const MAXIMUM: number = 35;

  /** The side the horse moves toward, relative to its own body. */
  export type Side = "left" | "right";

  /** The two figures whose angle the author states. */
  export type TwoTrackKind = "leg-yield" | "half-pass";

  /**
   * Shoulder-in on a straight leg: the forehand brought in so three tracks
   * show.
   */
  export interface IShoulderIn {
    /** The discriminator. */
    kind: "shoulder-in";
    /**
     * The side the horse moves toward relative to its body; the bend, and so
     * the inside, is the other side.
     */
    toward: Side;
    /**
     * Seconds of the entry from straight travel at the leg's start and of the
     * recovery at its end, positive.
     */
    blend: number;
  }

  /** Leg-yielding or half-pass on a straight leg at an authored angle. */
  export interface ITwoTrack {
    /** The figure. */
    kind: TwoTrackKind;
    /** The side the horse moves toward relative to its body. */
    toward: Side;
    /**
     * Degrees between the body heading and the travel heading, above 0 and at
     * most `MAXIMUM`.
     */
    angle: number;
    /** Seconds of the entry and of the recovery, positive. */
    blend: number;
  }

  /** A pirouette on a turn leg about the inside hind hoof. */
  export interface IPirouette {
    /** The discriminator. */
    kind: "pirouette";
    /** Seconds of the entry and of the recovery, positive. */
    blend: number;
  }

  /** A lateral figure on one course leg. */
  export type Technique = IShoulderIn | ITwoTrack | IPirouette;

  /** One admitted figure on the film clock. */
  export interface IWindow {
    /** The figure's name, for its instants. */
    kind: Technique["kind"];
    /** Film second the leg begins. */
    from: number;
    /** Film second the leg ends. */
    to: number;
    /** Seconds of each ramp. */
    blend: number;
    /**
     * Full heading offset of the body from the travel heading, degrees,
     * positive to the left.
     */
    yaw: number;
  }

  /**
   * Admit one figure on its leg and fix its heading offset.
   *
   * @param archetype The source archetype name.
   * @param index The leg's zero-based index.
   * @param leg The leg.
   * @param technique The figure.
   * @param plan The admitted course plan.
   * @param hooves The neutral hoof endpoints in model metres.
   * @param centred The stance centres of a moving limb: each neutral hoof
   *   brought fore and aft under its attachment, in model metres.
   * @returns The admitted window.
   * @throws {AutoMovieArchetypeRefusal} For a leg of the wrong shape, a
   *   reversed or graded leg, an angle outside (0, `MAXIMUM`], a blend that
   *   does not fit twice in the leg, or a pirouette radius the pivot cannot
   *   hold.
   */
  export function admit(
    archetype: string,
    index: number,
    leg: rideQuadruped.ILeg,
    technique: Technique,
    plan: AutoMovieArchetypeCourse.IPlan,
    hooves: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>
    >,
    centred: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>
    >,
  ): IWindow {
    const span: AutoMovieArchetypeCourse.ILegSpan = plan.legSpans[index]!;
    const from: number = plan.when(span.from);
    const to: number = plan.when(span.from + span.span);
    if (leg.reverse === true || (leg.rise ?? 0) !== 0)
      refuse("A lateral figure needs a level forward leg");
    if (!(technique.blend > 0) || 2 * technique.blend > to - from)
      refuse("The entry and the recovery must fit inside the leg");
    let yaw: number;
    if (technique.kind === "pirouette") {
      if (leg.kind !== "turn")
        refuse("A pirouette needs a turn leg about the haunches");
      const left: boolean = leg.angle > 0;
      const pivot: IAutoMovieVector3 = left
        ? hooves.leftHind
        : hooves.rightHind;
      const reach: number = Math.hypot(pivot.x, pivot.z);
      const width: number = Math.abs(hooves.leftHind.x - hooves.rightHind.x);
      if (!(leg.radius >= reach && leg.radius - reach <= width))
        refuse(
          `A pirouette radius must lie between the pivot hoof's ${reach} m and that plus the ${width} m hind track width`,
        );
      const bearing: number = Math.atan2(pivot.x, pivot.z) * DEGREE;
      yaw = (left ? 90 : -90) - bearing;
    } else {
      if (leg.kind !== "straight")
        refuse("Shoulder-in, leg-yielding and half-pass need a straight leg");
      if (technique.toward !== "left" && technique.toward !== "right")
        refuse("Name the side the horse moves toward");
      const sign: number = technique.toward === "left" ? -1 : 1;
      if (technique.kind === "shoulder-in") {
        const fore: IAutoMovieVector3 =
          technique.toward === "left" ? centred.leftFore : centred.rightFore;
        const hind: IAutoMovieVector3 =
          technique.toward === "left" ? centred.rightHind : centred.leftHind;
        yaw = -Math.atan2(fore.x - hind.x, fore.z - hind.z) * DEGREE;
      } else {
        if (!(technique.angle > 0 && technique.angle <= MAXIMUM))
          refuse(`The angle must lie above 0 and at most ${MAXIMUM} degrees`);
        yaw = sign * technique.angle;
      }
    }
    return { kind: technique.kind, from, to, blend: technique.blend, yaw };

    /** Report the leg that cannot carry the figure. */
    function refuse(reason: string): never {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `legs[${index}].equineFootwork`,
        value: technique,
        feasible: null,
        reason,
        fix: "Choose a leg and angle the figure admits.",
      });
    }
  }

  /**
   * The body's heading offset from the travel heading at a film second.
   *
   * @param windows The admitted figures.
   * @param seconds The film second.
   * @returns Degrees, positive to the left; zero outside every figure.
   */
  export function heading(
    windows: readonly IWindow[],
    seconds: number,
  ): number {
    for (const window of windows) {
      if (seconds <= window.from || seconds >= window.to) continue;
      return window.yaw * entered(window, seconds);
    }
    return 0;
  }

  /**
   * The crossover of leg-yielding and half-pass: the stances of the legs away
   * from the movement, shifted toward it in the body frame so each lands across
   * its partner's track.
   *
   * DR111.2.b and DR112.2.b have the outside legs cross in front of the inside
   * legs. A rigid trunk carries each hoof sideways in the body frame by D =
   * travel · sin|ψ| over one stance, ψ the heading offset, so a footprint
   * centred under its neutral point lands D/2 toward the movement and leaves
   * D/2 away from it. The crossing hoof's stance is therefore shifted toward
   * the movement by Δ = max(0, W − D + 2r), W the pair's neutral track width
   * and r its pastern's radius, so it lands at least one hoof breadth beyond
   * the point its partner leaves from; a figure's entry and recovery scale Δ by
   * the same minimum-jerk share as the heading. The shift is taken up by limb
   * adduction of about asin(Δ / L), L the attachment-to-hoof length. That
   * adduction is authored and provisional: a search for "horse forelimb
   * adduction abduction angle degrees shoulder half-pass leg-yield kinematics
   * range of motion hip adduction equine" found no measured equine shoulder or
   * hip adduction range, only fetlock adduction-abduction of 13 ± 7 degrees at
   * walk and 18 ± 7 at trot and a passive stifle adduction of 6 ± 2.7 degrees,
   * neither of which bounds the shoulder or hip.
   * `AutoMovieArchetypeEquineJointLimits` therefore holds no such bound; the
   * limb reach and the ride's pose fit refuse a shift they cannot take.
   *
   * @param windows The admitted figures.
   * @param limbs The neutral limb points in model metres, the hoof endpoint
   *   last.
   * @param parts The neutral model parts, read for each pastern's radius.
   * @returns The stance shift of a two-track figure's crossing legs, or
   *   undefined when the ride has no leg-yield or half-pass.
   */
  export function crossing(
    windows: readonly IWindow[],
    limbs: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, readonly IAutoMovieVector3[]>
    >,
    parts: readonly IAutoMovieModelPart[],
  ): QuadrupedHoofTrack.Crossing | undefined {
    const crossed: readonly IWindow[] = windows.filter(
      (window: IWindow): boolean =>
        window.kind === "leg-yield" || window.kind === "half-pass",
    );
    if (crossed.length === 0) return undefined;

    /** The pastern radius, metres, of one limb. */
    const radius = (limb: AutoMovieArchetypeQuadrupedBody.Limb): number => {
      const part: IAutoMovieModelPart | undefined = parts.find(
        (candidate: IAutoMovieModelPart): boolean =>
          candidate.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
      );
      if (
        part?.geometry.type !== "primitive" ||
        !("radius" in part.geometry.shape)
      )
        throw new RangeError(`The ${limb} pastern has no radius`);
      return part.geometry.shape.radius;
    };
    const fore: IPair = {
      width: Math.abs(limbs.leftFore[4]!.x - limbs.rightFore[4]!.x),
      radius: Math.max(radius("leftFore"), radius("rightFore")),
    };
    const hind: IPair = {
      width: Math.abs(limbs.leftHind[4]!.x - limbs.rightHind[4]!.x),
      radius: Math.max(radius("leftHind"), radius("rightHind")),
    };
    return (
      from: number,
      to: number,
      travel: number,
      front: boolean,
    ): QuadrupedHoofTrack.ICross | undefined => {
      const middle: number = (from + to) / 2;
      const window: IWindow | undefined = crossed.find(
        (candidate: IWindow): boolean =>
          middle > candidate.from && middle < candidate.to,
      );
      if (window === undefined) return undefined;
      const share: number = entered(window, middle);
      const pair: IPair = front ? fore : hind;
      const lateral: number =
        Math.abs(travel) * Math.sin(Math.abs(window.yaw * share) / DEGREE);
      return {
        toward: window.yaw < 0 ? 1 : -1,
        shift: share * Math.max(0, pair.width - lateral + 2 * pair.radius),
      };
    };
  }

  /** One pair's neutral track width and largest pastern radius, metres. */
  interface IPair {
    /** Lateral distance between the pair's neutral hoof endpoints. */
    width: number;
    /** The larger pastern radius of the pair. */
    radius: number;
  }

  /**
   * The minimum-jerk share of a figure at a second inside its leg: zero at the
   * leg's ends, one between its ramps.
   */
  function entered(window: IWindow, seconds: number): number {
    return minimumJerk(
      Math.min(
        1,
        (seconds - window.from) / window.blend,
        (window.to - seconds) / window.blend,
      ),
    ).s;
  }
}
