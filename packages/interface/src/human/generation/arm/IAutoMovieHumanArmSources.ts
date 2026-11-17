import type { IAutoMovieHumanArmConstruction } from "../IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanBodyLane } from "../IAutoMovieHumanBodyLane";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanLimbRest } from "../IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanSiteViewPart } from "../limb/IAutoMovieHumanSiteViewPart";

/** Type contracts exchanged by AutoMovieHumanArmSources; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmSources {
  /** Source-only capabilities; no full body, raw loft or proximal join is implied.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Source-only capabilities; no full body, raw loft or proximal join is implied.
   * @evidence contracts/development/design.md#principled-representation `digitNames`: Existing digit names without authoring their geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmSources.create. Also types AutoMovieHumanLimbSources.arms, AutoMovieHumanLimbSources.previous.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `digitNames`; callers supply the complete record.
   */
  export interface IOutput {
    /** Same arm definition used by production and the hand contact owner. */
    definition(): IAutoMovieHumanSiteViewPart.IDefinition;

    /** Explicit production arm metadata; its trunk fold is assembly-owned. */
    arm(): Omit<IAutoMovieHumanBodyLane.ISide["arm"], "trunk">;

    /** Existing digit names without authoring their geometry. */
    digitNames: readonly string[];

    /** Request one actual digit while reusing its shared palm controls. */
    digit(name: string): IAutoMovieHumanBodyLane.IDigit | undefined;

    /** Explicit all-digit request used only by full assembly. */
    fingers(): IAutoMovieHumanBodyLane.IDigit[];
  }

  /** The arm's actual inputs; no other source, curve or mesh is required.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The arm's actual inputs; no other source, curve or mesh is required.
   * @evidence contracts/development/design.md#principled-representation `side`: Side-qualified source names. `rest`: The same direct rest definition later used by bind bones. `arms`: Public arm/hand dimensions, calibration mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanArmSources.names, AutoMovieHumanArmSources.create. Also types AutoMovieHumanArmSources.side, AutoMovieHumanArmSources.{ shoulder, elbow, wrist }.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `side`, `rest`, `arms`, `measures`, `scale`; callers supply the complete record.
   */
  export interface IInput {
    /** Side-qualified source names. */
    side: "left" | "right";

    /** The same direct rest definition later used by bind bones. */
    rest: IAutoMovieHumanLimbRest.IArm;

    /** Public arm/hand dimensions, calibration mm. */
    arms: IAutoMovieHumanArmConstruction.IInputs & {
      /** Requested full shoulder breadth across both deltoids, calibration millimetres. */
      bideltoid: number;
    };

    /** Resolved public measures used by the original digit law. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Calibration scale. */
    scale: number;
  }
}
