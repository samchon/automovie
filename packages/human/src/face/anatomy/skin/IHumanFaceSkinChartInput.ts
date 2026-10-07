import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";

/**
 * Registered source material disks and one current native skin host.
 * The host must own the surface's exact incidence. The source supplies the
 * reference metric, and all requested native anchors must belong to one disk.
 *
 * @evidence contracts/common.md#principled-implementation Source incidence and registered material coordinates define correspondence independently of the current host state.
 * @evidence contracts/common.md#clear-and-simple-design Names the source reference, shared frame reader and required native anchors in one input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no anatomical axis, preferred nearest sheet or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the source-reference metric from the current geometric host.
 * @evidence contracts/modeling.md#spatial-conventions Reference and current coordinates use canonical head-frame metres; material coordinates are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries The source-reference chart and current host retain the same native winding while the host alone supplies current positions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no anatomical control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow consumer observes the lifted geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The chart is a source geometry convention.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart owner checks native support.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Supplies no personal curve or vertex field.
 * @author Samchon
 */
export interface IHumanFaceSkinChartInput {
  /** Source reference geometry, native incidence and registered material disks. */
  surface: IAutoMovieHumanFaceBasisSurface;

  /** Publisher-owned anatomical course domain; overlapping disks are never interchangeable. */
  domain: string;

  /** The current immutable host owning point and normal transport. */
  host: IHumanFaceSkinHost;

  /** Registered source-band vertices whose inverse must retain native identity. */
  supportVertices: readonly number[];
}
