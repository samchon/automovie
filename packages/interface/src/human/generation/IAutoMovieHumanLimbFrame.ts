import type { IAutoMovieLoftFrame } from "../../construction/IAutoMovieLoftFrame";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanLimbFrame; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLimbFrame {
  /** One section sampled at a station: its frame and its ring of world points.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One section sampled at a station: its frame and its ring of world points.
   * @evidence contracts/development/design.md#principled-representation `station`: Station along the chain, mm, increasing toward the parent. `frame`: The section's plane. `ring`: One world point per control point, in phase order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootReflection.sample. Read by AutoMovieHumanLimbFrame.controls, AutoMovieHumanLimbFrame.layer, AutoMovieHumanLimbFrame.layers. Also types AutoMovieHumanFootBodyChain.here, AutoMovieHumanFootToeChain.here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `station`, `frame`, `ring`; callers supply the complete record.
   */
  export interface ISample {
    /** Station along the chain, mm, increasing toward the parent. */
    station: number;

    /** The section's plane. */
    frame: IAutoMovieLoftFrame.IFrame;

    /** One world point per control point, in phase order. */
    ring: AutoMovieVector3Tuple[];
  }

  /** Result of AutoMovieHumanLimbFrame.controls. Spline controls and lift of a ring in its frame.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Spline controls and lift of a ring in its frame.
   * @evidence contracts/development/design.md#principled-representation `coefficients`: Section's packed closed-curve coefficients in its physical local chart, millimetres. `lift`: Material-frame lift coefficients carried with the section, in the owning curve's declared parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLimbFrame.IControlsResult is the canonical exchange used by AutoMovieHumanLimbFrame.controls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `coefficients`, `lift`; callers supply the complete record.
   */
  export type IControlsResult = {
    /** Section's packed closed-curve coefficients in its physical local chart, millimetres. */
    coefficients: number[];
    /** Material-frame lift coefficients carried with the section, in the owning curve's declared parameter. */
    lift: number[];
  };
}
