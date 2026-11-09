import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * A foot on the floor as a rigid rocker: where its ankle and its sole points
 * are when it pivots about its heel or its ball by a pitch, at a heading.
 *
 * Gait analysis describes stance as three rockers (Perry and Burnfield, Gait
 * Analysis, 2nd ed.): the heel rocker, where the foot rolls down about the
 * heel after initial contact; the ankle rocker, foot flat while the tibia
 * advances; and the forefoot rocker, where the heel rises and the foot turns
 * about the metatarsal heads until toe-off. Each is a rotation of the rigid
 * foot about a floor point, so the contact point stays fixed while the ankle
 * moves, which is what keeps a planted foot from sliding.
 *
 * The foot's geometry is read from the body's own sockets: the heel and ball
 * points relative to the ankle joint at rest. `pitch` is in degrees about
 * the foot's lateral axis, positive lifting the toes; `heading` is the foot's
 * yaw about +Y in degrees (0 faces +Z).
 */
export namespace HumanFoot {
  /** A foot's world placement. */
  export interface IPlacement {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * The foot's rotation from rest for a heading and a pitch.
   *
   * @param heading Degrees about +Y.
   * @param pitch Degrees, positive toes up.
   * @returns The rotation.
   */
  export function rotation(heading: number, pitch: number): IAutoMovieQuaternion {
    return Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, heading),
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -pitch),
      ),
    );
  }

  /**
   * A sole point's offset from the ankle at rest, in the foot's rest frame.
   *
   * @param body The body.
   * @param side The foot.
   * @param point Which sole point.
   * @returns The offset, metres.
   */
  export function offset(body: IHumanBody, side: "left" | "right", point: "heel" | "ball" | "toe" | "sole"): IAutoMovieVector3 {
    const socket = body.surfaces.sockets[`${point}${side === "left" ? "Left" : "Right"}`];
    return socket.point;
  }

  /**
   * The foot placed by pivoting about a sole point fixed on the floor.
   *
   * @param body The body.
   * @param side The foot.
   * @param pivot Which sole point stays on the floor.
   * @param at Where that point is, world metres.
   * @param heading The foot's heading, degrees.
   * @param pitch The pitch, degrees, positive toes up.
   * @returns The foot's placement.
   */
  export function pivot(
    body: IHumanBody,
    side: "left" | "right",
    pivot: "heel" | "ball" | "toe" | "sole",
    at: IAutoMovieVector3,
    heading: number,
    pitch: number,
  ): IPlacement {
    const r: IAutoMovieQuaternion = rotation(heading, pitch);
    const local: IAutoMovieVector3 = offset(body, side, pivot);
    return { ankle: Vector3.subtract(at, Quaternion.rotateVector(r, local)), rotation: r };
  }

  /**
   * A sole point's world position for a placed foot.
   *
   * @param body The body.
   * @param side The foot.
   * @param point Which sole point.
   * @param foot The foot's placement.
   * @returns The point, world metres.
   */
  export function point(body: IHumanBody, side: "left" | "right", point: "heel" | "ball" | "toe" | "sole", foot: IPlacement): IAutoMovieVector3 {
    return Vector3.add(foot.ankle, Quaternion.rotateVector(foot.rotation, offset(body, side, point)));
  }
}
