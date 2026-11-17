import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Data and callback contracts shared by the ResolveHydrodynamicForce operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Segment volume and submerged volume are cubic metres; centre and surface are world metres, relative velocity is metres per second, density is kilograms per cubic metre and output forces are world newtons. resolveHydrodynamicForce rejects nonpositive volume or density; other finite geometry remains caller-supplied.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieResolveHydrodynamicForce contracts used by packages/engine/src/motion/resolveHydrodynamicForce.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Segment volume and submerged volume are cubic metres; centre and surface are world metres, relative velocity is metres per second, density is kilograms per cubic metre and output forces are world newtons. resolveHydrodynamicForce rejects nonpositive volume or density; other finite geometry remains caller-supplied. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveHydrodynamicForce contract belongs to interface; packages/engine/src/motion/resolveHydrodynamicForce.ts and packages/motions/src/perform/HumanWater.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieResolveHydrodynamicForce {
  /**
   * One segment in the water.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Segment volume and submerged volume are cubic metres; centre and surface are world metres, relative velocity is metres per second, density is kilograms per cubic metre and output forces are world newtons. resolveHydrodynamicForce rejects nonpositive volume or density; other finite geometry remains caller-supplied.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveHydrodynamicForce.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Segment volume and submerged volume are cubic metres; centre and surface are world metres, relative velocity is metres per second, density is kilograms per cubic metre and output forces are world newtons. resolveHydrodynamicForce rejects nonpositive volume or density; other finite geometry remains caller-supplied. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveHydrodynamicForce.IProps contract belongs to interface; packages/engine/src/motion/resolveHydrodynamicForce.ts and packages/motions/src/perform/HumanWater.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IProps {
    /** The segment's volume, m³ (`volume`). */
    volume: number;

    /** Its centre, world metres. */
    centre: IAutoMovieVector3;

    /** Its centre's velocity relative to the water, m/s. */
    velocity: IAutoMovieVector3;

    /** The water plane's height, world metres. */
    surface: number;

    /** The water's density, kg/m³; `WATER` when absent. */
    density?: number;

    /** Gravitational acceleration, m/s²; standard when absent. */
    gravity?: number;
  }

  /**
   * The water's forces on a segment.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Segment volume and submerged volume are cubic metres; centre and surface are world metres, relative velocity is metres per second, density is kilograms per cubic metre and output forces are world newtons. resolveHydrodynamicForce rejects nonpositive volume or density; other finite geometry remains caller-supplied.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveHydrodynamicForce.IForce keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Segment volume and submerged volume are cubic metres; centre and surface are world metres, relative velocity is metres per second, density is kilograms per cubic metre and output forces are world newtons. resolveHydrodynamicForce rejects nonpositive volume or density; other finite geometry remains caller-supplied. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveHydrodynamicForce.IForce contract belongs to interface; packages/engine/src/motion/resolveHydrodynamicForce.ts and packages/motions/src/perform/HumanWater.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IForce {
    /** The volume under the plane, m³. */
    submerged: number;

    /** The buoyant force, world newtons. */
    buoyancy: IAutoMovieVector3;

    /** The drag, world newtons. */
    drag: IAutoMovieVector3;
  }
}
