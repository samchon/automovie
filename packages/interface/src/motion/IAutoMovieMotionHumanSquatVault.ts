/**
 * A squat vault over a box: the hands set on the near edge of the box's top,
 * the body tucked over them, a push-off into a flight over the box and a
 * landing on both feet beyond its far edge.
 *
 * The support phase is the support planner's (`support`): from standing the
 * palms are laid on the top at its near edge, then the body tucks over the
 * hands alone in the floor laws' squat (`getUp.POSES`). The flight is ballistic
 * in the root from the push-off under standard gravity
 * (`AutoMovieEngineGravity.STANDARD`), on the least-speed arc from the tucked root to
 * the landing's (the push that reaches it with the least effort), the joints
 * blended from the tuck to the landing on minimum-jerk shares; the flight is
 * declared without turns, so the flight pass gives the whole body's rotation
 * from the angular momentum of none (`IAutoMovieMotionHumanFlight`,
 * `HumanPerformanceFlight`). The landing is the stand law's quiet stance
 * (`stand.posture`, its joints `getUp.quiet`) with the heels a foot's length
 * past the far edge (provisional), held for `seconds`.
 *
 * The box is the prop's own `surface` affordance: its point the top's middle
 * and its declared `depth` along the prop's own Z, the far edge the end of that
 * depth farther along the heading. A landing that lies no farther ahead than
 * the push-off is refused: no flight carries the body over the box to it.
 * Events: `handsDown`, `tucked` (the push-off), `touchdown`.
 */
export namespace IAutoMovieMotionHumanSquatVault {
  /** Parameters. */
  export interface IParams {
    /**
     * The box vaulted over, its subject id; its `surface` is the top the hands
     * are set on.
     */
    on: string;

    /** How long the landing is held, seconds; 0.5 when absent. */
    hold?: number;
  }
}
