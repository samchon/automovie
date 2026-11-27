import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanActionLaw } from "./IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanClimbStairsFlight } from "./IAutoMovieMotionHumanClimbStairsFlight";

/**
 * Climb a flight of stairs on two crutches, the injured leg held off the steps,
 * by the rule "up with the good, down with the bad" (HealthLinkBC, Using
 * crutches): going up, the sound leg steps up first and the crutches follow
 * onto its tread; going down, the crutches go down first and the sound leg
 * follows them. The hands bear on the crutches' handgrips throughout.
 */
export interface IAutoMovieMotionHumanCrutchStairs
  extends IAutoMovieMotionHumanClimbStairsFlight.IStairs {
  /**
   * The crutch at the left side, a prop with a `grip` and a `tip`, standing
   * level with the toes.
   */
  left: string;

  /**
   * The crutch at the right side, a prop with a `grip` and a `tip`, standing
   * level with the toes.
   */
  right: string;

  /** The injured leg held off the steps; the left when absent. */
  injured?: AutoMovieHumanSide;

  /** Seconds each step takes; 2 when absent (provisional). */
  seconds?: number;
}

export namespace IAutoMovieMotionHumanCrutchStairs {
  /** The stair climb's law and the track that moves each crutch on its clock. */
  export interface ILaw extends IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCrutchStairs> {
    /**
     * From one crutch's staged floor frame, the climb's parameters and the
     * climb's first film second (zero when absent), the crutch's world frame at
     * each film second.
     */
    track: (
      start: IAutoMovieRigidTransform,
      params: IAutoMovieMotionHumanCrutchStairs,
      startsAt?: number,
    ) => (filmSecond: number) => IAutoMovieRigidTransform;
  }
}
