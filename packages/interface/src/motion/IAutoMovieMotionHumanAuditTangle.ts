import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * How deep a displayed body's own parts pass into one another: the tangle a
 * limb crossing through the trunk, a hand buried in the head or two legs run
 * through each other shows on screen.
 *
 * Every collider segment carries probes: the corners of its shapes as drawn,
 * and three points along its bone from its joint to each child joint, so a limb
 * that crosses another like an X, with no corner inside, is still read by its
 * axis. A probe's depth in another segment is how far it lies below that
 * segment's surface, exactly for a convex hull (the least distance to its face
 * planes) and by the engine's shape distance otherwise.
 *
 * Two readings are removed because they are the body's build and not the
 * motion's doing:
 *
 * - Pairs that are one part or share a joint: a bone and its parent, or the
 *   nearest ancestor that carries a collider when the bones between carry none
 *   (the upper arm and the chest meet at the shoulder girdle, whose clavicle
 *   bone has no collider of its own); their colliders overlap at the joint by
 *   construction and fold into each other as it bends, within its range of
 *   motion. Also the hand with its own fingers, and the foot with its toes;
 * - What two segments already share in the body's two reference postures, the
 *   rest T-pose it was modelled in and the quiet stance every performer starts
 *   from (`stand.posture`): the thighs meet at the crotch as the body was
 *   modelled, and the hanging upper arm lies against the ribs, where flesh
 *   gives and a convex collider does not. Two such surfaces slide along each
 *   other as the body moves (a walking arm passes the flank it hangs against),
 *   so a corner's depth counts only beyond the deepest any corner of its
 *   segment lies in the other in either reference posture: the practice of a
 *   self-collision matrix, which sets aside the pairs that collide in the
 *   default pose (Chitta, Sucan and Cousins 2012, MoveIt, IEEE Robot Autom Mag
 *   19:18). Where that reference depth is itself more than the skin gives
 *   (`BUILT`), the two convex colliders occupy one volume by their build, as
 *   the upper arm's and the trunk's do along the flank, and their corners are
 *   set aside altogether, as that matrix does; below it the reference depth is
 *   kept as the allowance. A point of a bone's axis keeps its own reference
 *   depth in every pair, so a limb that crosses another is read in full however
 *   much their surfaces share. A tangle of the quiet stance itself is not this
 *   reading's to find.
 *
 * A caller may also exempt the hand a law declares in contact with the person's
 * own body from the bone that carries the touched region, for the span of that
 * contact window (`exemptions`): the hand is meant to lie there. An arm's
 * segment a law declares lying on a segment of the same person (a self-hug's
 * forearm on the other forearm or on the chest) is read against that segment
 * only beyond `BUILT` over its window: a resting forearm may press the skin as
 * far as it gives, and no deeper.
 */
export namespace IAutoMovieMotionHumanAuditTangle {
  /** One pair of segments that pass into each other. */
  export interface IPair {
    /** The segment whose probe lies deepest. */
    a: AutoMovieHumanoidBone;

    /** The segment it lies in. */
    b: AutoMovieHumanoidBone;

    /** How deep beyond the rest pose, metres, positive. */
    depth: number;

    /** The film second of that depth; zero for a single pose. */
    seconds: number;
  }

  /**
   * Read a person's self-penetration over the whole motion. The reading of
   * {@link measure}.
   */
  export interface IResult {
    /** The deepest pair. */
    worst: IAutoMovieMotionHumanAuditMeasure;

    /**
     * Every unordered pair that passed into each other at some instant, its
     * deepest instant, deepest first.
     */
    pairs: IAutoMovieMotionHumanAuditTangle.IPair[];
  }
}
