import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";

/**
 * A support interval's root lift over its share, planned once and read by every
 * displayed sample (`prepareSupportInterval`): the lift that clears the held
 * legs of the floor is fitted at knots, the interval's two ends first, and read
 * between two knots on the line through them. An interval is split at its
 * middle when the middle's own lift departs from that line by more than the
 * solver's millimetre (`HumanArmTrajectoryTerms.TOLERANCE`), down to the frame
 * grid's share of the interval, as an adaptive tessellation keeps a curve
 * within its tolerance (the root's height is a smooth function of the share
 * wherever the bound is active or idle, and kinked where it switches, which the
 * split resolves to the grid). A knot reads its own fit exactly, so a held leg
 * reads at most that millimetre under its bound at a judged middle, far inside
 * the floor audit's 5 mm. Every knot is fitted as the course is prepared, the
 * whole interval tessellated at once, and a read descends the prepared tree.
 *
 * @param least The shortest share an interval is split to: the frame grid's
 *   interval over the interval's seconds.
 * @param exact The exact root lift at a share.
 * @returns The course's reader.
 */
export function prepareSupportLiftCourse(
  least: number,
  exact: prepareSupportLiftCourse.Exact,
): prepareSupportLiftCourse.ICourse {
  const whole: prepareSupportLiftCourse.IInterval = split(
    { share: 0, lift: exact(0) },
    { share: 1, lift: exact(1) },
    least,
    exact,
  );
  return {
    read: (share: number): number => {
      const at: number = Math.min(1, Math.max(0, share));
      let piece: prepareSupportLiftCourse.IInterval = whole;
      for (;;) {
        if (at === piece.a.share) return piece.a.lift;
        if (at === piece.b.share) return piece.b.lift;
        if (piece.halves === null) break;
        piece =
          at < piece.halves[0].b.share ? piece.halves[0] : piece.halves[1];
      }
      const { a, b }: prepareSupportLiftCourse.IInterval = piece;
      return (
        a.lift + ((b.lift - a.lift) * (at - a.share)) / (b.share - a.share)
      );
    },
  };
}

/**
 * Tessellate an interval between two fitted knots: split at its middle while
 * the middle's lift departs from their line by more than the tolerance and the
 * halves stay no shorter than the least share.
 *
 * @param a The knot at its start.
 * @param b The knot at its end.
 * @param least The shortest share an interval is split to.
 * @param exact The exact root lift at a share.
 * @returns The tessellated interval.
 */
function split(
  a: prepareSupportLiftCourse.IKnot,
  b: prepareSupportLiftCourse.IKnot,
  least: number,
  exact: prepareSupportLiftCourse.Exact,
): prepareSupportLiftCourse.IInterval {
  if (!(b.share - a.share > least)) return { a, b, halves: null };
  const share: number = (a.share + b.share) / 2;
  const middle: prepareSupportLiftCourse.IKnot = { share, lift: exact(share) };
  return Math.abs(middle.lift - (a.lift + b.lift) / 2) >
    prepareSupportLiftCourse.TOLERANCE
    ? {
        a,
        b,
        halves: [
          split(a, middle, least, exact),
          split(middle, b, least, exact),
        ],
      }
    : { a, b, halves: null };
}
/** Companion types and the tolerance of {@link prepareSupportLiftCourse}. */
export namespace prepareSupportLiftCourse {
  /**
   * The farthest a read may depart from the exact lift at a judged middle,
   * metres: the solver's millimetre.
   */
  export const TOLERANCE: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;

  /** The exact root lift at a share of the interval, metres. */
  export type Exact = (share: number) => number;

  /** A planned lift: its reader. */
  export interface ICourse {
    /** The lift at a share, metres, read from the prepared knots. */
    read(share: number): number;
  }

  /** One exact lift. */
  export interface IKnot {
    /** The share of the interval, 0 to 1. */
    share: number;

    /** The root lift there, metres. */
    lift: number;
  }

  /** An interval between two knots, its halves null for a leaf. */
  export interface IInterval {
    /** The knot at its start. */
    a: IKnot;

    /** The knot at its end. */
    b: IKnot;

    /** Its halves, where it was split. */
    halves: Halves;
  }

  /** An interval's halves, or null for a leaf. */
  export type Halves = readonly [IInterval, IInterval] | null;
}
