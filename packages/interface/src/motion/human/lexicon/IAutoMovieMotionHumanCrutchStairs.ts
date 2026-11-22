import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanClimbStairsFlight } from "../terrain/IAutoMovieMotionHumanClimbStairsFlight";

/**
 * Climb a flight of stairs on two crutches (#3994), the injured leg held off
 * the steps, by the rule "up with the good, down with the bad" (HealthLinkBC,
 * Using crutches): going up, the sound leg steps up first and the crutches
 * follow onto its tread; going down, the crutches go down first and the sound
 * leg follows them. The hands bear on the crutches' handgrips throughout.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both orders, their source and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The flight as the climb gives it, the two crutch props, the injured side and the time of each step.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `HumanCrutchStairs` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A riser or tread the body cannot climb, crutches without a grip and a tip, or a time of no length is refused at runtime.
 */
export interface IAutoMovieMotionHumanCrutchStairs
  extends IAutoMovieMotionHumanClimbStairsFlight.IStairs {
  /** The crutch at the left side, a prop with a `grip` and a `tip`, standing level with the toes. */
  left: string;

  /** The crutch at the right side, a prop with a `grip` and a `tip`, standing level with the toes. */
  right: string;

  /** The injured leg held off the steps; the left when absent. */
  injured?: AutoMovieHumanSide;

  /** Seconds each step takes; 2 when absent (provisional). */
  seconds?: number;
}

export namespace IAutoMovieMotionHumanCrutchStairs {
  /**
   * The stair climb's law and the track that moves each crutch on its clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law and the track reader's inputs, frame and timebase.
   * @evidence contracts/development/design.md#principled-representation The track maps a film second to one crutch's world rigid frame, from its staged frame and the climb's parameters.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The law and the track the scene's two props read, so both share one course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every crutch frame derives from the same flight the law plans.
   */
  export interface ILaw extends IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCrutchStairs> {
    /**
     * From one crutch's staged floor frame, the climb's parameters and the climb's first film second (zero when absent), the crutch's world frame at each film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the start's default, the reader's timebase and the result's frame.
     * @evidence contracts/development/implementation.md#principled-implementation HumanCrutchStairs resolves the same flight its plan climbs, without the body's measures, and each read places the crutch on its tread level or carries it by minimum jerk between two levels along the staged heading.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The law owns the flight; the scene's two crutch props only read frames from the returned reader.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every crutch frame derives from the flight the law plans, with no separately authored prop path.
     * @evidence contracts/development/implementation.md#efficient-algorithms The flight is resolved once per call; each read scans the climb's moves up to the current one, linear in the step count.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned reader reuses its one resolved flight for every film second; the plan resolves its own from the same parameters.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the start frame and the resolved flight, a few moves per step, for as long as the scene holds it.
     */
    track: (
      start: IAutoMovieRigidTransform,
      params: IAutoMovieMotionHumanCrutchStairs,
      startsAt?: number,
    ) => (filmSecond: number) => IAutoMovieRigidTransform;
  }
}
