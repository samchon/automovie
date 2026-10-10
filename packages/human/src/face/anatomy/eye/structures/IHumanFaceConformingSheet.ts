import type { IHumanFaceConformingSheetVertex } from "./IHumanFaceConformingSheetVertex";

/**
 * A material sheet triangulated along actual source-host edges. The shell and
 * mapping reader consume this same incidence, including every boundary cut.
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
