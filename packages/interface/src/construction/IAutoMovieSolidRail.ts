import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieSolidIntersection } from "./IAutoMovieSolidIntersection";

/**
 * Rail offsets from an intersection point toward the retained surface sides.
 *
 * @evidence contracts/development/design.md#principled-representation Source chart coordinates and world millimetre chords remain distinct, with station or metric-square part offset modes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidRail.at delegates to explain; joins consume the same rails and optional diagnostic quantities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Offset/normal-section failures return a null rail, while source callback exceptions retain their original propagation policy.
 * @evidence contracts/development/common.md#meaningful-documentation Defines mode selection, measurement units and null-versus-throw behavior.
 */
export namespace IAutoMovieSolidRail {
  /**
   * The two rail chart/world readings and offset directions at one traced point.
   *
   * @evidence contracts/development/design.md#principled-representation Links both trimmed endpoints to one contact point and its kept-side chart directions, with host-face identity after atlas traversal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A plain record exposes coordinates, positions and directions needed by ribbons and clipping without another surface model.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not certify normal-section convergence or domain/kept-region membership; sigma uses a positive tie when a square direction's station component is zero.
   * @evidence contracts/development/common.md#meaningful-documentation Gives mm positions, chart coordinates, phase/mode meaning and where unit-world-speed directions are evaluated.
   */
  export interface IRail {
    /** The curve point the rails are read from. */
    curve: IAutoMovieSolidIntersection.IPoint;

    /** Part u at the rail, in its original chart units, usually station millimetres. */
    s: number;

    /** Part v at the rail, in its original periodic chart units; equal to the curve's own v in station mode. */
    phi: number;

    /** Sign of the part's kept side in its station, +1 or -1 (under the `square` mode, the sign of `partAcross`'s station part). */
    sigma: number;

    /** The part's offset direction in its chart, from the curve's preimage toward its rail, the chart vector of unit world speed at the preimage. */
    partAcross: [number, number];

    /** The part's rail point, mm. */
    partPoint: AutoMovieVector3Tuple;

    /** The host face its rail lies on (`IAutoMovieSolidAtlas`); the curve's own face unless the offset crossed a trim. */
    hostFace: number;

    /** Host rail [u,v] in hostFace's own chart units; these need not match the curve's starting host face. */
    host: [number, number];

    /** Original outward direction projected into the rail face's tangent plane, as a chart vector of unit world speed. */
    across: [number, number];

    /** The host's rail point, mm. */
    hostPoint: AutoMovieVector3Tuple;
  }

  /**
   * Which side of the host the part keeps: merge outside, cutter diff inside.
   *
   * @evidence contracts/development/design.md#principled-representation The closed choice determines the part offset's sign against the host's outward normal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One literal union shares the same side convention across merge/diff and rail evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Selects a side without inferring it from a fixture or a sampled mesh.
   * @evidence contracts/development/common.md#meaningful-documentation Names which solid's kept side changes and the merge/diff mapping.
   */
  export type Keep = "outside" | "inside";

  /**
   * Part-offset mode: fixed-phase station line or metric-square normal section.
   *
   * @evidence contracts/development/design.md#principled-representation Station mode preserves a phase column; square mode uses the inverse first fundamental form to define a transverse world direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A closed discriminator selects only the part strategy; the host keeps its metric-square strategy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed station width is accepted only in station mode, without silently converting it to a chord.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes chart-station and world-square offset semantics.
   */
  export type Mode = "station" | "square";

  /**
   * The rails at a curve point with the reading of every premise the solve checks: the quantities it computed, in the order computed, and,
   * when it returns no rail, the premise that failed.
   *
   * @evidence contracts/development/design.md#principled-representation The rail and a nullable refusal partition success from the failed premise; quantities are the solve's own numbers keyed by what they measure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record reports what `at` already computes, so a join can name a refusal without a second solver.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It changes no solve, threshold or result: `at` returns exactly its rail.
   * @evidence contracts/development/common.md#meaningful-documentation States the units of the recorded quantities: mm, chart units and dimensionless dot products.
   */
  export interface IExplanation {
    /** The rails, or null. */
    rail: IAutoMovieSolidRail.IRail | null;

    /** The failed premise, or null with a rail. */
    refusal: string | null;

    /** Fresh mutable observations reached before success/refusal. Widths and world residuals use mm (squared chord residuals mm²); chart coordinates keep source units, and dot products/counts are dimensionless where their names indicate. Keys are diagnostic, not a fixed schema. */
    quantities: Record<string, number>;
  }

  /**
   * Part rail request passed by at to the common explanatory solver.
   * A number is a positive chord length in millimetres; an object fixes the
   * absolute part u-coordinate and requires station mode. The fixed station
   * must lie strictly toward the kept side of the intersection point.
   *
   * @evidence contracts/development/design.md#principled-representation A number/object union distinguishes physical chord distance from absolute chart station.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SolidRail.at forwards the unchanged request to explain.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts explain rejects fixed stations in square mode and wrong-sided stations; valid finite source charts remain caller/domain-reader premises.
   * @evidence contracts/development/common.md#meaningful-documentation Gives both alternatives' units and the mode/kept-side condition.
   */
  export type IAtPartWidth =
    | number
    | {
        /** Absolute part u-coordinate, usually physical station millimetres, toward its kept side. */
        station: number;
      };
}
