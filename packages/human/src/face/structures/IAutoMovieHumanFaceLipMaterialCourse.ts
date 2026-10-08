import type { IHumanExactFractionJson } from "../../common/measure/IHumanExactFractionJson";
import type { IAutoMovieHumanFaceAttachmentChart } from "./IAutoMovieHumanFaceAttachmentChart";
import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/** Continuous source-authored interior contact trajectory on native facets.
 * Material coordinates locate the source; the actual performed interpolation
 * owns metres, along and height. Persisted exact weights retain correspondence
 * while represented weights use the canonical engine interpolation unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Native triangle seats and original source stops retain continuous correspondence without replacing edge cuts by vertices.
 * @evidence contracts/common.md#clear-and-simple-design One disk, point table and stop ordinals describe the trajectory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference XYZ, nearest-sheet selection or independently normalized weights enter.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes exact persisted identity, represented interpolation and source-authored trajectory from clinical anatomy.
 * @evidence contracts/modeling.md#shared-boundaries Native facet and edge seats retain one source identity for oral joins and contact.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates and weights are dimensionless; consumers read canonical head-frame metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Registers an existing skin surface without making a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authored channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Records correspondence without emitting geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consuming face/person assemblies own rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The trajectory is a source-authoring convention, not acquired histology or a clinical fissure.
 * @evidenceExclude contracts/anatomy.md#permitted-range Contact consumers retain movable, tissue and residual limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Source metadata adds no personal coordinate or sculpt input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLipMaterialCourse {
  /** Same-generation positive native source disk. */
  chart: IAutoMovieHumanFaceAttachmentChart;

  /** Canonical represented attachment interpolation coefficients. */
  points: IAutoMovieHumanFaceAttachmentPoint[];

  /** Original reduced weights; represented coefficients round once from these. */
  exactWeights: IHumanExactFractionJson[][];

  /** Canonical source-parent/weight identities, independent of coordinates. */
  identities: string[];

  /** Exact original vertex, or null for a facet/edge point. */
  nativeVertices: (number | null)[];

  /** Original stop indices in the ordered point table. */
  stops: number[];
}
