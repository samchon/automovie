import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingStroke } from "./StrikingStroke";

/**
 * A stopped weapon riding the body it met: after a strike's limb has stopped
 * on another person, that person keeps moving (a cover still closing, a
 * trunk still turning), and a limb held at the world point of the contact
 * would be run through by the surface it rests on. The ride gives the limb's
 * goal way before that surface.
 *
 * The contact is one-sided: the met segment's rigid motion since the stop,
 * read at the weapon's point nearest the met body, is applied to the limb's
 * goal only along the contact normal (out of the met body toward the weapon)
 * and only outward, so the limb is pushed off by a surface advancing into it
 * from any side (a covering glove closing across the line as much as one
 * coming down it) and is never dragged after one that withdraws, the
 * non-penetration constraint of a frictionless contact. The push is what the
 * surface has advanced along the normal less what the law's own goal has
 * moved away from the contact along it since the stop: whole while the weapon
 * rests on the surface for the dwell ({@link StrikingStroke.DWELL}), gone once
 * the law's withdrawal outruns the surface, and held where the law's path
 * would carry the limb back into the surface (a guard that lies beyond a
 * contact made early, near the striker's own body).
 *
 * Two people's poses can each depend on the other's (each rides the other's
 * arm), so the met segment is read on a fixed grid of film seconds from the
 * stop, memoised in ascending order, and a pose reads the grid two steps
 * behind its own second: every read reaches strictly earlier nodes, whatever
 * the other person's pose reads back.
 */
export namespace StrikingRide {
  /**
   * The grid's step and half the lag behind the shown second, seconds: half
   * the 1/120 s step of the performance's contact resolution, so the lag is
   * one resolution step.
   */
  export const STEP: number = 1 / 240;

  /** What a ride is built from. */
  export interface IProps {
    /**
     * The person the weapon met, read at call time.
     *
     * @returns Their body and bone query.
     */
    other(): IHumanActionContext.IPerformer;

    /** Film second of the stop. */
    stop: number;

    /**
     * The stopped limb's own goal point as its law shows it, before any ride.
     *
     * @param seconds Film seconds; read at the stop only.
     * @returns World metres.
     */
    goal(seconds: number): IAutoMovieVector3;

    /**
     * The met weapon's axis from the performer's own shown bones.
     *
     * @param seconds Film seconds, at or before the stop.
     * @returns The axis ends, world metres.
     */
    axis(seconds: number): readonly [IAutoMovieVector3, IAutoMovieVector3];
  }

  /** A built ride. */
  export interface IRide {
    /**
     * A posture with one limb's goal carried by the met segment.
     *
     * @param posture The law's posture at the second.
     * @param limb The stopped limb.
     * @param seconds Film seconds.
     * @returns The posture, unchanged until two grid steps past the stop.
     */
    carry(
      posture: IHumanPosture,
      limb: IHumanPosture.Limb,
      seconds: number,
    ): IHumanPosture;
  }

  /**
   * The step of the central differences that read the met surface's normal,
   * metres: 1 mm, well under every collider radius, so both samples lie on
   * the same side of the surface the weapon touches.
   */
  const NORMAL_STEP: number = 0.001;

  /** The intervals the weapon's axis is sampled in for its point nearest the met body. */
  const AXIS_SAMPLES: number = 8;

  /** Where the weapon touched the met body at the stop. */
  interface IContact {
    /** The weapon's axis point nearest the met body, world metres. */
    point: IAutoMovieVector3;

    /** The unit normal out of the met body toward the weapon. */
    normal: IAutoMovieVector3;
  }

  /** The met segment's world frame at a grid node. */
  interface IFrame {
    /** Its joint, world metres. */
    position: IAutoMovieVector3;

