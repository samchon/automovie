import type { IHumanSourceOrbitalSkinSide } from "./IHumanSourceOrbitalSkinSide.ts";

/**
 * Same-root neutral orbital skin authoring, separate from lid cage seating.
 *
 * @author Samchon
 */
export interface IHumanSourceOrbitalSkinReceipt {
  /** Reproducible authoring rule identity. */
  revision: string;

  /** Globe clearance read from the runtime lid-seat owner, metres. */
  posteriorClearanceMetres: number;

  /** Projected inward distance over which boundary heights blend to clearance, metres. */
  blendReachMetres: number;

  /** Unit, axes and projection used to select the source skin. */
  frame: string;

  /** Actual selection and distance readings before and after authoring, per side. */
  sides: IHumanSourceOrbitalSkinSide[];

  /** Scientific and consumer limits of this shared-source authoring. */
  qualification: string;
}
