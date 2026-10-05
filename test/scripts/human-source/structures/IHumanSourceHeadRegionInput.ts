import type { IHumanSourceMirror } from "./IHumanSourceMirror.ts";

/**
 * What head region selection reads: the base mesh's faces and mirror table,
 * the base faces under each subdivided sample, and the head view's vertex
 * addressing.
 *
 * @author Samchon
 */
export interface IHumanSourceHeadRegionInput {
  /** Base-mesh faces. */
  faces: number[][];

  /** The base mesh's midline and mirror twins. */
  mirror: IHumanSourceMirror;

  /** Base faces each subdivided sample lies on (`mapHumanSourceSampleFaces`). */
  sampleFaces: number[][];

  /** Published face vertex to generation skin sample. */
  faceToG1: Int32Array;
}
