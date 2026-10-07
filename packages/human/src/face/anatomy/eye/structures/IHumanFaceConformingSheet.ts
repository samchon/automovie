import type { IHumanFaceConformingSheetVertex } from "./IHumanFaceConformingSheetVertex";

/**
 * A material sheet triangulated along actual source-host edges. The shell and
 * mapping reader consume this same incidence, including every boundary cut.
 *
 * @evidence contracts/common.md#principled-implementation Vertex attachment, sheet incidence and boundary order describe one overlay instead of separate sampled reconstructions.
 * @evidence contracts/common.md#clear-and-simple-design One result serves spatial sampling, shell closure and mapping observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No alternative diagnostic triangulation substitutes for emitted incidence.
 * @evidence contracts/common.md#meaningful-documentation States shared consumers and source-triangle correspondence.
 * @evidence contracts/modeling.md#shared-boundaries Both offset sheets and walls consume the same boundary edges.
 * @evidence contracts/modeling.md#spatial-conventions Indices and triangle ordinals are dimensionless topology.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This transient representation does not create another anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The producer determines overlay population.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes the final shell.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal authoring input.
 *
 * @author Samchon
 */
export interface IHumanFaceConformingSheet {
  /** Shared overlay vertices, each with its actual material attachment. */
  vertices: IHumanFaceConformingSheetVertex[];

  /** Triangle triples preserving each original grid triangle's orientation. */
  indices: number[];

  /** Actual host triangle ordinal for every emitted triangle. */
  sourceTriangles: number[];

  /** One ordered closed boundary, with direction matching sheet incidence. */
  boundaryEdges: [number, number][];
}
