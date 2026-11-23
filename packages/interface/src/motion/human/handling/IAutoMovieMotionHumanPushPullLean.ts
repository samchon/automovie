/**
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
export namespace IAutoMovieMotionHumanPushPullLean {
  /**
   * A load's declared level: Lett and McGill's (2006) three weight-stack loads,
   * 45.5, 222.5 and 400.5 N.
   */
  export type Load = "light" | "moderate" | "heavy";

  /**
   * The ways the table is measured for: a push walking forward and a pull
   * walking backward.
   */
  export type Way = "push" | "pull";
}
