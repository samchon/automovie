import type { IHumanFaceIrisDisc } from "./IHumanFaceIrisDisc";
import type { IHumanFaceIrisTexels } from "./IHumanFaceIrisTexels";

/**
 * One eye prepared for painting on a decoded globe texture: its located iris
 * disc, the texels on that disc and the mean sclera colour just outside it.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisPaintedEye {
  /** Eye owner painted on the texture. */
  eye: string;

  /** Located iris disc of the eye's neutral globe. */
  disc: IHumanFaceIrisDisc;

  /** Texels of the texture that lie on that disc. */
  texels: IHumanFaceIrisTexels;

  /** Mean linear sclera colour just outside the painted iris. */
  sclera: [number, number, number];
}
