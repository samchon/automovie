import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieMotionHumanRide } from "@automovie/interface";

/*
 * A rider's response to the horse at a second of an equestrian ride. Collected
 * walk and trot pitch the pelvis against the saddle in early stance, twice a
 * stride, 1.5 and 2.5 degrees (Byström et al., PMID 20525053 and 19469236);
 * canter and gallop rock once a stride and roll toward the lead, at the
 * canter's amplitudes; all fade in and out over the ride's ends. A jump rises
 * to the two-point seat over the approach, holds it in flight (last hind
 * liftoff to first fore landing, Clayton 1989) and settles over the recovery;
 * the trunk folds most at mid-flight. A look back turns on a minimum-jerk share
 * to its peak and back.
 * Parameter input: The stride's gait and phase, the fade's weight, the jump and the
 * look, at a ride second.
 * Returns: The saddle pitch and roll, degrees, the two-point rise, the flight's
 * fold and the look's turn, each 0 to 1 but the angles.
 */
export function humanEquestrianRhythm(
  input: humanEquestrianRhythm.IInput,
): humanEquestrianRhythm.IResponse {
  const { at, active, stride, jump, look } = input;
  const cycle: number = (stride?.phase ?? 0) * 2 * Math.PI;
  const rocking: boolean =
    stride?.gait === "canter" || stride?.gait === "gallop";
  return {
    pitch:
      stride === undefined
        ? 0
        : active *
          Math.sin(rocking ? cycle : 2 * cycle) *
          (1 - Math.cos(cycle)) *
          (stride.gait === "walk" ? 1.5 : 2.5),
    roll: rocking
      ? (stride!.lead === "right" ? -1 : 1) *
        active *
        Math.sin(cycle) *
        (1 - Math.cos(cycle))
      : 0,
    rise: humanEquestrianRhythm.jumping(jump, at),
    airborne:
      jump !== undefined && at > jump[1] && at < jump[2]
        ? Math.sin(Math.PI * ((at - jump[1]) / (jump[2] - jump[1]))) ** 2
        : 0,
    turn:
      look === undefined
        ? 0
        : AutoMovieEngineMotionSampling.minimumJerkShare(
            1 - Math.min(1, Math.abs(at - look.peak) / look.half),
          ),
  };
}

/*
 * The equestrian rhythm.
 */
export namespace humanEquestrianRhythm {
  /*
   * A jump's approach, takeoff, landing and recovery, ride seconds, in order.
   */
  export type Jump = readonly [number, number, number, number];

  /*
   * A stride's gait and how far through it the ride is.
   */
  export interface IStride {
    /*
     * The gait.
     */
    gait: IAutoMovieMotionHumanRide.IEquestrianStride["gait"];

    /*
     * The canter's or gallop's lead.
     */
    lead?: IAutoMovieMotionHumanRide.IEquestrianStride["lead"];

    /*
     * The phase between two touchdowns, 0 to 1.
     */
    phase: number;
  }

  /*
   * A look back over a shoulder.
   */
  export interface ILook {
    /*
     * Ride seconds of the greatest turn.
     */
    peak: number;

    /*
     * Half the turn's seconds.
     */
    half: number;
  }

  /*
   * What the rhythm reads at a second.
   */
  export interface IInput {
    /*
     * Ride seconds.
     */
    at: number;

    /*
     * The gait response's fade weight, 0 to 1.
     */
    active: number;

    /*
     * The stride under way, if any.
     */
    stride?: IStride;

    /*
     * The jump, if any.
     */
    jump?: Jump;

    /*
     * The look back, if any.
     */
    look?: ILook;
  }

  /*
   * The rider's response.
   */
  export interface IResponse {
    /*
     * The saddle's pitch, degrees.
     */
    pitch: number;

    /*
     * The saddle's roll, degrees.
     */
    roll: number;

    /*
     * The two-point rise, 0 to 1.
     */
    rise: number;

    /*
     * The flight's fold, 0 to 1.
     */
    airborne: number;

    /*
     * The look's turn, 0 to 1.
     */
    turn: number;
  }

  /*
   * The phase between adjacent touchdowns, at rest outside the track.
   * Parameter touchdowns: The touchdowns, ride seconds, increasing.
   * Parameter at: Ride seconds.
   * Returns: 0 to 1.
   */
  export function phase(touchdowns: readonly number[], at: number): number {
    let low: number = 0;
    let high: number = touchdowns.length - 1;
    if (high < 1 || at <= touchdowns[low]! || at >= touchdowns[high]!) return 0;
    while (high - low > 1) {
      const middle: number = low + Math.floor((high - low) / 2);
      if (touchdowns[middle]! <= at) low = middle;
      else high = middle;
    }
    return (at - touchdowns[low]!) / (touchdowns[high]! - touchdowns[low]!);
  }

  /*
   * The two-point rise: approached smoothly, held in flight, settled after the
   * landing.
   * Parameter jump: The jump, if any.
   * Parameter at: Ride seconds.
   * Returns: 0 to 1.
   */
  export function jumping(jump: Jump | undefined, at: number): number {
    if (jump === undefined) return 0;
    const [approach, takeoff, landing, recovery]: Jump = jump;
    if (at <= approach || at >= recovery) return 0;
    if (at < takeoff)
      return AutoMovieEngineMotionSampling.minimumJerkShare((at - approach) / (takeoff - approach));
    if (at > landing)
      return AutoMovieEngineMotionSampling.minimumJerkShare((recovery - at) / (recovery - landing));
    return 1;
  }
}
