import type {
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanPushPullLean,
} from "@automovie/interface";

/*
 * The trunk's incline from the vertical for a haul.
 * Parameter body: The body.
 * Parameter way: The way the load is moved; a drag reads as a push.
 * Parameter load: The declared load level.
 * Parameter height: The handles' height above the floor, metres.
 * Returns: Degrees, positive leaning forward toward the way the body faces,
 * negative leaning back.
 */
export function pushPullLean(
  body: {
    measure: Pick<IAutoMovieBodyMeasure, "waistHeight" | "shoulderHeight">;
  },
  way: OfWay,
  load: IAutoMovieMotionHumanPushPullLean.Load,
  height: number,
): number {
  const table: Record<OfTableEntry, number> =
    pushPullLean.ANGLES[way === "pull" ? "pull" : "push"][load];
  const waist: number = body.measure.waistHeight;
  const shoulder: number = body.measure.shoulderHeight;
  const share: number = Math.min(
    1,
    Math.max(0, (height - waist) / (shoulder - waist)),
  );
  const angle: number = table.waist + (table.shoulder - table.waist) * share;
  return way === "pull" ? -angle : angle;
}

/*
 * How far the trunk leans when a load is pushed, pulled or dragged by its
 * handles, by the load's declared level and the handles' height.
 *
 * The angles are Lett and McGill's (2006, Ergonomics 49:895, figure 9): the
 * peak torso angle, the trunk's lean relative to the hips, of nine men pushing
 * walking forward and pulling walking backward against a cable weight stack,
 * the handle at each one's waist and at each one's shoulder, at three loads.
 * The load levels are theirs: 45.5 N (`light`), 222.5 N (`moderate`, Snook and
 * Ciriello's 1991 acceptable push and pull, which they chose to test) and 400.5
 * N (`heavy`). Each angle is the mean of the four firefighters' and the five
 * students' bars weighted by the groups' sizes, the bars read off the figure to
 * about half a degree.
 *
 * A push leans forward into the load and a pull leans back away from it, the
 * upper body's centre of mass ahead of the feet for a push and behind them for
 * a pull (the paper's hinge torque). A drag behind the body while walking
 * forward leans forward as a push does, the hands' force on the load pointing
 * the way the body walks, and takes the push's angles. A handle between the
 * waist and the shoulder takes the angle between theirs in proportion; below
 * the waist or above the shoulder keeps the nearer one's, as the study measured
 * no other height.
 */
export namespace pushPullLean {
  /*
   * The peak torso angle, degrees, by way, load and handle height (Lett and
   * McGill 2006, figure 9, the two groups' size-weighted mean).
   */
  export const ANGLES: Readonly<
    Record<
      IAutoMovieMotionHumanPushPullLean.Way,
      Record<
        IAutoMovieMotionHumanPushPullLean.Load,
        Record<EntryEntryEntry, number>
      >
    >
  > = {
    push: {
      light: { waist: 7.2, shoulder: 7.0 },
      moderate: { waist: 14.3, shoulder: 17.4 },
      heavy: { waist: 18.7, shoulder: 25.1 },
    },
    pull: {
      light: { waist: 13.8, shoulder: 13.9 },
      moderate: { waist: 14.3, shoulder: 19.1 },
      heavy: { waist: 17.7, shoulder: 21.8 },
    },
  };
}

/*
 * The alternatives of `OfTableEntry`'s site.
 */
type OfTableEntry = "waist" | "shoulder";

/*
 * The alternatives of `OfWay`'s site.
 */
type OfWay = IAutoMovieMotionHumanPushPullLean.Way | "drag";

/*
 * The alternatives of `EntryEntryEntry`'s site.
 */
type EntryEntryEntry = "waist" | "shoulder";
