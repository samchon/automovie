import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanWalkFacing } from "../actions/IAutoMovieMotionHumanWalkFacing";

/**
 * A pushed load's handles held in both hands through a walk: a sled push. The
 * trunk leans into the load while the body stands, the hands go to the handles
 * where the load stands, close on them, and from then on are carried with the
 * chest along the floor at the handles' own height. The body then walks to
 * `to`, slowly with no arm swing, while the arms take the walk's rise and fall
 * and the gripped load stays on the floor.
 *
 * The lean is the trunk's incline from the vertical, a hinge at the hips shared
 * by the pelvis and the spine (at least `lean`, if asked), coming in over
 * `SETTLE` seconds with the arms; lower handles are pushed with the trunk
 * nearer the horizontal, as far as measured pushers incline at the handles'
 * height (`pushSledStance`), and from bent knees, the body sinking as far as
 * keeps each wrist within the arm's reach as the walk rises; the hands reach
 * the handles in that time and grip them from its end, each fist's grip socket
 * on its handle as a grasp lays it (`HumanHand.reach`: the palm into the bar
 * along the handle's `-Y`, the thumb's side along its `+X`), turned about the
 * handle as far as its symmetry makes the same grasp and slid along its grip
 * band to whichever grasp the arm, its wrist within range, keeps nearest the
 * handle through the push (the shared chooser, `HumanFreedomChoice`), so the
 * handle is in the fist. Each hand's place is then kept in the chest's frame
 * for the rest of the push, its turn kept with it; a turn the arm cannot meet
 * gives way about the grip socket.
 *
 * The same hold serves the other ways a load is moved by its handles
 * (`pushPull`): an incline asked outright, leaning back for a pull; a walk
 * facing the load, so the body walks backward and draws it along; a stand in
 * place (`seconds`) instead of the walk; and a load that does not move, whose
 * handles the hands press (a `bear` contact bearing none of the body's weight)
 * instead of gripping, so it stays where it stands.
 *
 * First pass: the load slides with the grip and is not dragged by a friction;
 * the push's force and the slowing it brings to the walk are not modelled.
 */
export namespace IAutoMovieMotionHumanPushSled {
  /** Parameters. */
  export interface IParams {
    /** The pushed prop's subject id. */
    sled: string;

    /** Where the walk goes, world metres. */
    to: IAutoMovieVector3;

    /** The handle the left hand takes, an affordance id; `left` when absent. */
    left?: string;

    /** The handle the right hand takes, an affordance id; `right` when absent. */
    right?: string;

    /**
     * How far the trunk leans into the load at least, degrees from the vertical
     * in [0, `pushSledStance.RANGE`]; absent, the trunk leans as measured
     * pushers do at the handles' height (`pushSledStance.INCLINES`), which a
     * lean beyond it overrides.
     */
    lean?: number;

    /**
     * The trunk's incline from the vertical asked outright, degrees in
     * [-`pushSledStance.RANGE`, `pushSledStance.RANGE`], negative leaning back
     * away from the load; it replaces the measured incline and `lean` (a haul
     * at a declared load, `pushPull`); absent, the measured one.
     */
    incline?: number;

    /**
     * Which way the body faces while it walks
     * (`IAutoMovieMotionHumanWalkParams.facing`), so a pull walks backward
     * facing the load; along the way when absent.
     */
    facing?: IAutoMovieMotionHumanWalkFacing.IFacing;

    /**
     * Seconds to stand in place against the load instead of walking to `to`,
     * the hands on the handles throughout; absent, the body walks.
     */
    duration?: number;

    /**
     * Whether the load moves with the hands; `false` presses the handles
     * without gripping, so the load stays where it stands (a stuck door, a car
     * that will not move); `true` when absent.
     */
    moves?: boolean;
  }
}
