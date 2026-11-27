/**
 * Climbing a tree by its lower branches, sitting astride one, and climbing
 * down. Register `HumanTreeClimb.climbTree` to use it.
 *
 * The tree is a prop drawn with branches, publishing its `bole` and each
 * `branch<k>` as bars and each `seat<k>` as an astride seat. A climb grips the
 * lowest branch, walks the feet up the bole, hooks a heel over the branch and
 * stands on it, then climbs branch to branch, one hand or foot moving at a time
 * so three contacts bear between moves. A sit lowers the seat astride a
 * branch's seat, the legs hanging either side. A descent reverses the climb to
 * the lowest branch, then hangs from it and drops to the ground, or walks down
 * the bole. A lowest branch beyond the standing reach, or a stance that loads a
 * branch past its rupture load, is refused.
 *
 * Each hand or foot move takes 0.6 s (provisional), the support-climbing beat
 * of {@link IAutoMovieMotionHumanLadder}.
 */
export namespace IAutoMovieMotionHumanTreeClimb {
  /** Climb from the ground to stand on a branch. */
  export interface IClimb {
    /** Discriminant: a climb. */
    kind: "climb";

    /** Subject of the tree prop. */
    tree: string;

    /** The branch stood on at the end, from 0, the lowest. */
    branch: number;
  }

  /** Sit astride the branch stood on. */
  export interface ISit {
    /** Discriminant: a sit. */
    kind: "sit";

    /** Subject of the tree prop. */
    tree: string;

    /** The branch stood on and then sat astride, from 0. */
    branch: number;
  }

  /** Climb down from the branch stood on. */
  export interface IDescend {
    /** Discriminant: a descent. */
    kind: "descend";

    /** Subject of the tree prop. */
    tree: string;

    /** The branch stood on at the start, from 0. */
    branch: number;

    /**
     * Hang from the lowest branch and drop to the ground; walk down the bole
     * when false. True when absent.
     */
    drop?: boolean;
  }

  /** Parameters: a climb, a sit or a descent. */
  export type IParams = IClimb | ISit | IDescend;
}
