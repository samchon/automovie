import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";

/**
 * A support interval's root lift over its share, planned once and read by
 * every displayed sample (`prepareSupportInterval`): the lift that clears the
 * held legs of the floor is fitted at knots, the interval's two ends first,
 * and read between two knots on the line through them. An interval is split
 * at its middle when the middle's own lift departs from that line by more
 * than the solver's millimetre (`HumanArmTrajectoryTerms.TOLERANCE`), down to
 * the frame grid's share of the interval, as an adaptive tessellation keeps a
 * curve within its tolerance (the root's height is a smooth function of the
 * share wherever the bound is active or idle, and kinked where it switches,
 * which the split resolves to the grid). A knot reads its own fit exactly, so
 * a held leg reads at most that millimetre under its bound at a judged middle,
 * far inside the floor audit's 5 mm. Knots are fitted on first demand, judged
 * along the path a read descends, and kept until the schedule settles.
 *
 * @param least The shortest share an interval is split to: the frame grid's interval over the interval's seconds.
 * @returns The course's reader and its release.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is planned, how it is read, the split rule with its tolerance and grid, the error it admits and when knots are made and dropped.
 * @evidence contracts/development/implementation.md#principled-implementation Adaptive piecewise-linear sampling of a scalar function of the share, each interval judged once at its middle against the solver's millimetre and refined to the frame grid; a knot is the exact lift the caller fits.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fit the ends, descend judging each interval once, interpolate at the leaf.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every knot is the caller's exact lift; an interval is kept whole only where its middle's lift is within the tolerance of the line.
 * @evidence contracts/development/implementation.md#efficient-algorithms One exact lift a knot, at most the share over the grid's halvings deep along a read's path; a read past judged intervals costs a descent and one interpolation, with no fit.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Knots and judgements are kept and shared by every read until `clear`, which the interval calls when the schedule settles and its observations change.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps at most two knots a grid interval of the share until `clear`.
 */
export function prepareSupportLiftCourse(
  least: number,
): prepareSupportLiftCourse.ICourse {
  let whole: prepareSupportLiftCourse.IInterval | undefined;
  return {
    read: (share: number, exact: prepareSupportLiftCourse.Exact): number => {
      const at: number = Math.min(1, Math.max(0, share));
      whole ??= {
        a: { share: 0, lift: exact(0) },
        b: { share: 1, lift: exact(1) },
      };
      let piece: prepareSupportLiftCourse.IInterval = whole;
      for (;;) {
        if (at === piece.a.share) return piece.a.lift;
        if (at === piece.b.share) return piece.b.lift;
        if (piece.halves === undefined) {
          const { a, b }: prepareSupportLiftCourse.IInterval = piece;
          if (!(b.share - a.share > least)) piece.halves = null;
          else {
            const middle: prepareSupportLiftCourse.IKnot = {
              share: (a.share + b.share) / 2,
              lift: exact((a.share + b.share) / 2),
            };
            piece.halves =
              Math.abs(middle.lift - (a.lift + b.lift) / 2) >
              prepareSupportLiftCourse.TOLERANCE
                ? [
                    { a, b: middle },
                    { a: middle, b },
                  ]
                : null;
          }
        }
        if (piece.halves === null) break;
        piece = at < piece.halves[0].b.share ? piece.halves[0] : piece.halves[1];
      }
      const { a, b }: prepareSupportLiftCourse.IInterval = piece;
      return a.lift + ((b.lift - a.lift) * (at - a.share)) / (b.share - a.share);
    },
    clear: (): void => {
      whole = undefined;
    },
  };
}

/**
 * Companion types and the tolerance of {@link prepareSupportLiftCourse}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
 * @evidence contracts/development/design.md#principled-representation Knots of a scalar on the share in a binary refinement, and one reader.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `prepareSupportInterval` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tolerance is the solver's millimetre.
 */
export namespace prepareSupportLiftCourse {
  /** The farthest a read may depart from the exact lift at a judged middle, metres: the solver's millimetre. */
  export const TOLERANCE: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;

  /** The exact root lift at a share of the interval, metres. */
  export type Exact = (share: number) => number;

  /** A planned lift: its reader and its release. */
  export interface ICourse {
    /** The lift at a share, metres, fitted through `exact` where a knot is needed. */
    read(share: number, exact: Exact): number;

    /** Drop every knot, for observations that changed. */
    clear(): void;
  }

  /** One exact lift. */
  export interface IKnot {
    /** The share of the interval, 0 to 1. */
    share: number;

    /** The root lift there, metres. */
    lift: number;
  }

  /** An interval between two knots, its halves undefined until judged and null for a leaf. */
  export interface IInterval {
    /** The knot at its start. */
    a: IKnot;

    /** The knot at its end. */
    b: IKnot;

    /** Its halves, where it was split. */
    halves?: Halves;
  }

  /** An interval's halves, or null for a leaf. */
  export type Halves = readonly [IInterval, IInterval] | null;
}
