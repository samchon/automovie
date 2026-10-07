import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceHeadGuide } from "./IHumanSourceHeadGuide.ts";
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

  /** The published face, whose lips, skin and contact the mouth rules read at rest. */
  face: IAutoMovieHumanFaceBasis;

  /** Published face vertex to generation skin sample, for the head view index. */
  faceToG1: Int32Array;

  /** Native authoring to canonical root, retaining negative retirement entries. */
  nativeToSource?: Int32Array;

  /** Canonical root to native authoring, for the licensed mirror table. */
  sourceToNative?: Int32Array;

  /** Provider's anatomical chart anchors, independent of jaw rig influence. */
  sourceGuide?: IHumanSourceHeadGuide;
}