    /** Its world rotation. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * Build a ride.
   *
   * @param props The stop, the met person and the weapon's axis.
   * @returns The ride, memoising the met segment's frames for its life.
   * @throws {Error} From `carry`, when a grid node is read before the nodes under it are known, which the two-step lag excludes.
   */
  export function create(props: IProps): IRide {
    const frames: IFrame[] = [];
    let bone: AutoMovieHumanoidBone | undefined;
    let touch: IContact | null | undefined;
    let held: IAutoMovieVector3 | undefined;
    let filling: boolean = false;

    // Nodes are filled in ascending order: filling a node reads the other
    // person at that node's second, and whatever that read asks of this ride
    // lies at least one node earlier.
    const frame = (index: number): IFrame => {
      if (index < frames.length) return frames[index]!;
      if (filling)
        throw new Error("A ride's frame was read before the frames under it");
      filling = true;
      try {
        while (frames.length <= index) {
          const other: IHumanActionContext.IPerformer = props.other();
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            other.bones(props.stop + frames.length * STEP);
          if (bone === undefined) {
            const [a, b] = props.axis(props.stop);
            bone = HumanColliders.distanceToSegment(
              other.body,
              bones,
              a,
              b,
            ).bone;
          }
          const resolved: IAutoMovieResolvedBone = bones.get(bone)!;
          frames.push({
            position: resolved.worldPosition,
            rotation: resolved.worldRotation,
          });
        }
      } finally {
        filling = false;
      }
      return frames[index]!;
    };

    // The contact at the stop: the point of the weapon's axis nearest the met
    // body, and the unit normal out of that body toward the weapon, the
    // gradient of the body's signed distance as the axis is translated
    // (central differences of NORMAL_STEP). Null when the gradient vanishes,
    // where no side of the surface is defined and nothing is carried.
    const contact = (): IContact | null => {
      if (touch !== undefined) return touch;
      const other: IHumanActionContext.IPerformer = props.other();
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        other.bones(props.stop);
      const [a, b] = props.axis(props.stop);
      const gap = (shift: IAutoMovieVector3): number =>
        HumanColliders.distanceToSegment(
          other.body,
          bones,
          Vector3.add(a, shift),
          Vector3.add(b, shift),
        ).distance;
      const axis = (k: 0 | 1 | 2): IAutoMovieVector3 => ({
        x: k === 0 ? NORMAL_STEP : 0,
        y: k === 1 ? NORMAL_STEP : 0,
        z: k === 2 ? NORMAL_STEP : 0,
      });
      const slope = (k: 0 | 1 | 2): number =>
        gap(axis(k)) - gap(Vector3.scale(axis(k), -1));
      const gradient: IAutoMovieVector3 = {
        x: slope(0),
        y: slope(1),
        z: slope(2),
      };
      let point: IAutoMovieVector3 = a;
      let least: number = Number.POSITIVE_INFINITY;
      for (let i: number = 0; i <= AXIS_SAMPLES; i++) {
        const at: IAutoMovieVector3 = Vector3.lerp(a, b, i / AXIS_SAMPLES);
        const d: number = HumanColliders.distance(
          other.body,
          bones,
          at,
        ).distance;
        if (d < least) {
          least = d;
          point = at;
        }
      }
      touch =
        Vector3.length(gradient) > 1e-9
          ? { point, normal: Vector3.normalize(gradient) }
          : null;
      return touch;
    };

    // A world point moved by the met segment's rigid motion from the stop to
    // a node.
    const moved = (
      point: IAutoMovieVector3,
      from: IFrame,
      to: IFrame,
    ): IAutoMovieVector3 =>
      Vector3.add(
        to.position,
        Quaternion.rotateVector(
          Quaternion.multiply(to.rotation, Quaternion.inverse(from.rotation)),
          Vector3.subtract(point, from.position),
        ),
      );

    return {
      carry: (
        posture: IHumanPosture,
        limb: IHumanPosture.Limb,
        seconds: number,
      ): IHumanPosture => {
        const goal: IHumanPosture.IGoal | undefined = posture.limbs[limb];
        const lagged: number = seconds - 2 * STEP - props.stop;
        if (goal === undefined || goal.on !== undefined || !(lagged > 0))
          return posture;
        const met: IContact | null = contact();
        if (met === null) return posture;

        // How far the surface has come toward the weapon along the normal,
        // less how far the law's own goal has gone away from it.
        const index: number = Math.floor(lagged / STEP);
        const share: number = lagged / STEP - index;
        const first: IFrame = frame(0);
        const low: IFrame = frame(index);
        const high: IFrame = frame(index + 1);
        const advanced: number = Vector3.dot(
          Vector3.subtract(
            Vector3.lerp(
              moved(met.point, first, low),
              moved(met.point, first, high),
              share,
            ),
            met.point,
          ),
          met.normal,
        );
        held ??= props.goal(props.stop);
        const withdrawn: number = Vector3.dot(
          Vector3.subtract(goal.point, held),
          met.normal,
        );
        const pushed: number = Math.max(0, advanced - withdrawn);
        if (pushed === 0) return posture;
        const shift: IAutoMovieVector3 = Vector3.scale(met.normal, pushed);
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            [limb]: {
              ...goal,
              point: Vector3.add(goal.point, shift),
              bend: Vector3.add(goal.bend, shift),
            },
          },
        };
      },
    };
  }
}
