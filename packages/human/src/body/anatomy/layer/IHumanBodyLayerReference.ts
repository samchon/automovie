import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One oriented sheet that internal parts must stay inside.
 *
 * A reference is a skin surface or a face derived from one, such as the
 * fascial face under the subcutaneous layer. It may be open: a body's faces
 * are open at the collar, where the head's skin continues them.
 *
 * @author Samchon
 */
export interface IHumanBodyLayerReference {
  /** Name the reading reports this sheet under. */
  name: string;

  /** Outward-oriented surface, possibly open. */
  mesh: IAutoMovieMesh;
}
