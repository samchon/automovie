import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceMirror } from "./IHumanSourceMirror.ts";

/**
 * What head landmark selection reads: the generation (neutral skin, head
 * partition, parts and jaw attachment), the base mesh's mirror table and
 * faces, and the head view's vertex addressing.
 *
 * @author Samchon
 */
export interface IHumanSourceHeadLandmarkInput {
  /** The generation whose neutral skin the points are chosen on. */
  generation: IHumanSourceGeneration;

  /** The base mesh's midline and mirror twins. */
  mirror: IHumanSourceMirror;

  /** Base-mesh faces, whose edges trace the midline profile. */
  faces: number[][];


  /** Published face vertex to generation skin sample, for the head view index. */
  faceToG1: Int32Array;
}
