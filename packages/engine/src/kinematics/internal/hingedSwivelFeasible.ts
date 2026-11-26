import type {
  IAutoMovieBoxExcludedSwivels,
  IAutoMovieJointConstraint,
  IAutoMovieSwivelArcs,
} from "@automovie/interface";

import { boxRefusedArcs } from "../boxRefusedArcs";
import { swingTwistRefusedArcs } from "../swingTwistRefusedArcs";
import { swivelArcs } from "../swivelArcs";

/**
 * The feasible swivels of a chain's root joint: the intervals of the swivel its
 * limits leave, for a root whose bone-local rotation is a fixed rotation turned
 * about a fixed axis by the swivel (Tolani, Goswami and Badler 2000, section
 * 3.2.3: each joint limit maps to intervals of the swivel angle, and the
 * feasible swivels are their intersection).
 *
 * They are the complement of the arcs the root's range provably refuses: a
 * box's in either chart `decomposeJointRotationOnBasis` chooses between, so a
 * swivel either chart admits is feasible (`boxRefusedArcs`), and a swing-twist
 * gate's (`swingTwistRefusedArcs`). Every refusal is certain, so every legal
 * swivel lies in a feasible interval; a feasible interval may still hold
 * swivels the full score refuses, where a limit's analysis says less than the
 * range (a swing region's radius below its greatest, a box axis without an
 * interval). The intervals are closed form but for a swing cone, read per
 * one-degree piece (`boxRefusedArcs`).
 *
 * @param props The root joint and its rotation by swivel.
 * @returns The disjoint feasible arcs, degrees, each starting in [0, 360);
 *   every swivel when nothing is refused; none when every swivel is.
 */
export function hingedSwivelFeasible(
  props: IAutoMovieBoxExcludedSwivels.IProps,
): IAutoMovieSwivelArcs.IArc[] | "all" {
  const constraint: IAutoMovieJointConstraint | null = props.constraint;
  if (constraint === null) return "all";
  if (constraint.swingTwist !== undefined && constraint.swingTwist !== null) {
    const refused: IAutoMovieSwivelArcs.IArc[] | "all" =
      swingTwistRefusedArcs(props);
    return refused !== "all" && refused.length === 0
      ? "all"
      : swivelArcs.complement(refused);
  }
  const [principal, alternate]: [
    IAutoMovieSwivelArcs.IArc[] | "all",
    IAutoMovieSwivelArcs.IArc[] | "all",
  ] = boxRefusedArcs(props);
  if (
    (principal !== "all" && principal.length === 0) ||
    (alternate !== "all" && alternate.length === 0)
  )
    return "all";
  const feasible: IAutoMovieSwivelArcs.IArc[] | "all" = swivelArcs.union([
    ...swivelArcs.complement(principal),
    ...swivelArcs.complement(alternate),
  ]);
  // The union keeps each arc a turn either way too; one copy starts in the
  // turn from 0.
  return feasible === "all"
    ? "all"
    : feasible.filter(
        (arc: IAutoMovieSwivelArcs.IArc): boolean =>
          arc.from >= 0 && arc.from < 360,
      );
}
