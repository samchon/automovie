import type { AutoMovieEnginePhysicalBalanceTypes } from "./AutoMovieEnginePhysicalBalanceTypes";
import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMovieEnginePhysicalPlanarPolygon as Polygon } from "./AutoMovieEnginePhysicalPlanarPolygon";

/**
 * A planted limb as the capture-point planner reads it, for a body of any
 * number of limbs: its sole frame, its contact outline in that frame and its
 * side among the others.
 */
export namespace AutoMovieEnginePhysicalSupportSole {
  /** A planted limb: its endpoint bone, side, sole frame and outline. */
  export interface IFoot {
    /** Its endpoint bone. */
    bone: string;

    /** Its side among the planted limbs. */
    side: "left" | "right";

    /** Its sole frame, world x and z. */
    frame: Polygon.IFrame;

    /** Its contact outline in that frame, x forward and y to the left. */
    polygon: Polygon.IPoint[];
  }

  /**
   * A limb's sole frame: origin at its support endpoint (or a given place) and
   * forward along its heading, the limb's as latched when its stance began,
   * else its present one, each relative to its authored rotation, which faces
   * +z.
   *
   * @param sense The body's readings.
   * @param state The recovery's state.
   * @param bone The limb's endpoint bone.
   * @param at A place for the limb, world metres, if any.
   * @returns The sole frame, world x and z.
   */
  export function frame(
    sense: AutoMovieEnginePhysicalBalanceTypes.ISense,
    state: Readonly<IAutoMoviePhysicalRecoveryState>,
    bone: string,
    at?: IAutoMovieVector3,
  ): Polygon.IFrame {
    const rotation: IAutoMovieQuaternion =
      state.seating?.[bone]?.anchor?.rotation ??
      sense.segments.get(bone)!.rotation();
    const turned: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(
        rotation,
        Quaternion.inverse(sense.targets[bone]!.rotation),
      ),
      { x: 0, y: 0, z: 1 },
    );
    const length: number = Math.hypot(turned.x, turned.z);
    const origin: IAutoMovieVector3 = at ?? sense.actual(bone);
    return {
      origin: { x: origin.x, z: origin.z },
      forward:
        length > 0
          ? { x: turned.x / length, z: turned.z / length }
          : { x: 0, z: 1 },
    };
  }

  /**
   * A planted limb: its endpoint bone, its side, its sole frame (`frame`) and
   * its contact outline in that frame.
   *
   * @param sense The body's readings.
   * @param state The recovery's state.
   * @param bone The limb's endpoint bone.
   * @param side Its side.
   * @returns The limb.
   */
  export function foot(
    sense: AutoMovieEnginePhysicalBalanceTypes.ISense,
    state: Readonly<IAutoMoviePhysicalRecoveryState>,
    bone: string,
    side: "left" | "right",
  ): IFoot {
    const sole: Polygon.IFrame = frame(sense, state, bone);
    return {
      bone,
      side,
      frame: sole,
      polygon: Polygon.hull(
        sense
          .footprint(sense.limb(bone), state)
          .points.map(
            (p: IAutoMovieVector3): Polygon.IPoint => Polygon.local(sole, p),
          ),
      ),
    };
  }

  /**
   * Which side a limb is on: left when its endpoint lies left of the other
   * limbs' mean, left being up x the root's heading, which faces +z as
   * authored.
   *
   * @param sense The body's readings.
   * @param bone The limb's endpoint bone.
   * @returns Its side.
   */
  export function side(
    sense: AutoMovieEnginePhysicalBalanceTypes.ISense,
    bone: string,
  ): "left" | "right" {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(
        sense.root.body.rotation(),
        Quaternion.inverse(sense.targets[sense.root.segment.bone]!.rotation),
      ),
      { x: 0, y: 0, z: 1 },
    );
    const at: IAutoMovieVector3 = sense.actual(bone);
    const others: AutoMovieEnginePhysicalBalanceTypes.ILimb[] = sense.limbs.filter(
      (limb: AutoMovieEnginePhysicalBalanceTypes.ILimb): boolean => limb.bone !== bone,
    );
    const mean: IAutoMovieVector3 = Vector3.scale(
      others.reduce(
        (
          sum: IAutoMovieVector3,
          limb: AutoMovieEnginePhysicalBalanceTypes.ILimb,
        ): IAutoMovieVector3 => Vector3.add(sum, sense.actual(limb.bone)),
        { x: 0, y: 0, z: 0 },
      ),
      1 / Math.max(1, others.length),
    );
    return (at.x - mean.x) * forward.z - (at.z - mean.z) * forward.x >= 0
      ? "left"
      : "right";
  }
}
