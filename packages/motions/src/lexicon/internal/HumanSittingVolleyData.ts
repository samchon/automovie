import type { AutoMovieHumanSide, IAutoMovieRigidTransform } from "@automovie/interface";
import { humanSittingVolleyPhases } from "./humanSittingVolleyPhases";

export namespace HumanSittingVolleyData {
  /*
   * Arm sides used in the forearm platform.
   */
  export const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

  /*
   * The shares at the authored palm plant, release and receive.
   */
  export const PLANT: number = humanSittingVolleyPhases.PLANT;

  export const RELEASE: number = humanSittingVolleyPhases.RELEASE;

  export const RECEIVE: number = humanSittingVolleyPhases.RECEIVE;

  /*
   * Maximum free scoot, in thigh lengths, and maximum trunk inclination, in
   * degrees.
   */
  export const SHIFT: number = 0.5;

  export const LEAN: number = 50;

  /*
   * Forward wrist clearance from the pressing shoulder's shadow, in hand lengths.
   */
  export const PRESS_AHEAD: number = 0.5;

  /*
   * Same-side clearance from the pressing shoulder's shadow, in hand lengths.
   */
  export const PRESS_OUT: number = 0.1;

  /*
   * World-space wrist fit tolerance in metres.
   */
  export const FIT: number = 0.01;

  /*
   * Ground and seated rest frame used to carry the low-body and recovered arm
   * goals.
   */
  export const ORIGIN: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
}
