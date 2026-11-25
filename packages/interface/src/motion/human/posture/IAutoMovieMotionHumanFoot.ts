import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A foot on the floor as a rigid rocker: where its ankle and its sole points
 * are when it pivots about its heel or its ball by a pitch, at a heading.
 *
 * Gait analysis describes stance as three rockers (Perry and Burnfield, Gait
 * Analysis, 2nd ed.): the heel rocker, where the foot rolls down about the heel
 * after initial contact; the ankle rocker, foot flat while the tibia advances;
 * and the forefoot rocker, where the heel rises and the foot turns about the
 * metatarsal heads until toe-off. Each is a rotation of the rigid foot about a
 * floor point, so the contact point stays fixed while the ankle moves, which is
 * what keeps a planted foot from sliding.
 *
 * The foot's geometry is read from the body's own sockets: the heel and ball
 * points relative to the ankle joint at rest, and `mtp`, the toes' joint, the
 * metatarsophalangeal axis the forefoot rocker turns about with the toes flat
 * (Perry and Burnfield), above the ball's floor point. A socket riding the toes
 * bone (the toe tip, when the profile jointed the toes) bends at the ball by
 * the toes' flexion: through the forefoot rocker the toes extend at the
 * metatarsophalangeal joints and stay flat on the floor while the heel rises
 * (Perry and Burnfield), so a walk extends them by the rocker's angle. `pitch`
 * is in degrees about the foot's lateral axis, positive lifting the toes;
 * `toes` is the toes' flexion from the foot in degrees, positive lifting them;
 * `heading` is the foot's yaw about +Y in degrees (0 faces +Z).
 */
export namespace IAutoMovieMotionHumanFoot {
  /** A foot's world placement. */
  export interface IPlacement {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /** A sole socket that bears on the floor. */
  export type Socket = (readonly ["heel", "ball", "toe"])[number];

  /** A sole socket's place on a displayed foot. */
  export interface ISocket {
    /** Which socket. */
    socket: IAutoMovieMotionHumanFoot.Socket;

    /** Where it is, world metres. */
    point: IAutoMovieVector3;
  }

  /**
   * Where the ankle goes, and how far the toes extend, when a planted foot
   * reaches a rotation other than the one asked for: the foot turns about its
   * contact, which stays where the goal put it, and the toes take back the
   * pitch the foot lost, so they stay on the floor. When the shank leans past
   * the ankle's dorsal range, this is the heel-off of the terminal stance
   * rocker (Perry and Burnfield): the heel rises about the ball and the toes
   * dorsiflex at the metatarsophalangeal joints. Result returned by
   * HumanFoot.heelOff. The ankle point and the toes' added flexion, degrees,
   * positive lifting them.
   */
  export type IHeelOffResult = {
    /**
     * Ankle position in world metres after lifting the heel about the toe
     * support.
     */
    ankle: IAutoMovieVector3;
    /**
     * ADDED toe-joint flexion in clinical degrees, positive lifting the toes;
     * added to existing flexion to keep the sole contact.
     */
    toes: number;
  };
}
