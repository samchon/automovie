import type { IAutoMovieNaturalSpline } from "../../../construction/IAutoMovieNaturalSpline";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLegConstruction } from "../IAutoMovieHumanLegConstruction";

/** Type contracts exchanged by AutoMovieHumanLegLaw; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegLaw {
  /** The fitted law's channels with one person's keys.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The fitted law's channels with one person's keys.
   * @evidence contracts/development/design.md#principled-representation `bottom`: Station of the ankle ring. `length`: Distance between the rings. `ankle`: Ankle ring centre in the canonical plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegLaw.prepare. Read by AutoMovieHumanLegLaw.reachOf, AutoMovieHumanLegLaw.bare, AutoMovieHumanLegLaw.points. Also types AutoMovieHumanLegLaw.family.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bottom`, `length`, `ankle`, `ankleWorld`, `ankleLift`, `crotchOffset`, `crotchCentre`, `inputs`, `profile`, `forward`, `axis`, `shape`, `correction`, `ankleResidual`; callers supply the complete record.
   */
  export interface IFamily {
    /** Station of the ankle ring. */
    bottom: number;

    /** Distance between the rings. */
    length: number;

    /** Ankle ring centre in the canonical plane. */
    ankle: [number, number];

    /** The ankle ring in the canonical frame, world. */
    ankleWorld: AutoMovieVector3Tuple[];

    /** The ring's height off its plane at each phase. */
    ankleLift: number[];

    /** Offset of the law's last centre from the crotch ring's. */
    crotchOffset: [number, number];

    /** Centre the crotch ring is read about. */
    crotchCentre: [number, number];

    /** The tape and control inputs. */
    inputs: IAutoMovieHumanLegConstruction.IInputs;

    /** Log-radius profile along the leg. */
    profile: IAutoMovieNaturalSpline.ISpline;

    /** Forward place of the centre along the leg. */
    forward: IAutoMovieNaturalSpline.ISpline;

    /** The axis's lateral curves. */
    axis: IAutoMovieNaturalSpline.ISpline[];

    /** The shape's Fourier channels. */
    shape: IAutoMovieNaturalSpline.ISpline[];

    /** The radius correction through the ankle and the three tapes. */
    correction: IAutoMovieNaturalSpline.ISpline;

    /** The ankle ring's radius less the law's, at each phase. */
    ankleResidual: number[];
  }

  /** Section of the law before any end residual.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Section of the law before any end residual.
   * @evidence contracts/development/design.md#principled-representation `centre`: Centre in the canonical plane, `[x, z]`. `radii`: Radii at the leg's phases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegLaw.bare. Also types AutoMovieHumanLegLaw.reached, AutoMovieHumanLegLaw.start.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `centre`, `radii`; callers supply the complete record.
   */
  export interface IBare {
    /** Centre in the canonical plane, `[x, z]`. */
    centre: [number, number];

    /** Radii at the leg's phases. */
    radii: number[];
  }
}
