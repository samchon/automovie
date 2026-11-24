import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * How far a prop the right hand of `a` picked up moves in that hand's own
 * frame, from the grip's closing to the film's end: the largest distance of the
 * prop's origin, read in the hand's frame every half second, from where it lay
 * a millisecond after the pick-up's `gripClosed`. The
 * `test_human_motion_prop_held_*` readers hold it within the campaign's 1 mm
 * bound for a grip; a grip is a rigid relation, so a slide shows at every later
 * reading and no instant between two readings hides one.
 *
 * @param performance A film whose first segment of `a` picks the prop up with
 *   the right hand.
 * @param prop The prop's subject.
 * @returns The largest drift, metres.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the window, the sampling, what is returned and why the sampling cannot hide a slide.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the displayed hand and the displayed prop frame of the public performance and expresses the prop's origin in the hand's frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One seat function, one reference reading and one sweep.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every reading from the grip's closing to the film's end is compared; a missing `gripClosed` event gives NaN, which no bound admits.
 * @evidence contracts/development/implementation.md#efficient-algorithms One hand and one prop reading per half second of the held span.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the held-prop readers, `motionPropHeldAttitude` for the glass and `motionPropHeldUse` for the phone, so the reading exists once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionPropHeldDrift(
  performance: IAutoMovieMotionHumanPerformance,
  prop: string,
): number {
  const pick: IAutoMovieMotionHumanSegment = performance.segments("a")[0]!;
  const from: number =
    pick.start +
    (pick.plan.events.find((e): boolean => e.name === "gripClosed")?.share ??
      NaN) *
      pick.plan.duration +
    1e-3;
  const seat = (seconds: number): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = performance
      .bones("a", seconds)
      .get("rightHand")!;
    return Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(
        performance.prop(prop, seconds).position,
        hand.worldPosition,
      ),
    );
  };
  const first: IAutoMovieVector3 = seat(from);
  let worst: number = 0;
  for (
    let seconds: number = from + 0.5;
    seconds <= performance.duration;
    seconds += 0.5
  )
    worst = Math.max(
      worst,
      Vector3.length(Vector3.subtract(seat(seconds), first)),
    );
  return worst;
}
