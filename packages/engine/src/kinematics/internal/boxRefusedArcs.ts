import type {
  IAutoMovieAngleRange,
  IAutoMovieBoxExcludedSwivels,
  IAutoMovieJointConstraint,
  IAutoMovieSwivelArcs,
} from "@automovie/interface";

import { ROM_TOLERANCE } from "../../rom/ROM_TOLERANCE";
import { swivelArcs } from "../swivelArcs";
import { swivelJointReadings } from "../swivelJointReadings";

/*
 * The arcs of swivels a joint's three-angle box provably refuses in each of the
 * two charts `decomposeJointRotationOnBasis` chooses between, for a joint whose
 * bone-local rotation is a fixed rotation turned about a fixed axis by the
 * swivel (the chain root of `hingedArmSwivel.pose`), as `boxExcludedSwivels`
 * states them: each clinical bound is a sinusoid of the swivel
 * (`swivelJointReadings.bounds`; Tolani, Goswami and Badler 2000, section
 * 3.2.3), refused on the arc where it exceeds `MARGIN` (`swivelArcs.above`), an
 * abduction ceiling that rises with flexion at its highest
 * (`swivelJointReadings.interval`). A swing cone (`swingDeg`) couples flexion
 * and abduction, so its boundary is no sinusoid's root: it is refused on each
 * one-degree piece of the turn where its closed-form bound over the piece
 * certainly exceeds it (`swivelJointReadings.coneExceeded`), the only limit
 * read piece by piece. The pieces are found by halving the turn: an interval
 * the cone certainly exceeds is refused whole and one it certainly stays within
 * (`swivelJointReadings.coneWithin`) holds none, so only the pieces near the
 * cone's boundary are read one by one.
 * Parameter props: The joint and its rotation by swivel; `joint` is not read.
 * Returns: Each chart's merged refused arcs, degrees, the principal chart
 * first; every swivel where they cover a turn; none for an unconstrained
 * joint or one gated by swing and twist, whose box no chart reads.
 */
export function boxRefusedArcs(
  props: IAutoMovieBoxExcludedSwivels.IProps,
): [IRefused, IRefused] {
  const constraint: IAutoMovieJointConstraint | null = props.constraint;
  if (
    constraint === null ||
    (constraint.swingTwist !== undefined && constraint.swingTwist !== null)
  )
    return [[], []];
  const reading: IReading = swivelJointReadings.of(props.basis, props.rotation);
  const cone: swivelJointReadings.ICone | null = swivelJointReadings.cone(
    constraint,
    props.frame,
    reading,
  );
  const chart = (alternate: boolean): IRefused => {
    const arcs: IAutoMovieSwivelArcs.IArc[] = [];
    for (const axis of swivelJointReadings.AXES) {
      const range: IAutoMovieAngleRange | null = swivelJointReadings.interval(
        constraint,
        axis,
      );
      if (range === null) continue;
      for (const bound of swivelJointReadings.bounds(
        reading[axis],
        swivelJointReadings.rig(range, props.frame?.[axis]),
        alternate,
      )) {
        const arc: IAutoMovieSwivelArcs.IArc | "all" | null = swivelArcs.above(
          bound,
          MARGIN,
        );
        if (arc === "all") return "all";
        if (arc !== null) arcs.push(arc);
      }
    }
    if (cone !== null) {
      const axes: IRefused = swivelArcs.union(arcs);
      // The cone's refused pieces by interval bisection on the piece grid
      // (branch and bound, Moore 1966, "Interval Analysis"): an interval the
      // axes refuse already is left, one the cone certainly exceeds is refused
      // whole, one it certainly stays within holds no refused piece, and any
      // other is halved down to single pieces. Every bound over an interval
      // holds over each of its pieces, so the refused pieces are exactly the
      // grid's.
      const refine = (low: number, high: number): void => {
        if (swivelArcs.covers(axes, low, high)) return;
        if (
          swivelJointReadings.coneExceeded(cone, low, high, alternate, MARGIN)
        ) {
          arcs.push({ from: low, to: high });
          return;
        }
        if (
          high - low <= PIECE ||
          swivelJointReadings.coneWithin(cone, low, high, alternate, MARGIN)
        )
          return;
        const middle: number =
          low + PIECE * Math.floor((high - low) / (2 * PIECE));
        refine(low, middle);
        refine(middle, high);
      };
      refine(0, TURN);
    }
    return swivelArcs.union(arcs);
  };
  return [chart(false), chart(true)];
}

/*
 * One chart's merged refused arcs, or every swivel.
 */
type IRefused = IAutoMovieSwivelArcs.IArc[] | "all";

/*
 * A joint's three angles as the swivel reads them (`swivelJointReadings.of`).
 */
type IReading = ReturnType<typeof swivelJointReadings.of>;

/*
 * The piece of swivels, degrees, a cone's refusal is read over: the sweep's
 * step (`hingedArmSwivel.STEP`), over which the sinusoids' ranges stay tight.
 */
const PIECE: number = 1;

/*
 * A full turn of swivels, degrees.
 */
const TURN: number = 360;

/*
 * How far past a bound, in sine or projected units, a reading must lie to be
 * refused: the joints' tolerance (`ROM_TOLERANCE`) in radians, past the
 * rounding of every step and the decomposition's gimbal band.
 */
const MARGIN: number = (ROM_TOLERANCE * Math.PI) / 180;
