import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieRestFrame,
  IAutoMovieSwivelArcs,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../math/AutoMovieEngineVector3";
import { AutoMovieEngineSwivelArcs } from "./AutoMovieEngineSwivelArcs";
import { AutoMovieEngineSwivelJointReadings } from "./AutoMovieEngineSwivelJointReadings";

/**
 * What the end joint of a chain whose mid segment twists distally (a wrist
 * beyond a forearm) reads of a requested rotation at every swivel: where the
 * mid segment points in the requested rotation's frame, as three sinusoids, and
 * the joint's box in the rest-relative angles those components give.
 *
 * The mid segment's twist turns it about its own long axis `u` and leaves where
 * it points unchanged, and the end joint's own twist is immobile, so with the
 * end joint's world rotation `R` requested, its two free angles are fixed by
 * where the mid segment points alone. The end joint's articulation is `L =
 * Abd(a) Flex(f)` (the proximal order of `decomposeJointRotationOnBasis` with
 * no twist) and `R = M rest L` with `M` the mid segment's world rotation, so `d
 * = R^-1 u_world = L^-1 (rest^-1 u)`. When `rest^-1 u` is the end joint's twist
 * axis (or its opposite, read with `d` negated: `sense`), in the joint's basis
 * coordinates (flexion, abduction, twist) that is `d = (-sin a, cos a sin f,
 * cos a cos f)`: the abduction is the middle angle, read by its sine
 * `-d_flexion`, and the flexion an outer angle, read by the vector
 * `(d_abduction, d_twist)`. The mid segment's world axis is affine in the mid
 * joint's place, which circles the root-to-target line as the swivel turns, so
 * every component of `d` is `a + b cos s + c sin s`, fitted exactly from three
 * swivels.
 */
export namespace AutoMovieEngineDistalEndSwivelReadings {
  /** The readings of one end joint over a turn of the swivel. */
  export interface IReadings {
    /**
     * The direction's component on the joint's flexion axis; the abduction's
     * sine is its negative.
     */
    onFlexion: IAutoMovieSwivelArcs.ISinusoid;

    /** The direction's component on the joint's abduction axis. */
    onAbduction: IAutoMovieSwivelArcs.ISinusoid;

    /** The direction's component on the joint's right-handed twist axis. */
    onTwist: IAutoMovieSwivelArcs.ISinusoid;

    /**
     * The abduction's interval, rest-relative degrees within a quarter turn
     * either way; null when unbounded.
     */
    abduction: readonly [number, number] | null;

    /**
     * The flexion's interval, rest-relative degrees, no wider than a half turn;
     * null when unbounded.
     */
    flexion: readonly [number, number] | null;

    /**
     * Whether the joint's rest carries the mid segment's axis onto its
     * right-handed twist axis (1) or onto the opposite of it (-1); the three
     * components are those of the direction times this sense, which is where
     * the twist axis itself is carried.
     */
    sense: 1 | -1;
  }

  /**
   * What the reader is given: the end joint and the mid segment's direction by
   * swivel.
   */
  export interface IProps {
    /**
     * The end joint's clinical basis, admitted and normalized
     * (`normalizeJointAxes`), in the proximal order.
     */
    basis: IAutoMovieJointAxes;

    /**
     * The rest frame lifting the joint's rest-relative angles to clinical ones;
     * omitted, they are clinical.
     */
    frame?: IAutoMovieRestFrame | undefined;

    /** The joint's resolved range of motion. */
    constraint: IAutoMovieJointConstraint | null;

    /**
     * The mid segment's long axis in the end joint's rest frame (`rest^-1 u`),
     * unit.
     */
    axis: IAutoMovieVector3;

    /**
     * The mid segment's world long axis at a swivel, degrees, in the requested
     * end rotation's frame (`R^-1 u_world`), unit.
     */
    direction: (swivel: number) => IAutoMovieVector3;
  }

  /**
   * Read an end joint over a turn of the swivel.
   *
   * @param props The end joint and the mid segment's direction by swivel.
   * @returns The readings, or null when the analysis does not apply (no range,
   *   a swing-twist gate, a mobile or explicitly reordered twist chart, a rest
   *   that carries the mid segment's axis neither onto the twist axis nor onto
   *   its opposite, an abduction interval past a quarter turn or a flexion
   *   interval wider than a half turn).
   */
  export function of(props: IProps): IReadings | null {
    const constraint: IAutoMovieJointConstraint | null = props.constraint;
    if (constraint === null) return null;
    if (constraint.swingTwist !== undefined && constraint.swingTwist !== null)
      return null;
    if (constraint.twist !== null) return null;
    // The column readings below use the legacy end-joint swing chart.
    if (
      props.basis.rotationOrder !== undefined ||
      props.basis.twistPlacement === "distal"
    )
      return null;
    const basis: IAutoMovieJointAxes = props.basis;
    const handed: 1 | -1 =
      AutoMovieEngineVector3.dot(basis.twist, AutoMovieEngineVector3.cross(basis.flexion, basis.abduction)) >=
      0
        ? 1
        : -1;
    const twist: IAutoMovieVector3 = AutoMovieEngineVector3.scale(basis.twist, handed);

    // The rest carries the mid segment's axis onto the joint's twist axis or
    // onto its opposite (a limb whose bones run against their own twist
    // axis, as one side of a rig that gives both sides one basis). The
    // derivation reads where the twist axis itself is carried, so the
    // opposite sense reads the direction negated.
    const aligned: number = AutoMovieEngineVector3.dot(props.axis, twist);
    if (!(Math.abs(aligned) > 1 - 1e-9)) return null;
    const sense: 1 | -1 = aligned > 0 ? 1 : -1;

    // The direction's three components on the basis, each a sinusoid of the swivel.
    const sampled: IAutoMovieVector3[] = [0, 90, 180].map(props.direction);
    const along = (axis: IAutoMovieVector3): IAutoMovieSwivelArcs.ISinusoid => {
      const [zero, quarter, half] = sampled.map(
        (d: IAutoMovieVector3): number => sense * AutoMovieEngineVector3.dot(d, axis),
      ) as [number, number, number];
      return AutoMovieEngineSwivelArcs.fitted(zero, quarter, half);
    };
    const interval = (
      range: IAutoMovieAngleRange | null,
      axis: "flexion" | "abduction",
    ): readonly [number, number] | null =>
      range === null
        ? null
        : AutoMovieEngineSwivelJointReadings.rig(range, props.frame?.[axis]);
    const abduction: readonly [number, number] | null = interval(
      constraint.abduction,
      "abduction",
    );
    if (abduction !== null && (abduction[0] < -90 || abduction[1] > 90))
      return null;
    const flexion: readonly [number, number] | null = interval(
      constraint.flexion,
      "flexion",
    );
    if (flexion !== null && flexion[1] - flexion[0] > 180) return null;
    return {
      onFlexion: along(basis.flexion),
      onAbduction: along(basis.abduction),
      onTwist: along(twist),
      abduction,
      flexion,
      sense,
    };
  }
}
