import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
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
 * The contact is one-sided: the met segment's rigid motion since the stop is
 * applied to the limb's goal only along the line the weapon arrived on and
 * only against the arrival, so the limb is pushed back by a surface advancing
 * into it and is never dragged after one that withdraws. The displacement
 * fades on the same minimum-jerk clock on which the strike laws withdraw the
 * limb after the dwell ({@link StrikingStroke.DWELL}), so it is whole while
 * the weapon rests on the surface and gone when the action ends.
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

    /** Film second the action ends, by which the ride has faded. */
    end: number;

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
    let back: IAutoMovieVector3 | null | undefined;
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

    // The unit direction back along the weapon's arrival: its axis' middle
    // over the last grid step before the stop, reversed. Null when the weapon
    // was at rest, where no line of arrival exists and nothing is carried.
    const arrival = (): IAutoMovieVector3 | null => {
      if (back !== undefined) return back;
      const middle = (seconds: number): IAutoMovieVector3 => {
        const [a, b] = props.axis(seconds);
        return Vector3.lerp(a, b, 0.5);
      };
      const travel: IAutoMovieVector3 = Vector3.subtract(
        middle(props.stop - STEP),
        middle(props.stop),
      );
      back = Vector3.length(travel) > 1e-9 ? Vector3.normalize(travel) : null;
      return back;
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
        const fade: number =
          1 -
          minimumJerk(
            (seconds - props.stop - StrikingStroke.DWELL) /
              Math.max(1e-3, props.end - props.stop - StrikingStroke.DWELL),
          ).s;
        if (!(fade > 0)) return posture;
        const toward: IAutoMovieVector3 | null = arrival();
        if (toward === null) return posture;

        const index: number = Math.floor(lagged / STEP);
        const share: number = lagged / STEP - index;
        const first: IFrame = frame(0);
        const low: IFrame = frame(index);
        const high: IFrame = frame(index + 1);
        const pushed: number = Math.max(
          0,
          Vector3.dot(
            Vector3.subtract(
              Vector3.lerp(
                moved(goal.point, first, low),
                moved(goal.point, first, high),
                share,
              ),
              goal.point,
            ),
            toward,
          ),
        );
        if (pushed === 0) return posture;
        const shift: IAutoMovieVector3 = Vector3.scale(toward, fade * pushed);
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
