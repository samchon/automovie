/**
 * Climbing a tree by its lower branches, sitting astride one, and climbing
 * down. Register `HumanTreeClimb.climbTree` to use it.
 *
 * The tree is a prop drawn with branches, publishing its `bole` and each
 * `branch<k>` as bars and each `seat<k>` as an astride seat. A climb grips
 * the lowest branch, walks the feet up the bole, hooks a heel over the
 * branch and stands on it, then climbs branch to branch, one hand or foot
 * moving at a time so three contacts bear between moves. A sit lowers the
 * seat astride a branch's seat, the legs hanging either side. A descent
 * reverses the climb to the lowest branch, then hangs from it and drops to
 * the ground, or walks down the bole. A lowest branch beyond the standing
 * reach, or a stance that loads a branch past its rupture load, is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three moves, what each reads and the refusals.
 * @evidence contracts/development/design.md#principled-representation A discriminated union on kind; each names the tree and a branch by its index from the lowest.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registered vocabulary entry; planTreeClimb in motions is the only consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every hold, seat and load comes from the tree's affordances.
 */
export namespace IAutoMovieMotionHumanTreeClimb {
  /**
   * Climb from the ground to stand on a branch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The tree and the branch stood on at the end.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the climb reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The branch's place comes from the tree.
   */
  export interface IClimb {
    /** Discriminant: a climb. */
    kind: "climb";

    /** Subject of the tree prop. */
    tree: string;

    /** The branch stood on at the end, from 0, the lowest. */
    branch: number;
  }

  /**
   * Sit astride the branch stood on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The tree and the branch sat on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the sit reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The seat comes from the tree.
   */
  export interface ISit {
    /** Discriminant: a sit. */
    kind: "sit";

    /** Subject of the tree prop. */
    tree: string;

    /** The branch stood on and then sat astride, from 0. */
    branch: number;
  }

  /**
   * Climb down from the branch stood on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and default.
   * @evidence contracts/development/design.md#principled-representation The tree, the branch left and how the ground is reached.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the descent reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The branches' places come from the tree.
   */
  export interface IDescend {
    /** Discriminant: a descent. */
    kind: "descend";

    /** Subject of the tree prop. */
    tree: string;

    /** The branch stood on at the start, from 0. */
    branch: number;

    /** Hang from the lowest branch and drop to the ground; walk down the bole when false. True when absent. */
    drop?: boolean;
  }

  /**
   * Parameters: a climb, a sit or a descent.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; planTreeClimb owns the reach and load refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the variants and the admission owners.
   * @evidence contracts/development/design.md#principled-representation A closed discriminated union on kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The variants planTreeClimb dispatches on.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are separated by kind rather than optional fields.
   */
  export type IParams = IClimb | ISit | IDescend;
}
