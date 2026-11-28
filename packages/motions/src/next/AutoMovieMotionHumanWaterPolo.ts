import { scoreWaterPoloGoal as scoreWaterPoloGoalLaw } from "../sport/internal/scoreWaterPoloGoal";

/**
 * Reads direct goals from a placed water polo ball.
 */
export namespace AutoMovieMotionHumanWaterPolo {
  /**
   * Credit direct spherical shots that cross the fixed goal mouth.
   *
   * Place the mouth sill at the waterline and its local `+Z` toward the field.
   * A goal requires the entire ball to clear that plane inside the posts and
   * under the bar. A prior contact, capture, or replacement launch can end
   * the scoring opportunity.
   *
   * @param params Placed film, the existing ball ID and the fixed goal.
   * @returns Credited goals in film order, with seconds and world centres.
   * @throws {AutoMovieMotionHumanRefusal} If the goal moves or lacks a level
   *   mouth aperture of positive width and height.
   */
  export const scoreGoal: typeof scoreWaterPoloGoalLaw = scoreWaterPoloGoalLaw;
}
